"use server";

import { Query, Client, Users } from "node-appwrite";
import { adminAction } from "@/appwrite/adminOrClient";
import { validateAdminSession } from "./auth";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { stripe } from "@/lib/stripe/client";
import type {
  UserDocument,
  ReportDocument,
  FeedbackDocument,
  AuditLogDocument,
} from "@/lib/types/appwrite";

async function requireAdmin() {
  const valid = await validateAdminSession();
  if (!valid) throw new Error("Unauthorized");
}

// ── Overview ──────────────────────────────────────────────

export async function getOverviewStats() {
  await requireAdmin();
  const { databases } = await adminAction();

  const [users, reports, feedback] = await Promise.all([
    databases.listDocuments<UserDocument>(DATABASE_ID, COLLECTION_IDS.USERS, [
      Query.limit(1),
    ]),
    databases.listDocuments<ReportDocument>(DATABASE_ID, COLLECTION_IDS.REPORTS, [
      Query.limit(1),
    ]),
    databases.listDocuments<FeedbackDocument>(DATABASE_ID, COLLECTION_IDS.FEEDBACK, [
      Query.limit(1),
    ]),
  ]);

  // Get plan counts
  const [freeUsers, proUsers, maxUsers] = await Promise.all([
    databases.listDocuments<UserDocument>(DATABASE_ID, COLLECTION_IDS.USERS, [
      Query.equal("pricing_plan", "free"),
      Query.limit(1),
    ]),
    databases.listDocuments<UserDocument>(DATABASE_ID, COLLECTION_IDS.USERS, [
      Query.equal("pricing_plan", "pro"),
      Query.limit(1),
    ]),
    databases.listDocuments<UserDocument>(DATABASE_ID, COLLECTION_IDS.USERS, [
      Query.equal("pricing_plan", "max"),
      Query.limit(1),
    ]),
  ]);

  return {
    totalUsers: users.total,
    freeUsers: freeUsers.total,
    proUsers: proUsers.total,
    maxUsers: maxUsers.total,
    totalReports: reports.total,
    totalFeedback: feedback.total,
  };
}

// ── Users ─────────────────────────────────────────────────

export async function listUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  await requireAdmin();
  const { databases } = await adminAction();

  const offset = (page - 1) * limit;
  const queries = [
    Query.limit(limit),
    Query.offset(offset),
    Query.orderDesc("$createdAt"),
  ];

  if (search) {
    queries.push(Query.or([
      Query.contains("full_name", search),
      Query.contains("email", search),
    ]));
  }

  const result = await databases.listDocuments<UserDocument>(
    DATABASE_ID,
    COLLECTION_IDS.USERS,
    queries
  );

  return {
    users: result.documents,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function getUserDetail(userId: string) {
  await requireAdmin();
  const { databases } = await adminAction();

  const user = await databases.getDocument<UserDocument>(
    DATABASE_ID,
    COLLECTION_IDS.USERS,
    userId
  );

  const reports = await databases.listDocuments<ReportDocument>(
    DATABASE_ID,
    COLLECTION_IDS.REPORTS,
    [Query.equal("user_id", userId), Query.limit(1)]
  );

  return {
    user,
    reportsCount: reports.total,
  };
}

export async function getUserStripeData(userId: string) {
  await requireAdmin();
  const { databases } = await adminAction();

  const user = await databases.getDocument<UserDocument>(
    DATABASE_ID,
    COLLECTION_IDS.USERS,
    userId
  );

  if (!user.stripe_customer_id) {
    return { subscription: null, invoices: [] };
  }

  try {
    const [subscriptions, invoices] = await Promise.all([
      stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        limit: 1,
      }),
      stripe.invoices.list({
        customer: user.stripe_customer_id,
        limit: 20,
      }),
    ]);

    const sub = subscriptions.data[0] ?? null;

    return {
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            startDate: sub.start_date,
            cancelAt: sub.cancel_at,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            plan: sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "Unknown",
          }
        : null,
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        date: inv.created,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        invoiceUrl: inv.hosted_invoice_url,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch Stripe data:", error);
    return { subscription: null, invoices: [] };
  }
}

export async function deleteUserAdmin(userId: string) {
  await requireAdmin();
  const { databases } = await adminAction();

  // Get user for Stripe cleanup
  let stripeCustomerId: string | undefined;
  try {
    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );
    stripeCustomerId = user.stripe_customer_id;
  } catch {
    // User doc may not exist
  }

  // Cancel Stripe subscription if exists
  if (stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
      });
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (error) {
      console.error("Failed to cancel Stripe subscription:", error);
    }
  }

  // Delete user document
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.USERS, userId);
  } catch {
    // May not exist
  }

  // Delete Appwrite auth account
  try {
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    const users = new Users(adminClient);
    await users.delete(userId);
  } catch (error) {
    console.error("Failed to delete Appwrite auth account:", error);
  }

  return { success: true, message: "User deleted" };
}

// ── Reports ───────────────────────────────────────────────

export async function listReports(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const { databases } = await adminAction();

  const offset = (page - 1) * limit;
  const result = await databases.listDocuments<ReportDocument>(
    DATABASE_ID,
    COLLECTION_IDS.REPORTS,
    [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")]
  );

  return {
    reports: result.documents,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

// ── Feedback ──────────────────────────────────────────────

export async function listFeedback(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const { databases } = await adminAction();

  const offset = (page - 1) * limit;
  const result = await databases.listDocuments<FeedbackDocument>(
    DATABASE_ID,
    COLLECTION_IDS.FEEDBACK,
    [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")]
  );

  return {
    feedback: result.documents,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

// ── Subscriptions ─────────────────────────────────────────

export async function listSubscriptions(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const { databases } = await adminAction();

  const offset = (page - 1) * limit;
  const result = await databases.listDocuments<UserDocument>(
    DATABASE_ID,
    COLLECTION_IDS.USERS,
    [
      Query.notEqual("pricing_plan", "free"),
      Query.limit(limit),
      Query.offset(offset),
      Query.orderDesc("$createdAt"),
    ]
  );

  return {
    subscribers: result.documents.map((u) => ({
      userId: u.$id,
      full_name: u.full_name,
      email: u.email,
      pricing_plan: u.pricing_plan,
      stripe_customer_id: u.stripe_customer_id,
      stripe_subscription_id: u.stripe_subscription_id,
      createdAt: u.$createdAt,
    })),
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function getSubscriptionOverview() {
  await requireAdmin();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeSubs, canceledSubs] = await Promise.all([
      stripe.subscriptions.list({
        limit: 100,
        status: "active",
        expand: ["data.items.data.price"],
      }),
      stripe.subscriptions.list({
        limit: 100,
        status: "canceled",
        expand: ["data.items.data.price"],
      }),
    ]);

    const activeCount = activeSubs.data.length;

    const canceledThisMonth = canceledSubs.data.filter(
      (sub) =>
        sub.canceled_at &&
        new Date(sub.canceled_at * 1000) >= startOfMonth
    ).length;

    const mrr = activeSubs.data.reduce((sum, sub) => {
      const price = sub.items.data[0]?.price;
      if (!price || !price.unit_amount) return sum;
      const amount = price.unit_amount / 100;
      if (price.recurring?.interval === "year") {
        return sum + amount / 12;
      }
      return sum + amount;
    }, 0);

    // Recent events: last 10 subscriptions by created date (active + canceled combined)
    const allSubs = [...activeSubs.data, ...canceledSubs.data]
      .sort((a, b) => b.created - a.created)
      .slice(0, 10);

    const recentEvents = allSubs.map((sub) => ({
      id: sub.id,
      status: sub.status,
      created: sub.created,
      canceledAt: sub.canceled_at,
      customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "",
      plan: sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "Unknown",
    }));

    return { activeCount, canceledThisMonth, mrr, recentEvents };
  } catch (error) {
    console.error("Failed to fetch Stripe overview:", error);
    return { activeCount: 0, canceledThisMonth: 0, mrr: 0, recentEvents: [] };
  }
}

// ── Audit Logs ────────────────────────────────────────────

export async function listAuditLogs(page: number = 1, limit: number = 20) {
  await requireAdmin();
  const { databases } = await adminAction();

  const offset = (page - 1) * limit;
  const result = await databases.listDocuments<AuditLogDocument>(
    DATABASE_ID,
    COLLECTION_IDS.AUDIT_LOGS,
    [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")]
  );

  return {
    logs: result.documents,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

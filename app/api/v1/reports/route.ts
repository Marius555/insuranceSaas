import { NextRequest, NextResponse } from "next/server";
import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { Query } from "node-appwrite";
import type { ReportDocument } from "@/lib/types/appwrite";

/**
 * Public API: List public reports
 * Requires API key via Authorization header or ?api_key query param
 *
 * GET /api/v1/reports?limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const apiKey = extractApiKey(request);
  if (!apiKey || apiKey !== process.env.VEHICLECLAIM_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const { databases } = await adminAction();

    const result = await databases.listDocuments<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      [
        Query.equal("is_public", true),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ]
    );

    return NextResponse.json({
      data: result.documents.map((report) => ({
        id: report.$id,
        claimNumber: report.claim_number,
        status: report.claim_status,
        damageType: report.damage_type,
        overallSeverity: report.overall_severity,
        estimatedTotalCost: report.estimated_total_repair_cost,
        confidenceScore: report.confidence_score,
        createdAt: report.analysis_timestamp,
      })),
      total: result.total,
      limit,
      offset,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed to fetch reports",
      },
      { status: 500 }
    );
  }
}

function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return request.nextUrl.searchParams.get("api_key");
}

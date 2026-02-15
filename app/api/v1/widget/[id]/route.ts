import { NextRequest, NextResponse } from "next/server";
import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { fetchFullReportData } from "@/lib/types/appwrite";

/**
 * Embeddable Widget: Returns an HTML snippet for embedding a report summary
 *
 * GET /api/v1/widget/[id]?api_key=xxx
 *
 * Usage in third-party sites:
 * <iframe src="https://yourapp.com/api/v1/widget/REPORT_ID?api_key=KEY" width="400" height="500"></iframe>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey =
    request.nextUrl.searchParams.get("api_key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey || apiKey !== process.env.VEHICLECLAIM_API_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { databases } = await adminAction();
    const data = await fetchFullReportData(
      databases,
      DATABASE_ID,
      COLLECTION_IDS,
      id
    );

    if (!data.report.is_public) {
      return new NextResponse("Report is not publicly accessible", {
        status: 403,
      });
    }

    const { report, damageDetails, assessment } = data;
    const visibleDamages = damageDetails.filter((d) => !d.is_inferred);

    const severityColor: Record<string, string> = {
      minor: "#22c55e",
      moderate: "#eab308",
      severe: "#f97316",
      total_loss: "#ef4444",
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VehicleClaim Report ${report.claim_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a1a; padding: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .claim-number { font-size: 14px; font-weight: 700; color: #374151; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
    .section-header { background: #f9fafb; padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #6b7280; }
    .value { font-size: 13px; font-weight: 600; color: #1f2937; }
    .payout { color: #16a34a; font-size: 16px; }
    .part { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .part:last-child { border-bottom: none; }
    .part-header { display: flex; justify-content: space-between; align-items: center; }
    .part-name { font-size: 13px; font-weight: 600; }
    .part-desc { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .part-action { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 2px; }
    .footer { text-align: center; padding-top: 12px; }
    .footer a { font-size: 11px; color: #6b7280; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <span class="claim-number">${report.claim_number}</span>
    <span class="badge" style="background: ${severityColor[report.overall_severity] || '#9ca3af'}20; color: ${severityColor[report.overall_severity] || '#6b7280'}">
      ${report.overall_severity.replace("_", " ")}
    </span>
  </div>

  <div class="section">
    <div class="section-header">Overview</div>
    <div class="row">
      <span class="label">Damage Type</span>
      <span class="value" style="text-transform: capitalize">${report.damage_type}</span>
    </div>
    <div class="row">
      <span class="label">Confidence</span>
      <span class="value">${(report.confidence_score * 100).toFixed(0)}%</span>
    </div>
    <div class="row">
      <span class="label">Total Estimate</span>
      <span class="value">$${report.estimated_total_repair_cost.toLocaleString("en-US")}</span>
    </div>
    ${assessment ? `<div class="row">
      <span class="label">Estimated Payout</span>
      <span class="value payout">$${assessment.estimated_payout.toLocaleString("en-US")}</span>
    </div>` : ""}
  </div>

  ${visibleDamages.length > 0 ? `
  <div class="section">
    <div class="section-header">Damaged Parts (${visibleDamages.length})</div>
    ${visibleDamages
      .map(
        (d) => `
    <div class="part">
      <div class="part-header">
        <span class="part-name">${d.part_name}</span>
        <span class="badge" style="background: ${severityColor[d.severity] || '#9ca3af'}20; color: ${severityColor[d.severity] || '#6b7280'}">${d.severity}</span>
      </div>
      ${d.estimated_repair_cost ? `<span class="part-desc">${d.estimated_repair_cost}</span>` : ""}
      ${d.repair_or_replace && d.repair_or_replace !== 'undetermined' ? `<span class="part-action">Recommendation: ${d.repair_or_replace}</span>` : ""}
    </div>`
      )
      .join("")}
  </div>
  ` : ""}

  <div class="footer">
    <a href="${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).origin : ""}" target="_blank" rel="noopener">
      Powered by VehicleClaim AI
    </a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Report not found", { status: 404 });
  }
}

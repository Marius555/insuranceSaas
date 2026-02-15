import { NextRequest, NextResponse } from "next/server";
import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { fetchFullReportData } from "@/lib/types/appwrite";
import type {
  ReportDocument,
  ReportDamageDetailDocument,
  ReportVehicleVerificationDocument,
  ReportAssessmentDocument,
} from "@/lib/types/appwrite";

/**
 * Public API: Get report by ID
 * Requires API key via Authorization header or ?api_key query param
 *
 * GET /api/v1/reports/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate API key
  const apiKey = extractApiKey(request);
  if (!apiKey || apiKey !== process.env.VEHICLECLAIM_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const { databases } = await adminAction();
    const data = await fetchFullReportData(
      databases,
      DATABASE_ID,
      COLLECTION_IDS,
      id
    );

    // Only allow access to public reports via API
    if (!data.report.is_public) {
      return NextResponse.json(
        { error: "Forbidden", message: "Report is not publicly accessible" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: formatReportResponse(data),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Report not found";
    return NextResponse.json(
      { error: "Not Found", message },
      { status: 404 }
    );
  }
}

function extractApiKey(request: NextRequest): string | null {
  // Check Authorization: Bearer <key>
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Check query param
  return request.nextUrl.searchParams.get("api_key");
}

function formatReportResponse(data: {
  report: ReportDocument;
  damageDetails: ReportDamageDetailDocument[];
  vehicleVerification: ReportVehicleVerificationDocument | null;
  assessment: ReportAssessmentDocument | null;
}) {
  const { report, damageDetails, vehicleVerification, assessment } = data;

  const visibleDamages = damageDetails.filter((d) => !d.is_inferred);
  const inferredDamages = damageDetails.filter((d) => d.is_inferred);

  return {
    id: report.$id,
    claimNumber: report.claim_number,
    status: report.claim_status,
    createdAt: report.analysis_timestamp,
    damage: {
      type: report.damage_type,
      cause: report.damage_cause,
      overallSeverity: report.overall_severity,
      repairComplexity: report.estimated_repair_complexity,
      estimatedTotalCost: report.estimated_total_repair_cost,
      confidenceScore: report.confidence_score,
      parts: visibleDamages.map((d) => ({
        name: d.part_name,
        severity: d.severity,
        description: d.description,
        estimatedCost: d.estimated_repair_cost,
        repairOrReplace: d.repair_or_replace || null,
        repairOrReplaceReason: d.repair_or_replace_reason || null,
      })),
      inferredInternalDamages: inferredDamages.map((d) => ({
        component: d.part_name,
        likelihood: d.inferred_likelihood,
        description: d.description,
        basedOn: d.inferred_based_on,
      })),
    },
    vehicleVerification: vehicleVerification
      ? {
          status: vehicleVerification.verification_status,
          confidenceScore: vehicleVerification.confidence_score,
          videoVehicle: {
            make: vehicleVerification.video_make,
            model: vehicleVerification.video_model,
            year: vehicleVerification.video_year,
            color: vehicleVerification.video_color,
          },
          policyVehicle: {
            make: vehicleVerification.policy_make,
            model: vehicleVerification.policy_model,
            year: vehicleVerification.policy_year,
            color: vehicleVerification.policy_color,
          },
        }
      : null,
    financials: assessment
      ? {
          totalRepairEstimate: assessment.total_repair_estimate,
          coveredAmount: assessment.covered_amount,
          deductible: assessment.deductible,
          nonCoveredItems: assessment.non_covered_items,
          estimatedPayout: assessment.estimated_payout,
          assessmentStatus: assessment.assessment_status,
        }
      : null,
    investigation: {
      needed: report.investigation_needed,
      reason: report.investigation_reason || null,
    },
    safetyConcerns: report.safety_concerns || [],
    recommendedActions: report.recommended_actions || [],
  };
}

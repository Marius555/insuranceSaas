import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { Query } from "node-appwrite";
import type { ClaimDocument } from "@/lib/types/appwrite";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Header } from "@/components/navigation/header";

export default async function InsuranceClaimsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/?auth=required");
  }

  const userDoc = await getUserDocument(session.id);
  if (!userDoc || userDoc.role !== 'insurance_adjuster') {
    redirect("/dashboard");
  }

  if (!userDoc.insurance_company_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header session={session} userDoc={userDoc} />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
            <p className="text-gray-600">
              No insurance company associated with your account. Please contact your administrator.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Get all claims for this insurance company
  const { databases } = await adminAction();
  const claimsResult = await databases.listDocuments<ClaimDocument>(
    DATABASE_ID,
    COLLECTION_IDS.CLAIMS,
    [
      Query.equal('insurance_company_id', userDoc.insurance_company_id),
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ]
  );

  // Helper to format status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_investigation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to format severity badge
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'total_loss':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const stats = {
    total: claimsResult.documents.length,
    needsInvestigation: claimsResult.documents.filter(c => c.investigation_needed).length,
    approved: claimsResult.documents.filter(c => c.claim_status === 'approved').length,
    denied: claimsResult.documents.filter(c => c.claim_status === 'denied').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} userDoc={userDoc} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Claims Review</h1>
          <p className="text-gray-600">Review and manage submitted insurance claims</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Claims</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Needs Investigation</div>
            <div className="text-2xl font-bold text-orange-600">{stats.needsInvestigation}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Denied</div>
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
          </Card>
        </div>

        {claimsResult.documents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">No claims to review</h2>
              <p className="text-gray-600">
                There are currently no claims submitted for your insurance company.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {claimsResult.documents.map((claim) => (
              <Card key={claim.$id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{claim.claim_number}</h3>
                      <Badge className={getStatusColor(claim.claim_status || 'pending')}>
                        {claim.claim_status || 'pending'}
                      </Badge>
                      <Badge className={getSeverityColor(claim.overall_severity)}>
                        {claim.overall_severity}
                      </Badge>
                      {claim.investigation_needed && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Investigation Required
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(claim.analysis_timestamp).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Damage Type:</span>{' '}
                        <span className="capitalize">{claim.damage_type}</span>
                      </p>
                      <p>
                        <span className="font-medium">Confidence:</span>{' '}
                        {(claim.confidence_score * 100).toFixed(0)}%
                      </p>
                      <p>
                        <span className="font-medium">Est. Repair:</span>{' '}
                        ${claim.estimated_total_repair_cost.toLocaleString()}
                      </p>
                    </div>
                    {claim.investigation_reason && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-900">
                        <span className="font-medium">Investigation Reason:</span> {claim.investigation_reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/auth/claims/${claim.$id}`}>
                      <Button>Review Claim</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {claimsResult.documents.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {claimsResult.documents.length} of {claimsResult.total} claims
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

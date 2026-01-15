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

export default async function UserDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/?auth=required");
  }

  const userDoc = await getUserDocument(session.id);
  if (!userDoc) {
    redirect("/");
  }

  // Get user's claims only
  const { databases } = await adminAction();
  const claimsResult = await databases.listDocuments<ClaimDocument>(
    DATABASE_ID,
    COLLECTION_IDS.CLAIMS,
    [
      Query.equal('user_id', session.id),
      Query.orderDesc('$createdAt'),
      Query.limit(25)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} userDoc={userDoc} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Claims</h1>
          <p className="text-gray-600">View and manage your submitted claims</p>
        </div>

        {claimsResult.documents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">No claims yet</h2>
              <p className="text-gray-600 mb-4">
                You haven&apos;t submitted any claims yet. Start by analyzing your vehicle damage.
              </p>
              <Link href="/claim-analysis">
                <Button>Submit Your First Claim</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {claimsResult.documents.map((claim) => (
              <Card key={claim.$id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{claim.claim_number}</h3>
                      <Badge className={getStatusColor(claim.claim_status || 'pending')}>
                        {claim.claim_status || 'pending'}
                      </Badge>
                      <Badge className={getSeverityColor(claim.overall_severity)}>
                        {claim.overall_severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
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
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/claims/${claim.$id}`}>
                      <Button variant="outline">View Details</Button>
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

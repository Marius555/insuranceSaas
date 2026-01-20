"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClaimDocument } from "@/lib/types/appwrite";

interface ClaimsTableProps {
  claims: ClaimDocument[];
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  const router = useRouter();

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      denied: "destructive",
      partial: "outline",
      needs_investigation: "outline"
    };
    return variants[status] || "secondary";
  };

  const getSeverityVariant = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      minor: "default",
      moderate: "secondary",
      severe: "destructive",
      total_loss: "destructive"
    };
    return variants[severity] || "secondary";
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Mobile: Card view */}
      <div className="md:hidden divide-y">
        {claims.map((claim) => (
          <div
            key={claim.$id}
            className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted"
            onClick={() => router.push(`/auth/claims/${claim.$id}`)}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-medium text-sm truncate">
                {claim.claim_number}
              </span>
              <Badge variant={getStatusVariant(claim.claim_status)} className="shrink-0">
                {claim.claim_status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="capitalize">{claim.damage_type}</span>
              <span>•</span>
              <Badge variant={getSeverityVariant(claim.overall_severity)} className="text-xs">
                {claim.overall_severity.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                ${claim.estimated_total_repair_cost.toLocaleString('en-US')}
              </span>
              <span className="text-muted-foreground">
                {new Date(claim.analysis_timestamp).toLocaleDateString('en-US')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Damage Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow
                key={claim.$id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/auth/claims/${claim.$id}`)}
              >
                <TableCell className="font-medium">
                  {claim.claim_number}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(claim.claim_status)}>
                    {claim.claim_status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {claim.damage_type}
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(claim.overall_severity)}>
                    {claim.overall_severity.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${claim.estimated_total_repair_cost.toLocaleString('en-US')}
                </TableCell>
                <TableCell className="text-right">
                  {(claim.confidence_score * 100).toFixed(0)}%
                </TableCell>
                <TableCell>
                  {new Date(claim.analysis_timestamp).toLocaleDateString('en-US')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/auth/claims/${claim.$id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

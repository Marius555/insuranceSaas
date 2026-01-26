"use client";

import { useState, useEffect } from "react";
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
import type { ReportDocument } from "@/lib/types/appwrite";
import { getUserLocation } from "@/lib/utils/country-detection";

interface ReportsTableProps {
  reports: ReportDocument[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const router = useRouter();
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    setCurrencySymbol(getUserLocation().currencySymbol);
  }, []);

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      analyzed: "default",
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
        {reports.map((report) => (
          <div
            key={report.$id}
            className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted"
            onClick={() => router.push(`/auth/reports/${report.$id}`)}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-medium text-sm truncate">
                {report.claim_number}
              </span>
              <Badge variant={getStatusVariant(report.claim_status)} className="shrink-0">
                {report.claim_status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="capitalize">{report.damage_type}</span>
              <span>•</span>
              <Badge variant={getSeverityVariant(report.overall_severity)} className="text-xs">
                {report.overall_severity.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {currencySymbol}{report.estimated_total_repair_cost.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                {new Date(report.analysis_timestamp).toLocaleDateString('en-US')}
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
              <TableHead>Report Number</TableHead>
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
            {reports.map((report) => (
              <TableRow
                key={report.$id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/auth/reports/${report.$id}`)}
              >
                <TableCell className="font-medium">
                  {report.claim_number}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(report.claim_status)}>
                    {report.claim_status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {report.damage_type}
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(report.overall_severity)}>
                    {report.overall_severity.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {currencySymbol}{report.estimated_total_repair_cost.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {(report.confidence_score * 100).toFixed(0)}%
                </TableCell>
                <TableCell>
                  {new Date(report.analysis_timestamp).toLocaleDateString('en-US')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/auth/reports/${report.$id}`);
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

"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvoiceData } from "@/lib/stripe/billingActions";

interface InvoiceListProps {
  invoices: InvoiceData[];
  onSelect: (invoice: InvoiceData) => void;
}

function statusVariant(status: string | null): "default" | "secondary" | "destructive" {
  if (status === "paid") return "default";
  if (status === "open" || status === "draft") return "secondary";
  return "destructive";
}

export function InvoiceList({ invoices, onSelect }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet.</p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium mb-3">Invoice History</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow
              key={inv.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect(inv)}
            >
              <TableCell className="text-sm">
                {new Date(inv.date * 1000).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm font-mono text-muted-foreground">
                {inv.number ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {(inv.amountDue / 100).toFixed(2)} {inv.currency.toUpperCase()}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(inv.status)} className="capitalize text-xs">
                  {inv.status ?? "unknown"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

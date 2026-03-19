"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { InvoiceData } from "@/lib/stripe/billingActions";

interface InvoiceDetailDialogProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

function statusVariant(status: string | null): "default" | "secondary" | "destructive" {
  if (status === "paid") return "default";
  if (status === "open" || status === "draft") return "secondary";
  return "destructive";
}

export function InvoiceDetailDialog({ invoice, onClose }: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            {invoice.number ? `Invoice #${invoice.number}` : "Invoice"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{new Date(invoice.date * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Amount Due</span>
            <span className="font-medium">
              {(invoice.amountDue / 100).toFixed(2)} {invoice.currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Amount Paid</span>
            <span>
              {(invoice.amountPaid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusVariant(invoice.status)} className="capitalize text-xs">
              {invoice.status ?? "unknown"}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2 justify-end pt-1">
          {invoice.hostedInvoiceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                View Invoice
              </a>
            </Button>
          )}
          {invoice.invoicePdf && (
            <Button size="sm" asChild>
              <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                Download PDF
              </a>
            </Button>
          )}
          {!invoice.hostedInvoiceUrl && !invoice.invoicePdf && (
            <p className="text-sm text-muted-foreground">No documents available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

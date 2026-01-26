"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, PrinterIcon } from '@hugeicons/core-free-icons';
import jsPDF from 'jspdf';

interface ReportData {
  report: Record<string, unknown>;
  damageDetails: Record<string, unknown>[];
  vehicleVerification: Record<string, unknown> | null;
  assessment: Record<string, unknown> | null;
  reportNumber: string;
}

interface ReportActionsProps {
  reportData: ReportData;
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function ReportActions({ reportData }: ReportActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const { report, damageDetails, vehicleVerification, assessment } = reportData;

      // Create PDF using jsPDF directly (no html2canvas = no color parsing errors)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper to check and add new page if needed
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Helper to draw a horizontal line
      const drawLine = (yPos: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
      };

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(`Damage Report: ${report.claim_number}`, margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on ${formatDate(new Date().toISOString())}`, margin, y);
      y += 6;

      drawLine(y);
      y += 10;

      // Report Overview Section
      checkPageBreak(60);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('REPORT OVERVIEW', margin, y);
      y += 2;
      drawLine(y);
      y += 8;

      // Overview table rows
      const overviewRows: [string, string][] = [
        ['Report Number', String(report.claim_number)],
        ['Analysis Date', formatDate(report.analysis_timestamp as string)],
        ['Damage Type', String(report.damage_type).charAt(0).toUpperCase() + String(report.damage_type).slice(1)],
        ['Overall Severity', formatStatus(report.overall_severity as string)],
        ['Confidence Score', `${((report.confidence_score as number) * 100).toFixed(0)}%`],
      ];

      if (report.claim_status && report.claim_status !== 'pending') {
        overviewRows.push(['Status', formatStatus(report.claim_status as string)]);
      }

      if (report.investigation_needed) {
        overviewRows.push(['Investigation', 'Required']);
        if (report.investigation_reason) {
          overviewRows.push(['Investigation Reason', String(report.investigation_reason)]);
        }
      }

      doc.setFontSize(10);
      overviewRows.forEach(([label, value]) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        // Wrap long text
        const valueLines = doc.splitTextToSize(value, contentWidth - 60);
        doc.text(valueLines, margin + 60, y);
        y += valueLines.length * 5 + 3;
      });

      y += 8;

      // Financial Summary Section (if assessment exists)
      if (assessment) {
        checkPageBreak(50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text('FINANCIAL SUMMARY', margin, y);
        y += 2;
        drawLine(y);
        y += 8;

        const financialRows: [string, string][] = [
          ['Total Repair Estimate', `$${(assessment.total_repair_estimate as number).toLocaleString()}`],
          ['Covered Amount', `$${(assessment.covered_amount as number).toLocaleString()}`],
          ['Deductible', `$${(assessment.deductible as number).toLocaleString()}`],
        ];

        doc.setFontSize(10);
        financialRows.forEach(([label, value]) => {
          checkPageBreak(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(label, margin, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(17, 24, 39);
          doc.text(value, margin + 60, y);
          y += 7;
        });

        // Highlight estimated payout
        checkPageBreak(12);
        doc.setFillColor(240, 253, 244);
        doc.rect(margin, y - 2, contentWidth, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text('Estimated Payout', margin + 2, y + 4);
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(12);
        doc.text(`$${(assessment.estimated_payout as number).toLocaleString()}`, margin + 62, y + 4);
        y += 16;
      }

      // Vehicle Verification Section (if exists)
      if (vehicleVerification) {
        checkPageBreak(80);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text('VEHICLE VERIFICATION', margin, y);

        // Status badge
        const verificationStatus = vehicleVerification.verification_status as string;
        const statusX = margin + 55;
        if (verificationStatus === 'matched') {
          doc.setFillColor(220, 252, 231);
          doc.setTextColor(22, 101, 52);
        } else if (verificationStatus === 'mismatched') {
          doc.setFillColor(254, 202, 202);
          doc.setTextColor(153, 27, 27);
        } else {
          doc.setFillColor(243, 244, 246);
          doc.setTextColor(55, 65, 81);
        }
        const statusText = formatStatus(verificationStatus);
        doc.setFontSize(9);
        doc.roundedRect(statusX, y - 4, doc.getTextWidth(statusText) + 6, 6, 1, 1, 'F');
        doc.text(statusText, statusX + 3, y);

        y += 2;
        drawLine(y);
        y += 6;

        // Verification table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        doc.setTextColor(107, 114, 128);
        doc.text('FIELD', margin + 2, y + 1);
        doc.text('FROM MEDIA', margin + 50, y + 1);
        doc.text('FROM POLICY', margin + 110, y + 1);
        y += 8;

        const verificationRows: [string, string, string][] = [
          ['License Plate', String(vehicleVerification.video_license_plate || '—'), String(vehicleVerification.policy_license_plate || '—')],
          ['VIN', String(vehicleVerification.video_vin || '—'), String(vehicleVerification.policy_vin || '—')],
          ['Make', String(vehicleVerification.video_make || '—'), String(vehicleVerification.policy_make || '—')],
          ['Model', String(vehicleVerification.video_model || '—'), String(vehicleVerification.policy_model || '—')],
          ['Year', String(vehicleVerification.video_year || '—'), String(vehicleVerification.policy_year || '—')],
          ['Color', String(vehicleVerification.video_color || '—'), String(vehicleVerification.policy_color || '—')],
        ];

        doc.setFontSize(10);
        verificationRows.forEach(([field, media, policy]) => {
          checkPageBreak(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(field, margin + 2, y);
          doc.setTextColor(17, 24, 39);
          doc.text(media, margin + 50, y);
          doc.text(policy, margin + 110, y);
          y += 6;
        });

        // Mismatches warning
        if (vehicleVerification.mismatches) {
          checkPageBreak(20);
          y += 4;
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(254, 202, 202);
          const mismatches = (vehicleVerification.mismatches as string).split(', ');
          const boxHeight = 12 + mismatches.length * 5;
          doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 2, 2, 'FD');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(153, 27, 27);
          doc.text('Mismatches Detected:', margin + 4, y + 4);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(185, 28, 28);
          mismatches.forEach((m, i) => {
            doc.text(`• ${m}`, margin + 8, y + 10 + i * 5);
          });
          y += boxHeight + 4;
        }

        // Notes
        if (vehicleVerification.notes) {
          checkPageBreak(15);
          doc.setFillColor(249, 250, 251);
          const notesText = doc.splitTextToSize(`Notes: ${vehicleVerification.notes}`, contentWidth - 8);
          const notesHeight = notesText.length * 5 + 6;
          doc.roundedRect(margin, y, contentWidth, notesHeight, 2, 2, 'F');
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          doc.text(notesText, margin + 4, y + 5);
          y += notesHeight + 4;
        }

        y += 8;
      }

      // Damaged Parts Section
      if (damageDetails.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(`DAMAGED PARTS (${damageDetails.length})`, margin, y);
        y += 2;
        drawLine(y);
        y += 6;

        // Table header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 3, contentWidth, 7, 'F');
        doc.setTextColor(107, 114, 128);
        doc.text('PART', margin + 2, y + 1);
        doc.text('SEVERITY', margin + 45, y + 1);
        doc.text('EST. COST', margin + 80, y + 1);
        doc.text('DESCRIPTION', margin + 110, y + 1);
        y += 8;

        doc.setFontSize(9);
        damageDetails.forEach((detail) => {
          checkPageBreak(10);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(17, 24, 39);
          const partName = doc.splitTextToSize(String(detail.part_name), 40);
          doc.text(partName, margin + 2, y);

          // Severity badge
          const severity = detail.severity as string;
          let badgeColor: [number, number, number] = [243, 244, 246];
          let textColor: [number, number, number] = [55, 65, 81];

          if (severity === 'minor') {
            badgeColor = [220, 252, 231];
            textColor = [22, 101, 52];
          } else if (severity === 'moderate') {
            badgeColor = [254, 249, 195];
            textColor = [133, 77, 14];
          } else if (severity === 'severe') {
            badgeColor = [254, 215, 170];
            textColor = [154, 52, 18];
          } else if (severity === 'total_loss') {
            badgeColor = [254, 202, 202];
            textColor = [153, 27, 27];
          }

          doc.setFillColor(...badgeColor);
          doc.setTextColor(...textColor);
          const severityText = formatStatus(severity);
          doc.roundedRect(margin + 45, y - 3, doc.getTextWidth(severityText) + 4, 5, 1, 1, 'F');
          doc.setFont('helvetica', 'normal');
          doc.text(severityText, margin + 47, y);

          doc.setTextColor(107, 114, 128);
          doc.text(detail.estimated_repair_cost ? String(detail.estimated_repair_cost) : '—', margin + 80, y);

          const description = detail.description ? doc.splitTextToSize(String(detail.description), 60) : ['—'];
          doc.text(description, margin + 110, y);

          y += Math.max(partName.length, description.length) * 4 + 4;
        });

        y += 8;
      }

      // Footer
      checkPageBreak(20);
      y = pageHeight - margin - 10;
      drawLine(y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(`This report was automatically generated. Report ID: ${report.$id || 'N/A'}`, pageWidth / 2, y, { align: 'center' });

      // Save the PDF
      doc.save(`report-${reportData.reportNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0"
        onClick={handlePrint}
        title="Print report"
      >
        <HugeiconsIcon icon={PrinterIcon} size={16} />
        <span className="sr-only">Print report</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0"
        onClick={handleDownload}
        title="Download report as PDF"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <span className="animate-spin text-xs">●</span>
        ) : (
          <HugeiconsIcon icon={Download01Icon} size={16} />
        )}
        <span className="sr-only">Download report as PDF</span>
      </Button>
    </div>
  );
}

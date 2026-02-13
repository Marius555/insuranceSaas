"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SecurityWarnings } from "./security-warnings";
import { VehicleDetailField } from "./vehicle-detail-field";
import type { AutoDamageAnalysis, EnhancedAutoDamageAnalysis } from "@/lib/gemini/types";
import { cn } from "@/lib/utils";

interface AnalysisResultDisplayProps {
  analysis: AutoDamageAnalysis | EnhancedAutoDamageAnalysis;
  securityWarnings?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  reportId: string;
  reportNumber: string;
  uploadedFiles?: File[];
  policyFile?: File | null;
  onReset?: () => void;
  currencySymbol?: string;
}

function isEnhancedAnalysis(analysis: AutoDamageAnalysis | EnhancedAutoDamageAnalysis): analysis is EnhancedAutoDamageAnalysis {
  return 'vehicleVerification' in analysis;
}

export function AnalysisResultDisplay({
  analysis,
  securityWarnings = [],
  riskLevel = 'low',
  reportId,
  reportNumber,
  uploadedFiles = [],
  policyFile = null,
  onReset,
  currencySymbol = '$',
}: AnalysisResultDisplayProps) {
  const router = useRouter();
  const [showRawJSON, setShowRawJSON] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'severe':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'total_loss':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Security Warnings */}
      {securityWarnings.length > 0 && (
        <SecurityWarnings warnings={securityWarnings} riskLevel={riskLevel} />
      )}

      {/* Report Success Banner */}
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Report submitted successfully!</strong> Your report number is <strong>{reportNumber}</strong>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Damage Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Damage Assessment Summary</CardTitle>
            <Badge className={cn("text-sm", getSeverityColor(analysis.overallSeverity))}>
              {analysis.overallSeverity.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <CardDescription>
            Confidence: {((analysis.confidence || 0) * 100).toFixed(0)}% •
            Complexity: {analysis.estimatedRepairComplexity}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Damaged Parts Table */}
          {analysis.damagedParts && analysis.damagedParts.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-3">Damaged Parts</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Part</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.damagedParts.map((part, index) => (
                      <tr key={index}>
                        <td className="p-3 font-medium">{part.part}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={getSeverityColor(part.severity)}>
                            {part.severity}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{part.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No damaged parts identified.</p>
          )}

          {/* Inferred Internal Damages */}
          {analysis.inferredInternalDamages && analysis.inferredInternalDamages.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Inferred Internal Damages</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Possible internal damage based on visible external damage. Not included in cost estimates.
              </p>
              <div className="border border-dashed rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Component</th>
                      <th className="text-left p-3">Likelihood</th>
                      <th className="text-left p-3">Reasoning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.inferredInternalDamages.map((item, index) => (
                      <tr key={index}>
                        <td className="p-3 font-medium">{item.component}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn(
                            item.likelihood === 'high' && 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300',
                            item.likelihood === 'medium' && 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300',
                            item.likelihood === 'low' && 'border-muted-foreground/30 text-muted-foreground',
                          )}>
                            {item.likelihood}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <p>{item.description}</p>
                          <p className="text-xs mt-1">Based on: {item.basedOn}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Safety Concerns */}
          {analysis.safetyConcerns && analysis.safetyConcerns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Safety Concerns</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.safetyConcerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Analysis - Vehicle Verification & Financial */}
      {isEnhancedAnalysis(analysis) && (
        <>
          {/* Vehicle Verification */}
          {analysis.vehicleVerification && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vehicle Verification</CardTitle>
                  <Badge variant={
                    analysis.vehicleVerification.verificationStatus === 'matched' ? 'default' :
                    analysis.vehicleVerification.verificationStatus === 'mismatched' ? 'destructive' :
                    'secondary'
                  }>
                    {analysis.vehicleVerification.verificationStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-semibold mb-3 text-gray-900">From Media</h5>
                    <div className="space-y-1">
                      <VehicleDetailField
                        label="License Plate"
                        value={analysis.vehicleVerification.videoVehicle.licensePlate}
                        isHighPriority
                      />
                      <VehicleDetailField
                        label="VIN"
                        value={analysis.vehicleVerification.videoVehicle.vin}
                        isHighPriority
                      />
                      <VehicleDetailField
                        label="Make"
                        value={analysis.vehicleVerification.videoVehicle.make}
                      />
                      <VehicleDetailField
                        label="Model"
                        value={analysis.vehicleVerification.videoVehicle.model}
                      />
                      <VehicleDetailField
                        label="Year"
                        value={analysis.vehicleVerification.videoVehicle.year}
                      />
                      <VehicleDetailField
                        label="Color"
                        value={analysis.vehicleVerification.videoVehicle.color}
                      />
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3 text-gray-900">From Policy</h5>
                    <div className="space-y-1">
                      <VehicleDetailField
                        label="License Plate"
                        value={analysis.vehicleVerification.policyVehicle.licensePlate}
                        isHighPriority
                      />
                      <VehicleDetailField
                        label="VIN"
                        value={analysis.vehicleVerification.policyVehicle.vin}
                        isHighPriority
                      />
                      <VehicleDetailField
                        label="Make"
                        value={analysis.vehicleVerification.policyVehicle.make}
                      />
                      <VehicleDetailField
                        label="Model"
                        value={analysis.vehicleVerification.policyVehicle.model}
                      />
                      <VehicleDetailField
                        label="Year"
                        value={analysis.vehicleVerification.policyVehicle.year}
                      />
                      <VehicleDetailField
                        label="Color"
                        value={analysis.vehicleVerification.policyVehicle.color}
                      />
                    </div>
                  </div>
                </div>
                {analysis.vehicleVerification.mismatches && analysis.vehicleVerification.mismatches.length > 0 && (
                  <div className="text-sm text-destructive">
                    <strong>Mismatches:</strong> {analysis.vehicleVerification.mismatches.join(', ')}
                  </div>
                )}

                {/* Detailed Verification Breakdown */}
                <div className="space-y-3 pt-4 border-t">
                  <h5 className="font-semibold text-sm">Verification Details</h5>

                  {/* Field-by-field comparison table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Field</th>
                          <th className="text-left p-2 font-medium">Video/Images</th>
                          <th className="text-left p-2 font-medium">Policy</th>
                          <th className="text-center p-2 font-medium">Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {/* License Plate */}
                        <tr>
                          <td className="p-2 font-medium">License Plate</td>
                          <td className="p-2 font-mono text-xs">
                            {analysis.vehicleVerification.videoVehicle.licensePlate || <span className="text-muted-foreground">Not visible</span>}
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {analysis.vehicleVerification.policyVehicle.licensePlate || <span className="text-muted-foreground">N/A</span>}
                          </td>
                          <td className="p-2 text-center">
                            {(() => {
                              const videoVal = analysis.vehicleVerification.videoVehicle.licensePlate;
                              const policyVal = analysis.vehicleVerification.policyVehicle.licensePlate;
                              const isMatch = videoVal && policyVal &&
                                videoVal.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                                policyVal.toLowerCase().replace(/[^a-z0-9]/g, '');
                              const isMismatch = videoVal && policyVal && !isMatch;
                              const isUnknown = !videoVal || !policyVal;

                              return (
                                <>
                                  {isMatch && <span className="text-green-600 font-semibold">✓</span>}
                                  {isMismatch && <span className="text-red-600 font-semibold">✗</span>}
                                  {isUnknown && <span className="text-gray-400">?</span>}
                                </>
                              );
                            })()}
                          </td>
                        </tr>

                        {/* VIN */}
                        <tr>
                          <td className="p-2 font-medium">VIN</td>
                          <td className="p-2 font-mono text-xs">
                            {analysis.vehicleVerification.videoVehicle.vin || <span className="text-muted-foreground">Not visible</span>}
                          </td>
                          <td className="p-2 font-mono text-xs">
                            {analysis.vehicleVerification.policyVehicle.vin || <span className="text-muted-foreground">N/A</span>}
                          </td>
                          <td className="p-2 text-center">
                            {(() => {
                              const videoVal = analysis.vehicleVerification.videoVehicle.vin;
                              const policyVal = analysis.vehicleVerification.policyVehicle.vin;
                              const isMatch = videoVal && policyVal &&
                                videoVal.toUpperCase() === policyVal.toUpperCase();
                              const isMismatch = videoVal && policyVal && !isMatch;
                              const isUnknown = !videoVal || !policyVal;

                              return (
                                <>
                                  {isMatch && <span className="text-green-600 font-semibold">✓</span>}
                                  {isMismatch && <span className="text-red-600 font-semibold">✗</span>}
                                  {isUnknown && <span className="text-gray-400">?</span>}
                                </>
                              );
                            })()}
                          </td>
                        </tr>

                        {/* Make/Model */}
                        <tr>
                          <td className="p-2 font-medium">Make/Model</td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.videoVehicle.make && analysis.vehicleVerification.videoVehicle.model
                              ? `${analysis.vehicleVerification.videoVehicle.make} ${analysis.vehicleVerification.videoVehicle.model}`
                              : <span className="text-muted-foreground">Not visible</span>}
                          </td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.policyVehicle.make && analysis.vehicleVerification.policyVehicle.model
                              ? `${analysis.vehicleVerification.policyVehicle.make} ${analysis.vehicleVerification.policyVehicle.model}`
                              : <span className="text-muted-foreground">N/A</span>}
                          </td>
                          <td className="p-2 text-center">
                            {(() => {
                              const videoMake = analysis.vehicleVerification.videoVehicle.make;
                              const videoModel = analysis.vehicleVerification.videoVehicle.model;
                              const policyMake = analysis.vehicleVerification.policyVehicle.make;
                              const policyModel = analysis.vehicleVerification.policyVehicle.model;

                              const isMatch = videoMake && videoModel && policyMake && policyModel &&
                                videoMake.toLowerCase() === policyMake.toLowerCase() &&
                                videoModel.toLowerCase() === policyModel.toLowerCase();
                              const isMismatch = videoMake && videoModel && policyMake && policyModel && !isMatch;
                              const isUnknown = !videoMake || !videoModel || !policyMake || !policyModel;

                              return (
                                <>
                                  {isMatch && <span className="text-green-600 font-semibold">✓</span>}
                                  {isMismatch && <span className="text-red-600 font-semibold">✗</span>}
                                  {isUnknown && <span className="text-gray-400">?</span>}
                                </>
                              );
                            })()}
                          </td>
                        </tr>

                        {/* Year */}
                        <tr>
                          <td className="p-2 font-medium">Year</td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.videoVehicle.year || <span className="text-muted-foreground">Not visible</span>}
                          </td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.policyVehicle.year || <span className="text-muted-foreground">N/A</span>}
                          </td>
                          <td className="p-2 text-center">
                            {(() => {
                              const videoVal = analysis.vehicleVerification.videoVehicle.year;
                              const policyVal = analysis.vehicleVerification.policyVehicle.year;
                              const isMatch = videoVal && policyVal &&
                                Math.abs(Number(videoVal) - Number(policyVal)) <= 1;
                              const isMismatch = videoVal && policyVal && !isMatch;
                              const isUnknown = !videoVal || !policyVal;

                              return (
                                <>
                                  {isMatch && <span className="text-green-600 font-semibold">✓</span>}
                                  {isMismatch && <span className="text-red-600 font-semibold">✗</span>}
                                  {isUnknown && <span className="text-gray-400">?</span>}
                                </>
                              );
                            })()}
                          </td>
                        </tr>

                        {/* Color */}
                        <tr>
                          <td className="p-2 font-medium">Color</td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.videoVehicle.color || <span className="text-muted-foreground">Not visible</span>}
                          </td>
                          <td className="p-2 text-xs">
                            {analysis.vehicleVerification.policyVehicle.color || <span className="text-muted-foreground">N/A</span>}
                          </td>
                          <td className="p-2 text-center">
                            {(() => {
                              const videoVal = analysis.vehicleVerification.videoVehicle.color;
                              const policyVal = analysis.vehicleVerification.policyVehicle.color;
                              const isMatch = videoVal && policyVal && (
                                videoVal.toLowerCase().includes(policyVal.toLowerCase()) ||
                                policyVal.toLowerCase().includes(videoVal.toLowerCase())
                              );
                              const isMismatch = videoVal && policyVal && !isMatch;
                              const isUnknown = !videoVal || !policyVal;

                              return (
                                <>
                                  {isMatch && <span className="text-green-600 font-semibold">✓</span>}
                                  {isMismatch && <span className="text-red-600 font-semibold">✗</span>}
                                  {isUnknown && <span className="text-gray-400">?</span>}
                                </>
                              );
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Confidence Score */}
                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-muted-foreground font-medium">Verification Confidence:</span>
                    <Badge variant={
                      (analysis.vehicleVerification.confidenceScore || 0) >= 0.7 ? 'default' : 'destructive'
                    }>
                      {((analysis.vehicleVerification.confidenceScore || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Verification Notes */}
                  {analysis.vehicleVerification.notes && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <strong className="text-foreground">Notes:</strong> {analysis.vehicleVerification.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Breakdown */}
          {analysis.claimAssessment && analysis.claimAssessment.financialBreakdown && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
                <CardDescription>
                  Assessment Status: <Badge>{analysis.claimAssessment.status.toUpperCase()}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Repair Estimate:</span>
                      <span className="font-semibold">{currencySymbol}{(analysis.claimAssessment.financialBreakdown.totalRepairEstimate ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Covered Amount:</span>
                      <span>{currencySymbol}{(analysis.claimAssessment.financialBreakdown.coveredAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductible:</span>
                      <span>-{currencySymbol}{(analysis.claimAssessment.financialBreakdown.deductible ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Non-Covered:</span>
                      <span>-{currencySymbol}{(analysis.claimAssessment.financialBreakdown.nonCoveredItems ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Estimated Payout</p>
                      <p className="text-3xl font-bold text-primary">
                        {currencySymbol}{(analysis.claimAssessment.financialBreakdown.estimatedPayout ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="text-sm">
                  <p><strong>Reasoning:</strong> {analysis.claimAssessment.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Raw JSON (Collapsible) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Raw Analysis Data</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export JSON
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRawJSON(!showRawJSON)}>
                {showRawJSON ? 'Hide' : 'Show'} JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        {showRawJSON && (
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs max-h-96">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => router.push(`/auth/reports/${reportId}`)}
          className="flex-1"
          size="lg"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          View Full Report Details
        </Button>
        {onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            size="lg"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Analyze Another Report
          </Button>
        )}
      </div>
    </div>
  );
}

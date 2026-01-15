"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SecurityWarningsProps {
  warnings: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export function SecurityWarnings({ warnings, riskLevel = 'medium' }: SecurityWarningsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'text-blue-600 dark:text-blue-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        );
    }
  };

  const getRiskBorderColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'border-blue-200 dark:border-blue-800';
      case 'medium':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'high':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-yellow-200 dark:border-yellow-800';
    }
  };

  const getRiskBgColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-950/20';
      case 'high':
        return 'bg-red-50 dark:bg-red-950/20';
      default:
        return 'bg-yellow-50 dark:bg-yellow-950/20';
    }
  };

  return (
    <Alert className={cn("border-2", getRiskBorderColor(), getRiskBgColor())}>
      <div className={cn("flex items-start gap-3", getRiskColor())}>
        <div className="flex-shrink-0 mt-0.5">
          {getRiskIcon()}
        </div>

        <div className="flex-1 space-y-2">
          <AlertTitle className="text-base font-semibold flex items-center gap-2">
            Security Notice
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full uppercase font-bold",
              riskLevel === 'low' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
              riskLevel === 'medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
              riskLevel === 'high' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            )}>
              {riskLevel} risk
            </span>
          </AlertTitle>

          <AlertDescription className="text-sm space-y-2">
            <p>
              {warnings.length === 1
                ? "A security concern was detected during analysis."
                : `${warnings.length} security concerns were detected during analysis.`}
            </p>

            {/* First Warning Always Shown */}
            <div className="flex items-start gap-2 text-foreground">
              <span className="flex-shrink-0 mt-0.5">•</span>
              <span>{warnings[0]}</span>
            </div>

            {/* Additional Warnings (Expandable) */}
            {warnings.length > 1 && (
              <>
                {isExpanded && (
                  <div className="space-y-2">
                    {warnings.slice(1).map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-foreground">
                        <span className="flex-shrink-0 mt-0.5">•</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 text-xs"
                >
                  {isExpanded ? (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                      Show {warnings.length - 1} more warning{warnings.length - 1 > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}

            <p className="text-xs italic mt-3 text-muted-foreground">
              {riskLevel === 'high' && "⚠️ Manual review is strongly recommended before approving this claim."}
              {riskLevel === 'medium' && "ℹ️ Review recommended. Analysis continues with warnings."}
              {riskLevel === 'low' && "✓ Low-risk detection. Analysis proceeds normally."}
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

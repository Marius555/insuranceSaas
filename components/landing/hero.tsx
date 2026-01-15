"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Content */}
        <div className="space-y-8 animate-fade-in-up">
          <Badge className="inline-block">AI-Powered Damage Assessment</Badge>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Verify Vehicle Damage Claims in{" "}
              <span className="text-primary">Minutes</span>, Not Days
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl">
              AI-powered video analysis for insurance companies and car owners.
              Instant damage assessment, cost estimation, and fraud detection.
            </p>
          </div>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register?type=business">
              <Button size="lg" className="w-full sm:w-auto">
                For Insurance Companies →
              </Button>
            </Link>
            <Link href="/register?type=personal">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                For Car Owners →
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>95%+ Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Fraud Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Instant Results</span>
            </div>
          </div>
        </div>

        {/* Right Column - Visual */}
        <div className="relative animate-fade-in-up animation-delay-200">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12">
            <div className="aspect-square md:aspect-video flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center size-24 rounded-full bg-primary/10 ring-8 ring-primary/5">
                  <svg
                    className="size-12 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Upload Video or Images
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Our AI analyzes vehicle damage in real-time, providing
                    instant assessments and cost estimates
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Floating Stats */}
          <div className="absolute -bottom-6 -left-6 bg-background border border-border rounded-lg shadow-lg p-4 hidden md:block">
            <div className="text-2xl font-bold text-primary">50K+</div>
            <div className="text-xs text-muted-foreground">Claims Analyzed</div>
          </div>

          <div className="absolute -top-6 -right-6 bg-background border border-border rounded-lg shadow-lg p-4 hidden md:block">
            <div className="text-2xl font-bold text-primary">&lt; 5min</div>
            <div className="text-xs text-muted-foreground">Avg. Processing</div>
          </div>
        </div>
      </div>
    </section>
  );
}

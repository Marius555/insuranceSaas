"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  SparklesIcon,
  FileSearchIcon,
  CameraVideoIcon,
  FileValidationIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const insuranceSteps = [
  {
    number: 1,
    icon: Upload04Icon,
    title: "Upload Claim Media",
    description: "Upload vehicle damage videos or photos from claimant",
  },
  {
    number: 2,
    icon: SparklesIcon,
    title: "AI Analysis",
    description:
      "Our Custom AI model processes media, identifies damage, extracts vehicle details",
  },
  {
    number: 3,
    icon: FileSearchIcon,
    title: "Policy Cross-Check",
    description: "Upload policy PDF for automatic coverage verification",
  },
  {
    number: 4,
    icon: Shield01Icon,
    title: "Get Results",
    description:
      "Get a detailed damage report with cost estimates, coverage analysis, and fraud indicators",
  },
];

const carOwnerSteps = [
  {
    number: 1,
    icon: CameraVideoIcon,
    title: "Upload Damage Evidence",
    description: "Record or upload video/photos of vehicle damage",
  },
  {
    number: 2,
    icon: SparklesIcon,
    title: "AI Assessment",
    description: "AI analyzes damage, identifies parts, estimates severity",
  },
  {
    number: 3,
    icon: FileValidationIcon,
    title: "Compare Estimates",
    description: "See if repair shop estimate matches AI assessment",
  },
  {
    number: 4,
    icon: Shield01Icon,
    title: "Verify Coverage",
    description: "Optional: Upload your policy to check what's covered",
  },
];

function StepCard({
  step,
}: {
  step: {
    number: number;
    icon: any;
    title: string;
    description: string;
  };
}) {
  const Icon = step.icon;

  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Icon Circle */}
      <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mb-4 ring-4 ring-primary/5">
        <HugeiconsIcon icon={Icon} className="size-7 text-primary" strokeWidth={2} />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {step.description}
      </p>

      {/* Connecting Line (not for last item) */}
      {step.number < 4 && (
        <div className="hidden lg:block absolute top-8 left-[calc(50%+4rem)] w-[calc(100%-8rem)] border-t-2 border-dashed border-border" />
      )}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-muted/30 min-h-screen flex items-center"
    >
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and secure process for all users
          </p>
        </div>

        <Tabs defaultValue="insurance" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="insurance">For Insurance Companies</TabsTrigger>
            <TabsTrigger value="owners">For Car Owners</TabsTrigger>
          </TabsList>

          <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
            <TabsContent value="insurance" forceMount className="data-[state=inactive]:invisible">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
                {insuranceSteps.map((step) => (
                  <StepCard key={step.number} step={step} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="owners" forceMount className="data-[state=inactive]:invisible">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
                {carOwnerSteps.map((step) => (
                  <StepCard key={step.number} step={step} />
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}

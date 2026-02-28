"use client";

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
import { Badge } from "@/components/ui/badge";

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
      "Our custom AI model processes media, identifies damage, extracts vehicle details",
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
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Icon circle with step number badge */}
      <div className="relative mb-4">
        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
          <HugeiconsIcon icon={step.icon} className="size-7 text-primary" strokeWidth={2} />
        </div>
        <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {step.number}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {step.description}
      </p>

      {/* Connecting line (not for last item) */}
      {step.number < 4 && (
        <div className="hidden lg:block absolute top-8 left-[calc(50%+4rem)] w-[calc(100%-8rem)] border-t-2 border-dashed border-border" />
      )}
    </div>
  );
}

export function HowItWorks({ insuranceEnabled }: { insuranceEnabled: boolean }) {
  return (
    <section
      id="how-it-works"
      className="bg-muted/30 py-24"
    >
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-12 space-y-4">
          <Badge variant="outline" className="mb-2">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">From Damage to Report in Minutes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, fast, and secure — no appointments or specialists required
          </p>
        </div>

        {insuranceEnabled ? (
          <Tabs defaultValue="owners" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="owners">For Car Owners</TabsTrigger>
              <TabsTrigger value="insurance">For Insurance Companies</TabsTrigger>
            </TabsList>

            <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
              <TabsContent value="owners" forceMount className="data-[state=inactive]:invisible">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
                  {carOwnerSteps.map((step) => (
                    <StepCard key={step.number} step={step} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="insurance" forceMount className="data-[state=inactive]:invisible">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
                  {insuranceSteps.map((step) => (
                    <StepCard key={step.number} step={step} />
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {carOwnerSteps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  FileValidationIcon,
  Shield01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: SparklesIcon,
    title: "AI-Powered Damage Analysis",
    description:
      "Upload videos or images for instant damage detection powered by Gemini 2.5 Flash. Identifies all damaged parts with severity ratings.",
  },
  {
    icon: FileValidationIcon,
    title: "Accurate Cost Estimates",
    description:
      "Get repair cost breakdowns for each damaged component. Compare estimates against policy coverage.",
  },
  {
    icon: FileValidationIcon,
    title: "Policy Coverage Analysis",
    description:
      "Upload policy PDFs to verify coverage, check deductibles, and identify excluded items automatically.",
  },
  {
    icon: Shield01Icon,
    title: "Fraud Detection",
    description:
      "Verify vehicle in video matches policy details. AI detects license plate, VIN, make/model mismatches.",
  },
  {
    icon: SparklesIcon,
    title: "Instant Processing",
    description:
      "Process claims remotely in minutes. No need to schedule in-person assessments or wait for specialists.",
  },
  {
    icon: LockIcon,
    title: "Enterprise Security",
    description:
      "Prompt injection scanning, audit logs, encrypted storage. Built for insurance compliance requirements.",
  },
];

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Complete Claim Assessment Platform
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to process and verify vehicle damage claims
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="cursor-default"
          >
            <CardHeader className="space-y-4">
              <div className="inline-flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={feature.icon} className="size-6" strokeWidth={2} />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

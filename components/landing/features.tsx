import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Money02Icon,
  FileValidationIcon,
  Shield01Icon,
  Timer02Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const baseFeatures = [
  {
    icon: SparklesIcon,
    title: "AI-Powered Damage Analysis",
    description:
      "Upload videos or images for instant damage detection powered by our custom AI model. Identifies all damaged parts with severity ratings.",
  },
  {
    icon: Money02Icon,
    title: "Accurate Cost Estimates",
    description:
      "Get repair cost breakdowns for each damaged component. Compare estimates against industry standards.",
  },
  {
    icon: Shield01Icon,
    title: "Fraud Detection",
    description:
      "Verify vehicle in video matches policy details. AI detects license plate, VIN, make/model mismatches.",
  },
  {
    icon: Timer02Icon,
    title: "Instant Processing",
    description:
      "Process claims remotely in minutes. No need to schedule in-person assessments or wait for specialists.",
  },
];

const insuranceFeature = {
  icon: FileValidationIcon,
  title: "Policy Coverage Analysis",
  description:
    "Upload policy PDFs to verify coverage, check deductibles, and identify excluded items automatically.",
};

export function Features({ insuranceEnabled }: { insuranceEnabled: boolean }) {
  const features = insuranceEnabled
    ? [...baseFeatures.slice(0, 2), insuranceFeature, ...baseFeatures.slice(2)]
    : baseFeatures;

  const gridCols =
    features.length === 5
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-2">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Complete Claim Assessment Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to process and verify vehicle damage claims
          </p>
        </div>

        <div className={`grid ${gridCols} gap-8`}>
          {features.map((feature, index) => (
            <Card
              key={index}
              className="transition-all duration-200"
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
      </div>
    </section>
  );
}

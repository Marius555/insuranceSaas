import { HugeiconsIcon } from "@hugeicons/react";
import {
  FileValidationIcon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";

const stats = [
  {
    icon: FileValidationIcon,
    number: "50,000+",
    label: "Claims Analyzed",
    sublabel: "Across all vehicle types",
  },
  {
    icon: CheckmarkCircle02Icon,
    number: "95%+",
    label: "Detection Accuracy",
    sublabel: "Validated against expert assessments",
  },
  {
    icon: SparklesIcon,
    number: "< 5 min",
    label: "Processing Time",
    sublabel: "From upload to full report",
  },
  {
    icon: Shield01Icon,
    number: "1,200+",
    label: "Fraud Prevented",
    sublabel: "Suspicious claims flagged",
  },
];

export function Stats() {
  return (
    <section className="py-20 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">Trusted by the Numbers</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real results from real claims — accuracy and speed you can count on
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={stat.icon} className="size-6" strokeWidth={2} />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {stat.number}
              </div>
              <div className="font-semibold">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

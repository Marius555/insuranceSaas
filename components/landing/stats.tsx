import { Badge } from "@/components/ui/badge";

const stats = [
  { number: "50,000+", label: "Claims Analyzed" },
  { number: "95%+", label: "Detection Accuracy" },
  { number: "< 5 min", label: "Average Processing Time" },
  { number: "1,200+", label: "Fraud Cases Prevented" },
];

const trustBadges = [
  "Enterprise Security",
  "Audit Logged",
];

export function Stats() {
  return (
    <section className="border-y border-border py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          {trustBadges.map((badge, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

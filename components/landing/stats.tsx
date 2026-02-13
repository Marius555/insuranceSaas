const stats = [
  { number: "50,000+", label: "Claims Analyzed" },
  { number: "95%+", label: "Detection Accuracy" },
  { number: "< 5 min", label: "Average Processing Time" },
  { number: "1,200+", label: "Fraud Cases Prevented" },
];

export function Stats() {
  return (
    <section className="border-y border-border min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

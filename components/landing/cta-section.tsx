import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function CTASection() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardHeader className="text-center space-y-4 pb-6">
          <CardTitle className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Claims Process?
          </CardTitle>
          <CardDescription className="text-lg">
            Join insurance companies processing thousands of claims with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Schedule Demo
              </Button>
            </Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            No credit card required • 14-day free trial
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

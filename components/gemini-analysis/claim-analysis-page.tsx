"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAnalysisTab } from "./quick-analysis-tab";
import { PolicyAnalysisTab } from "./policy-analysis-tab";

export function ClaimAnalysisPage() {
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Insurance Claim Analysis</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered damage assessment with fraud prevention
        </p>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="quick" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
          <TabsTrigger value="policy">Policy Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <QuickAnalysisTab />
        </TabsContent>

        <TabsContent value="policy">
          <PolicyAnalysisTab />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Powered by Gemini 2.5 Flash • Secure • Audited
        </p>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAnalysisTabContent } from "./quick-analysis-tab-content";
import { PolicyAnalysisTabContent } from "./policy-analysis-tab-content";

interface ReportUploadModalProps {
  children: React.ReactNode;
}

export function ReportUploadModal({ children }: ReportUploadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");

  const handleSuccess = (reportId: string) => {
    // Don't close modal - let navigation unmount it naturally
    // This ensures user sees the redirecting state until new page loads
    router.push(`/auth/reports/${reportId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Submit Report</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
            <TabsTrigger value="policy">Policy Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="flex-1 overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <QuickAnalysisTabContent onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="policy" className="flex-1 overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <PolicyAnalysisTabContent onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

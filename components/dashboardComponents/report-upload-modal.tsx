"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMounted } from "@/hooks/use-mounted";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAnalysisTabContent } from "./quick-analysis-tab-content";
import { PolicyAnalysisTabContent } from "./policy-analysis-tab-content";

interface ReportUploadModalProps {
  children: React.ReactNode;
}

export function ReportUploadModal({ children }: ReportUploadModalProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");

  // Lock modal type when modal opens to prevent layout switching
  const [lockedIsMobile, setLockedIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    startTransition(() => {
      if (open && lockedIsMobile === null) {
        setLockedIsMobile(isMobile);
      } else if (!open) {
        setLockedIsMobile(null);
      }
    });
  }, [open, isMobile, lockedIsMobile]);

  const useDrawerLayout = open ? (lockedIsMobile ?? isMobile) : isMobile;

  const handleSuccess = (reportId: string) => {
    setOpen(false);
    router.push(`/auth/reports/${reportId}`);
  };

  // Shared content for both Dialog and Drawer
  const modalContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
      <TabsList className="grid w-full grid-cols-2 shrink-0">
        <TabsTrigger value="quick">Quick Analysis</TabsTrigger>
        <TabsTrigger value="policy">Policy Analysis</TabsTrigger>
      </TabsList>

      <TabsContent value="quick" className="flex-1 overflow-y-auto mt-4 mx-0 mb-0 data-[state=active]:flex data-[state=active]:flex-col">
        <QuickAnalysisTabContent onSuccess={handleSuccess} />
      </TabsContent>

      <TabsContent value="policy" className="flex-1 overflow-y-auto mt-4 mx-0 mb-0 data-[state=active]:flex data-[state=active]:flex-col">
        <PolicyAnalysisTabContent onSuccess={handleSuccess} />
      </TabsContent>
    </Tabs>
  );

  // SSR: render only the trigger button without Dialog/Drawer wrapper to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // Mobile: Use Drawer
  if (useDrawerLayout) {
    return (
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="px-6 py-4 border-b flex-shrink-0">
            <DrawerTitle>Submit Report</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
            {modalContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Submit Report</DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}

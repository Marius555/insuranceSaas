"use client";

import { useEffect, useState } from "react";
import { OnboardingModal } from "./onboarding-modal";
import { getOnboardingFlow, clearOnboardingFlow, type OnboardingFlow } from "@/lib/utils/auth-redirect-storage";

interface OnboardingWrapperProps {
  session: { id: string; email: string; name: string } | null;
  needsOnboarding: boolean;
}

export function OnboardingWrapper({ session, needsOnboarding }: OnboardingWrapperProps) {
  const [showModal, setShowModal] = useState(needsOnboarding);
  const [flowType, setFlowType] = useState<OnboardingFlow | null>(null);

  useEffect(() => {
    // Update modal visibility based on prop
    setShowModal(needsOnboarding);

    // Retrieve the flow type when modal should be shown
    if (needsOnboarding) {
      const savedFlow = getOnboardingFlow();
      setFlowType(savedFlow);
      // Clear the flow type from storage after retrieving
      clearOnboardingFlow();
    }
  }, [needsOnboarding, session]);

  if (!showModal || !session) {
    return null;
  }

  return (
    <OnboardingModal
      userId={session.id}
      email={session.email}
      name={session.name}
      flowType={flowType}
    />
  );
}

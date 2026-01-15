"use client";

import { useEffect, useState } from "react";
import { OnboardingModal } from "./onboarding-modal";

interface OnboardingWrapperProps {
  session: { id: string; email: string; name: string } | null;
  needsOnboarding: boolean;
}

export function OnboardingWrapper({ session, needsOnboarding }: OnboardingWrapperProps) {
  const [showModal, setShowModal] = useState(needsOnboarding);

  useEffect(() => {
    // Update modal visibility based on prop
    setShowModal(needsOnboarding);
  }, [needsOnboarding, session]);

  if (!showModal || !session) {
    return null;
  }

  return (
    <OnboardingModal
      userId={session.id}
      email={session.email}
      name={session.name}
    />
  );
}

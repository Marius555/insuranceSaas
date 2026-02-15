"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import {
  getAuthRedirect,
  clearAuthRedirect,
  saveAuthRedirect,
  saveOnboardingFlow,
  type OnboardingFlow,
} from "@/lib/utils/auth-redirect-storage";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building06Icon, UserCircleIcon } from "@hugeicons/core-free-icons";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

interface HeroWithUploadProps {
  session: SessionUser | null;
}

export function HeroWithUpload({ session }: HeroWithUploadProps) {
  const router = useRouter();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [flowType, setFlowType] = useState<OnboardingFlow | null>(null);

  // Handle auth redirects on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Handle auth=required from protected routes
    const authRequired = params.get('auth') === 'required';
    const returnTo = params.get('returnTo');

    if (authRequired && returnTo) {
      saveAuthRedirect(returnTo);
      window.history.replaceState({}, '', '/');
      queueMicrotask(() => setShowSignInModal(true));
      return;
    }

    // Handle successful auth with pending redirect
    if (session) {
      const savedReturnTo = getAuthRedirect();
      if (savedReturnTo) {
        clearAuthRedirect();
        router.push(savedReturnTo);
      }
    }

    // Clean URL if there are query params
    if (params.toString()) {
      window.history.replaceState({}, '', '/');
    }
  }, [session, router]);

  const handleCheckCarClick = () => {
    saveOnboardingFlow('user');
    if (session) {
      router.push(`/auth/dashboard/${session.id}`);
    } else {
      setFlowType('user');
      setShowSignInModal(true);
    }
  };

  const handleInsuranceClick = () => {
    saveOnboardingFlow('insurance');
    if (session) {
      router.push(`/auth/dashboard/${session.id}`);
    } else {
      setFlowType('insurance');
      setShowSignInModal(true);
    }
  };

  return (
    <>
      <section className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center justify-center">
        {/* Full-width grid background */}
        <div
          className="absolute inset-0 bg-grid"
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)'
          }}
        />
        {/* Centered content */}
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center space-y-8">

          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Analyze Vehicle Damage in{" "}
              <span className="text-primary">Seconds</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload photos or videos of vehicle damage and get instant AI-powered analysis.
              Accurate damage assessment, cost estimates, and fraud detection.
            </p>
          </div>

          {/* Signup Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleCheckCarClick}
              size="lg"
              className="text-lg px-8 py-6"
            >
              <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2.5} /> Check Your Car
            </Button>
            <Button
              onClick={handleInsuranceClick}
              size="lg"
              className="text-lg px-8 py-6 "
              variant="outline"
            >
              <HugeiconsIcon icon={Building06Icon} strokeWidth={2.5} /> For Insurance Companies
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>95%+ Accuracy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Fraud Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Instant Results</span>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => { setShowSignInModal(false); setFlowType(null); }}
        flowType={flowType}
      />
    </>
  );
}

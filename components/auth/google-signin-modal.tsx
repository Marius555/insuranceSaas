"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  Briefcase01Icon,
  Building06Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useOAuthPopup } from "@/hooks/use-oauth-popup";
import { checkUserStatus } from "@/app/api/auth/check-user/actions";
import { completeOnboarding } from "@/app/api/auth/onboarding/actions";
import { registerCompany } from "@/app/api/company/register/actions";
import type { OnboardingFlow } from "@/lib/utils/auth-redirect-storage";

type ModalStep =
  | "sign-in"
  | "authenticating"
  | "select-type"
  | "insurance-details"
  | "company-registration"
  | "registration-success"
  | "congratulations";

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  flowType?: OnboardingFlow | null;
}

export function GoogleSignInModal({
  isOpen,
  onClose,
  flowType,
}: GoogleSignInModalProps) {
  const [step, setStep] = useState<ModalStep>("sign-in");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User data from OAuth
  const [userData, setUserData] = useState<{
    userId: string;
    name: string;
    email: string;
  } | null>(null);

  // Onboarding form state
  const [companyCode, setCompanyCode] = useState("");
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
  });
  const [generatedCompanyCode, setGeneratedCompanyCode] = useState<
    string | null
  >(null);

  const { resolvedTheme } = useTheme();

  const handleSuccess = useCallback(
    async (data: { userId: string; name: string; email: string }) => {
      setUserData(data);
      setError("");

      try {
        const status = await checkUserStatus(data.userId);

        if (status.exists && status.onboardingCompleted) {
          // Existing user - redirect to dashboard
          window.location.href = `/auth/dashboard/${data.userId}`;
        } else {
          // New user - show onboarding
          setStep("select-type");
        }
      } catch {
        // If check fails, show onboarding as fallback
        setStep("select-type");
      }
    },
    []
  );

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setStep("sign-in");
  }, []);

  const handlePopupBlocked = useCallback(() => {
    // Fallback to full-page redirect
    window.location.href = "/api/auth/google/redirect";
  }, []);

  const handlePopupClosed = useCallback(() => {
    // Only reset if we're still in authenticating state
    setStep((current) => {
      if (current === "authenticating") {
        return "sign-in";
      }
      return current;
    });
  }, []);

  const { openPopup, cleanup } = useOAuthPopup({
    theme: resolvedTheme,
    onSuccess: handleSuccess,
    onError: handleError,
    onPopupBlocked: handlePopupBlocked,
    onPopupClosed: handlePopupClosed,
  });

  const handleSignIn = () => {
    setError("");
    setStep("authenticating");
    openPopup();
  };

  const handleClose = () => {
    if (step === "authenticating") {
      cleanup();
    }
    // Only allow closing on sign-in and authenticating steps
    if (step === "sign-in" || step === "authenticating") {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setStep("sign-in");
    setError("");
    setUserData(null);
    setCompanyCode("");
    setCompanyFormData({
      name: "",
      contact_email: "",
      contact_phone: "",
      website: "",
    });
    setGeneratedCompanyCode(null);
    setIsSubmitting(false);
  };

  // --- Onboarding handlers (reusing server actions from existing onboarding) ---

  const handleUserTypeSelect = async (
    type: "user" | "insurance_adjuster"
  ) => {
    if (type === "user") {
      await handleOnboardingSubmit(type, null);
    } else {
      setStep("insurance-details");
    }
  };

  const handleOnboardingSubmit = async (
    type: "user" | "insurance_adjuster",
    company_code: string | null
  ) => {
    if (!userData) return;
    setIsSubmitting(true);
    setError("");

    try {
      const result = await completeOnboarding({
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        role: type,
        company_code,
      });

      if (!result.success) {
        setError(result.message || "Onboarding failed");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setStep("congratulations");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCompanyRegistration = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await registerCompany(companyFormData);

      if (!result.success) {
        setError(result.message || "Registration failed");
        setIsSubmitting(false);
        return;
      }

      setGeneratedCompanyCode(result.companyCode!);
      setStep("registration-success");
      setIsSubmitting(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleCompanyAdminOnboarding = async (code: string) => {
    if (!userData) return;
    setIsSubmitting(true);
    setError("");

    try {
      const result = await completeOnboarding({
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        role: "insurance_adjuster",
        company_code: code,
      });

      if (!result.success) {
        setError(result.message || "Onboarding failed");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setStep("congratulations");
    } catch {
      setError("Failed to complete setup. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    if (!userData) return;
    window.location.href = `/auth/dashboard/${userData.userId}`;
  };

  // Determine if the dialog can be closed
  const canClose =
    step === "sign-in" || step === "authenticating";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && canClose) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (!canClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) e.preventDefault();
        }}
        showCloseButton={canClose}
      >
        {/* Step: Sign In */}
        {step === "sign-in" && (
          <>
            <DialogHeader>
              <DialogTitle>Sign in to analyze damage</DialogTitle>
              <DialogDescription>
                We need to verify your identity before running the AI analysis.
                Your uploaded files are saved and ready to analyze.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-6 py-6">
              {/* Google Logo + Car Icon */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GoogleIcon className="h-6 w-6" />
                </div>
                <span className="text-2xl text-muted-foreground">&rarr;</span>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="w-full text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Sign in button */}
              <Button onClick={handleSignIn} size="lg" className="w-full">
                <GoogleIcon className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>

              {/* Privacy notice */}
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy
                Policy. We&apos;ll only use your Google account for
                authentication.
              </p>
            </div>
          </>
        )}

        {/* Step: Authenticating */}
        {step === "authenticating" && (
          <>
            <DialogHeader>
              <DialogTitle>Signing in...</DialogTitle>
              <DialogDescription>
                Complete the sign-in process in the popup window.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-6 py-8">
              {/* Spinner */}
              <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Waiting for Google authentication...
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* Step: Select Type */}
        {step === "select-type" && (
          <>
            <DialogHeader>
              <DialogTitle>Welcome! Let&apos;s get you set up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {flowType === "user"
                  ? "You can check vehicle damage and get repair cost estimates."
                  : flowType === "insurance"
                    ? "Select how you want to use VehicleClaim for your insurance work."
                    : "Are you a regular user checking vehicle damage, or an insurance company employee reviewing claims?"}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Regular User Option */}
                {(flowType === "user" || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start"
                    onClick={() => handleUserTypeSelect("user")}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon
                          icon={UserCircleIcon}
                          className="h-5 w-5 text-primary"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Regular User</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          I want to check damage and estimate repair costs
                        </div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Insurance Employee Option */}
                {(flowType === "insurance" || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start"
                    onClick={() => handleUserTypeSelect("insurance_adjuster")}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon
                          icon={Briefcase01Icon}
                          className="h-5 w-5 text-primary"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">
                          Insurance Company Employee
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          I review and process claims for my company
                        </div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Register Company Option */}
                {(flowType === "insurance" || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start"
                    onClick={() => setStep("company-registration")}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon
                          icon={Building06Icon}
                          className="h-5 w-5 text-primary"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">
                          Register as a Company
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Set up your insurance company and get a code for your
                          team
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step: Insurance Details (company code) */}
        {step === "insurance-details" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Your Company Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="company-code">Company Code</Label>
                <Input
                  id="company-code"
                  placeholder="e.g., ACME-1234"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the code provided by your insurance company.
                </p>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select-type");
                    setError("");
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={() =>
                    handleOnboardingSubmit("insurance_adjuster", companyCode)
                  }
                  disabled={!companyCode || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Company Registration */}
        {step === "company-registration" && (
          <>
            <DialogHeader>
              <DialogTitle>Register Your Insurance Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Fill out the details below to create your company profile and
                receive a unique code.
              </p>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyFormData.name}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Acme Insurance Co."
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-email">Contact Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyFormData.contact_email}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      contact_email: e.target.value,
                    })
                  }
                  placeholder="admin@acmeinsurance.com"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Your company code will be sent to this email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-phone">Contact Phone (Optional)</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  value={companyFormData.contact_phone}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      contact_phone: e.target.value,
                    })
                  }
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website">
                  Company Website (Optional)
                </Label>
                <Input
                  id="company-website"
                  type="url"
                  value={companyFormData.website}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      website: e.target.value,
                    })
                  }
                  placeholder="https://acmeinsurance.com"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("select-type");
                    setError("");
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCompanyRegistration}
                  disabled={
                    !companyFormData.name ||
                    !companyFormData.contact_email ||
                    isSubmitting
                  }
                  className="flex-1"
                >
                  {isSubmitting ? "Registering..." : "Register Company"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step: Registration Success */}
        {step === "registration-success" && generatedCompanyCode && (
          <>
            <DialogHeader>
              <DialogTitle>Company Registered Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert className="bg-background">
                <AlertTitle>Registration Complete</AlertTitle>
                <AlertDescription>
                  Your insurance company has been registered. Share the code
                  below with your employees.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Your Company Code:
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl font-bold text-primary font-mono tracking-wider">
                    {generatedCompanyCode}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCompanyCode);
                    }}
                  >
                    <HugeiconsIcon icon={Copy01Icon} className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-background p-4 rounded-md border text-sm">
                <p className="font-medium text-foreground mb-2">
                  What&apos;s Next?
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                  <li>Share this code with your employees</li>
                  <li>
                    Employees sign up and select &quot;Insurance Company
                    Employee&quot;
                  </li>
                  <li>They enter this code during onboarding</li>
                  <li>They&apos;ll automatically join your company team</li>
                </ol>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This code has also been sent to {companyFormData.contact_email}
              </p>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={() =>
                  handleCompanyAdminOnboarding(generatedCompanyCode)
                }
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing Setup..." : "Continue to Dashboard"}
              </Button>
            </div>
          </>
        )}

        {/* Step: Congratulations */}
        {step === "congratulations" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Welcome!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-8">
              {/* Checkmark circle */}
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  Your account is ready!
                </p>
                <p className="text-sm text-muted-foreground">
                  You&apos;re all set to start using VehicleClaim AI.
                </p>
              </div>

              <Button
                onClick={handleGoToDashboard}
                size="lg"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Extracted Google icon SVG component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

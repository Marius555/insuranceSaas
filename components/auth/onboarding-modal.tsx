"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/app/api/auth/onboarding/actions";
import { registerCompany } from "@/app/api/company/register/actions";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon, Briefcase01Icon, Building06Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import type { OnboardingFlow } from "@/lib/utils/auth-redirect-storage";

interface OnboardingModalProps {
  userId: string;
  email: string;
  name: string;
  flowType?: OnboardingFlow | null;
}

export function OnboardingModal({ userId, email, name, flowType }: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'select-type' | 'insurance-details' | 'company-registration' | 'registration-success'>('select-type');
  const [userType, setUserType] = useState<'user' | 'insurance_adjuster' | null>(null);
  const [companyCode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Company registration form data
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });

  // Success state for generated code
  const [generatedCompanyCode, setGeneratedCompanyCode] = useState<string | null>(null);

  const handleUserTypeSelect = (type: 'user' | 'insurance_adjuster') => {
    setUserType(type);
    if (type === 'user') {
      handleSubmit(type, null);
    } else {
      setStep('insurance-details');
    }
  };

  const handleSubmit = async (
    type: 'user' | 'insurance_adjuster',
    company_code: string | null
  ) => {
    console.log('🔵 handleSubmit called:', { type, company_code });
    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔵 Calling completeOnboarding...');
      const result = await completeOnboarding({
        userId,
        email,
        name,
        role: type,
        company_code,
      });

      console.log('🔵 completeOnboarding result:', result);

      if (!result.success) {
        console.error('🔴 Onboarding failed:', result.message);
        setError(result.message || 'Onboarding failed');
        setIsSubmitting(false);
        return;
      }

      // Use full page reload to ensure clean state after onboarding
      const destination = `/auth/dashboard/${userId}`;
      console.log('🟢 Onboarding successful! Redirecting to:', destination);

      // Force navigation
      window.location.href = destination;
    } catch (error) {
      console.error('🔴 Onboarding exception:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCompanyRegistration = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await registerCompany(companyFormData);

      if (!result.success) {
        setError(result.message || 'Registration failed');
        setIsSubmitting(false);
        return;
      }

      // Success: Store generated code and move to success step
      setGeneratedCompanyCode(result.companyCode!);
      setStep('registration-success');
      setIsSubmitting(false);

    } catch (error) {
      console.error('Company registration exception:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCompanyAdminOnboarding = async (companyCode: string) => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await completeOnboarding({
        userId,
        email,
        name,
        role: 'insurance_adjuster',
        company_code: companyCode,
      });

      if (!result.success) {
        setError(result.message || 'Onboarding failed');
        setIsSubmitting(false);
        return;
      }

      // Redirect to insurance dashboard
      window.location.href = '/insurance/claims';
    } catch (error) {
      console.error('Company admin onboarding exception:', error);
      setError('Failed to complete setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === 'select-type' && (
          <>
            <DialogHeader>
              <DialogTitle>Welcome! Let&apos;s get you set up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {flowType === 'user'
                  ? 'You can check vehicle damage and get repair cost estimates.'
                  : flowType === 'insurance'
                  ? 'Select how you want to use VehicleClaim for your insurance work.'
                  : 'Are you a regular user checking vehicle damage, or an insurance company employee reviewing claims?'}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Regular User Option - shown for 'user' flow or no flow */}
                {(flowType === 'user' || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => handleUserTypeSelect('user')}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon icon={UserCircleIcon} className="h-5 w-5 text-primary" />
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

                {/* Insurance Employee Option - shown for 'insurance' flow or no flow */}
                {(flowType === 'insurance' || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => handleUserTypeSelect('insurance_adjuster')}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon icon={Briefcase01Icon} className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Insurance Company Employee</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          I review and process claims for my company
                        </div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Register Company Option - shown for 'insurance' flow or no flow */}
                {(flowType === 'insurance' || !flowType) && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => {
                      setUserType(null);
                      setStep('company-registration');
                    }}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="mt-0.5">
                        <HugeiconsIcon icon={Building06Icon} className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Register as a Company</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Set up your insurance company and get a code for your team
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {step === 'insurance-details' && (
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
                  Enter the code provided by your insurance company. Don&apos;t have one?{' '}
                  <a href="/company-register" className="text-primary hover:underline">
                    Register your company
                  </a>
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
                    setStep('select-type');
                    setError('');
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleSubmit('insurance_adjuster', companyCode)}
                  disabled={!companyCode || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'company-registration' && (
          <>
            <DialogHeader>
              <DialogTitle>Register Your Insurance Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Fill out the details below to create your company profile and receive a unique code.
              </p>

              {/* Company Name Field */}
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyFormData.name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                  placeholder="e.g., Acme Insurance Co."
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Contact Email Field */}
              <div className="space-y-2">
                <Label htmlFor="company-email">Contact Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyFormData.contact_email}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, contact_email: e.target.value })}
                  placeholder="admin@acmeinsurance.com"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your company code will be sent to this email
                </p>
              </div>

              {/* Contact Phone Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="company-phone">Contact Phone (Optional)</Label>
                <Input
                  id="company-phone"
                  type="tel"
                  value={companyFormData.contact_phone}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              {/* Website Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="company-website">Company Website (Optional)</Label>
                <Input
                  id="company-website"
                  type="url"
                  value={companyFormData.website}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                  placeholder="https://acmeinsurance.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('select-type');
                    setError('');
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCompanyRegistration}
                  disabled={!companyFormData.name || !companyFormData.contact_email || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Registering...' : 'Register Company'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'registration-success' && generatedCompanyCode && (
          <>
            <DialogHeader>
              <DialogTitle>Company Registered Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Success Message */}
              <Alert className="bg-background">
                <AlertTitle>Registration Complete</AlertTitle>
                <AlertDescription>
                  Your insurance company has been registered. Share the code below with your employees.
                </AlertDescription>
              </Alert>

              {/* Company Code Display */}
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Your Company Code:</p>
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

              {/* Instructions */}
              <div className="bg-background p-4 rounded-md border text-sm">
                <p className="font-medium text-foreground mb-2">What&apos;s Next?</p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                  <li>Share this code with your employees</li>
                  <li>Employees sign up and select &quot;Insurance Company Employee&quot;</li>
                  <li>They enter this code during onboarding</li>
                  <li>They&apos;ll automatically join your company team</li>
                </ol>
              </div>

              {/* Email Confirmation */}
              <p className="text-xs text-muted-foreground text-center">
                This code has also been sent to {companyFormData.contact_email}
              </p>

              {/* Close Button */}
              <Button
                onClick={() => handleCompanyAdminOnboarding(generatedCompanyCode)}
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Completing Setup...' : 'Continue to Dashboard'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

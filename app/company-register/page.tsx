"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerCompany } from "@/app/api/company/register/actions";
import Link from "next/link";

export default function CompanyRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    companyCode?: string
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const response = await registerCompany(formData);
    setResult(response);
    setIsSubmitting(false);

    if (response.success) {
      // Clear form on success
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Register Your Insurance Company</h1>
          <p className="text-gray-600">
            Join VehicleClaim AI to streamline your claims processing with AI-powered analysis
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Acme Insurance Co."
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="admin@acmeinsurance.com"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-600 mt-1">
                Your company code will be sent to this email
              </p>
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="website">Company Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://acmeinsurance.com"
                disabled={isSubmitting}
              />
            </div>

            {result && (
              <div className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium mb-1">
                  {result.success ? '✓ Success!' : '✗ Error'}
                </p>
                <p className="text-sm">{result.message}</p>
                {result.companyCode && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-300">
                    <p className="text-sm font-medium mb-1">Your Company Code:</p>
                    <p className="text-2xl font-bold text-green-900 font-mono tracking-wider">
                      {result.companyCode}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      This code has been sent to {formData.contact_email}.
                      Share it with your employees so they can join your company.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Company'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-sm text-gray-600">
            <p className="font-medium mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>You&apos;ll receive your unique company code via email</li>
              <li>Share the code with your employees</li>
              <li>Employees sign up and enter the code during onboarding</li>
              <li>They&apos;ll automatically join your company team as adjusters</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}

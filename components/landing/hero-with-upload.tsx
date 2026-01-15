"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { MediaPreview } from "@/components/gemini-analysis/media-preview";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import { AnalysisResultDisplay } from "@/components/gemini-analysis/analysis-result-display";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import { analyzeAutoDamage } from "@/lib/gemini/actions/analyzeVideo";
import { analyzeAutoDamageFromImages } from "@/lib/gemini/actions/analyzeImage";
import {
  savePendingAnalysis,
  getPendingAnalysis,
  clearPendingAnalysis,
  reconstructFilesFromPending,
} from "@/lib/utils/pending-analysis-storage";
import {
  saveAuthRedirect,
  getAuthRedirect,
  clearAuthRedirect,
} from "@/lib/utils/auth-redirect-storage";
import type { AutoDamageAnalysis, ImageMimeType, VideoMimeType } from "@/lib/gemini/types";

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
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<AutoDamageAnalysis | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  // On mount: check for ?analyze=true from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldAnalyze = params.get('analyze') === 'true';
    const oauthError = params.get('error');

    if (oauthError) {
      if (oauthError === 'oauth_failed') {
        setError('Google sign-in failed. Please try again.');
      } else if (oauthError === 'oauth_redirect_failed') {
        setError('Failed to initiate Google sign-in. Please try again.');
      } else if (oauthError === 'invalid_callback') {
        setError('Invalid OAuth response. Please try again.');
      }
      // Clean URL
      window.history.replaceState({}, '', '/');
      return;
    }

    // Handle auth=required from protected routes
    const authRequired = params.get('auth') === 'required';
    const returnTo = params.get('returnTo');

    if (authRequired && returnTo) {
      // Save the return destination to localStorage
      saveAuthRedirect(returnTo);
      // Auto-open sign-in modal
      setShowSignInModal(true);
      // Clean URL
      window.history.replaceState({}, '', '/');
      return;
    }

    if (shouldAnalyze && session) {
      // Check if user came from a protected route
      const savedReturnTo = getAuthRedirect();
      if (savedReturnTo) {
        // User came from a protected route, redirect them back
        clearAuthRedirect();
        router.push(savedReturnTo);
        return;
      }

      // Load pending analysis from localStorage
      const pending = getPendingAnalysis();
      if (pending) {
        try {
          const reconstructedFiles = reconstructFilesFromPending(pending);
          setFiles(reconstructedFiles);
          setMediaType(pending.mediaType);
          // Auto-trigger analysis
          handleAnalyze(reconstructedFiles, pending.mediaType);
        } catch (err) {
          console.error('Failed to reconstruct files:', err);
          setError('Failed to restore uploaded files. Please upload again.');
          clearPendingAnalysis();
        }
      }
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, [session, router]);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // Auto-detect media type from first file
    const firstFile = selectedFiles[0];
    const newMediaType = firstFile.type.startsWith('image/') ? 'image' : 'video';

    setFiles(selectedFiles);
    setMediaType(newMediaType);
    setError("");
    setResult(null);
    setSecurityWarnings([]);

    // Save to localStorage immediately
    try {
      await savePendingAnalysis(selectedFiles, newMediaType);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        // Clear files if save failed
        setFiles([]);
        setMediaType(null);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    if (newFiles.length === 0) {
      setMediaType(null);
      clearPendingAnalysis();
    } else if (mediaType) {
      // Update localStorage with remaining files
      savePendingAnalysis(newFiles, mediaType).catch(err => {
        console.error('Failed to update pending analysis:', err);
      });
    }
  };

  const handleAnalyze = async (
    filesToAnalyze?: File[],
    typeToAnalyze?: 'image' | 'video' | null
  ) => {
    const analysisFiles = filesToAnalyze || files;
    const analysisType = typeToAnalyze || mediaType;

    if (analysisFiles.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    // Check authentication
    if (!session) {
      setShowSignInModal(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(1);
    setError("");
    setResult(null);
    setSecurityWarnings([]);

    try {
      // Step 1: Validating
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Scanning (security)
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Analyzing
      setCurrentStep(3);

      if (analysisType === 'image') {
        // Convert images to base64
        const imagePromises = analysisFiles.map(file => {
          return new Promise<{ base64: string; mimeType: ImageMimeType }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result?.toString().split(',')[1];
              if (!base64) {
                reject(new Error('Failed to read file'));
                return;
              }
              resolve({
                base64,
                mimeType: file.type as ImageMimeType,
              });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        });

        const imageData = await Promise.all(imagePromises);

        const analysisResult = await analyzeAutoDamageFromImages(
          imageData,
          { scanForInjection: true }
        );

        if (analysisResult.success) {
          setResult(analysisResult.data.analysis);
          if (analysisResult.data.securityWarnings) {
            setSecurityWarnings(analysisResult.data.securityWarnings);
          }
          // Clear pending analysis on success
          clearPendingAnalysis();
        } else {
          setError(analysisResult.message);
          setIsAnalyzing(false);
          return;
        }
      } else {
        // Video analysis
        const file = analysisFiles[0];
        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64 = reader.result?.toString().split(',')[1];
              if (!base64) {
                reject(new Error('Failed to read video file'));
                return;
              }

              const analysisResult = await analyzeAutoDamage(
                base64,
                file.type as VideoMimeType,
                true
              );

              if (analysisResult.success) {
                setResult(analysisResult.data.analysis);
                // Clear pending analysis on success
                clearPendingAnalysis();
              } else {
                setError(analysisResult.message);
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }

      // Step 4: Validating
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 5: Complete
      setCurrentStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMediaType(null);
    setResult(null);
    setSecurityWarnings([]);
    setError("");
    clearPendingAnalysis();
  };

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in-up">
            <Badge className="inline-block">AI-Powered Damage Assessment</Badge>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Analyze Vehicle Damage in{" "}
                <span className="text-primary">Seconds</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl">
                Upload photos or videos of vehicle damage and get instant AI-powered analysis.
                No registration required to upload - just sign in with Google to see results.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
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

          {/* Right Column - Upload Area */}
          <div className="relative animate-fade-in-up animation-delay-200">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
              <div className="min-h-[300px] flex flex-col">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* File Upload Zone - Show when no files or not analyzing */}
                  {files.length === 0 && !isAnalyzing && !result && (
                    <div className="h-full flex items-center justify-center">
                      <FileUploadZone
                        accept="image/*,video/*"
                        multiple={true}
                        maxFiles={5}
                        onFilesSelected={handleFilesSelected}
                        disabled={isAnalyzing}
                        label="Upload Damage Media"
                        description="Images (JPG, PNG) or Video (MP4, MOV). Up to 5 images or 1 video."
                      />
                    </div>
                  )}

                  {/* Media Preview - Show when files selected but not analyzing and no result */}
                  {files.length > 0 && !isAnalyzing && !result && (
                    <div className="h-full flex flex-col gap-4">
                      <MediaPreview
                        files={files}
                        onRemove={handleRemoveFile}
                        mediaType={mediaType!}
                        showAngleSelector={mediaType === 'image'}
                      />

                      {/* Analyze Button */}
                      <Button
                        onClick={() => handleAnalyze()}
                        size="lg"
                        className="w-full"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                        Analyze Damage with AI
                      </Button>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  {isAnalyzing && (
                    <div className="h-full flex items-center justify-center">
                      <ProgressIndicator currentStep={currentStep} />
                    </div>
                  )}

                  {/* Results */}
                  {result && (
                    <div className="h-full overflow-hidden flex flex-col gap-4">
                      <div className="flex-1 overflow-y-auto">
                        <AnalysisResultDisplay
                          analysis={result}
                          securityWarnings={securityWarnings}
                          riskLevel={securityWarnings.length > 0 ? 'medium' : 'low'}
                        />
                      </div>

                      {/* Reset Button */}
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="w-full"
                      >
                        Analyze Another File
                      </Button>
                    </div>
                  )}
                </div>

                {/* Error Message - Outside main flow */}
                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Error:</strong> {error}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Google Sign-In Modal */}
      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </>
  );
}

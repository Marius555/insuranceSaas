"use client";

import { useState } from "react";
import { analyzeAutoDamage } from "@/lib/gemini/actions/analyzeVideo";
import { analyzeAutoDamageWithPolicy } from "@/lib/gemini/actions/analyzeVideoPlusPolicy";
import type { AutoDamageAnalysis, EnhancedAutoDamageAnalysis } from "@/lib/gemini/types";

export function TestGeminiClient() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Enhanced analysis state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<string>("");
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<string>("");

  async function testVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file (MP4, MOV, etc.)');
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 20MB limit`);
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (!base64) {
          setError('Failed to read file');
          setLoading(false);
          return;
        }

        // Determine MIME type
        const mimeType = file.type as 'video/mp4' | 'video/mov' | 'video/avi';

        // Call the analysis function
        const analysisResult = await analyzeAutoDamage(
          base64,
          mimeType,
          true // isBase64
        );

        if (analysisResult.success) {
          const analysis = analysisResult.data.analysis as AutoDamageAnalysis;
          setResult(JSON.stringify(analysis, null, 2));
          console.log('Token usage:', analysisResult.usage);
        } else {
          setError(analysisResult.message);
        }

        setLoading(false);
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setLoading(false);
    }
  }

  async function testEnhancedAnalysis() {
    if (!videoFile || !policyFile) {
      setEnhancedError('Please upload both video and policy PDF files');
      return;
    }

    setEnhancedLoading(true);
    setEnhancedError("");
    setEnhancedResult("");

    try {
      // Convert video to base64
      const videoReader = new FileReader();
      videoReader.onloadend = async () => {
        const videoBase64 = videoReader.result?.toString().split(',')[1];
        if (!videoBase64) {
          setEnhancedError('Failed to read video file');
          setEnhancedLoading(false);
          return;
        }

        // Convert policy to base64
        const policyReader = new FileReader();
        policyReader.onloadend = async () => {
          const policyBase64 = policyReader.result?.toString().split(',')[1];
          if (!policyBase64) {
            setEnhancedError('Failed to read policy file');
            setEnhancedLoading(false);
            return;
          }

          // Call enhanced analysis with both video and policy
          const videoMimeType = videoFile.type as 'video/mp4' | 'video/mov' | 'video/avi';
          const analysisResult = await analyzeAutoDamageWithPolicy(
            videoBase64,
            videoMimeType,
            policyBase64,
            true // isBase64
          );

          if (analysisResult.success) {
            const analysis = analysisResult.data.analysis as EnhancedAutoDamageAnalysis;
            setEnhancedResult(JSON.stringify(analysis, null, 2));
            console.log('Enhanced analysis token usage:', analysisResult.usage);
          } else {
            setEnhancedError(analysisResult.message);
          }

          setEnhancedLoading(false);
        };

        policyReader.onerror = () => {
          setEnhancedError('Failed to read policy file');
          setEnhancedLoading(false);
        };

        policyReader.readAsDataURL(policyFile);
      };

      videoReader.onerror = () => {
        setEnhancedError('Failed to read video file');
        setEnhancedLoading(false);
      };

      videoReader.readAsDataURL(videoFile);
    } catch (err) {
      setEnhancedError(err instanceof Error ? err.message : 'Unknown error occurred');
      setEnhancedLoading(false);
    }
  }

  function handleVideoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setEnhancedError('Please upload a video file (MP4, MOV, etc.)');
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setEnhancedError(`Video file size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 20MB limit`);
      return;
    }

    setVideoFile(file);
    setEnhancedError("");
  }

  function handlePolicyFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setEnhancedError('Please upload a PDF file');
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setEnhancedError(`Policy file size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 20MB limit`);
      return;
    }

    setPolicyFile(file);
    setEnhancedError("");
  }

  return (
    <div className="space-y-6">
      {/* Video Analysis Test */}
      <div className="border border-gray-200 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Auto Damage Video Analysis</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload a video of car damage for AI analysis (MP4, MOV, AVI - max 20MB)
        </p>

        <input
          type="file"
          accept="video/mp4,video/mov,video/avi"
          onChange={testVideoUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-700">Analyzing video with Gemini 2.5 Flash-Lite...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Analysis Result:</h3>
            <pre className="p-4 bg-gray-100 rounded overflow-auto text-sm border border-gray-200">
              {result}
            </pre>
          </div>
        )}
      </div>

      {/* Enhanced Analysis: Video + Policy */}
      <div className="border border-purple-200 p-6 rounded-lg bg-purple-50">
        <h2 className="text-xl font-semibold mb-2 text-purple-900">
          Enhanced Analysis: Video + Policy Cross-Reference
        </h2>
        <p className="text-sm text-purple-700 mb-4">
          Upload both car damage video AND insurance policy PDF for intelligent claim assessment
        </p>

        <div className="space-y-4">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Car Damage Video (MP4, MOV, AVI - max 20MB)
            </label>
            <input
              type="file"
              accept="video/mp4,video/mov,video/avi"
              onChange={handleVideoFileChange}
              disabled={enhancedLoading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {videoFile && (
              <p className="mt-1 text-xs text-green-600">
                ✓ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          {/* Policy Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Insurance Policy Document (PDF - max 20MB)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePolicyFileChange}
              disabled={enhancedLoading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {policyFile && (
              <p className="mt-1 text-xs text-green-600">
                ✓ {policyFile.name} ({(policyFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={testEnhancedAnalysis}
            disabled={!videoFile || !policyFile || enhancedLoading}
            className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg
              hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {enhancedLoading ? 'Analyzing...' : 'Analyze Claim (Video + Policy)'}
          </button>
        </div>

        {enhancedLoading && (
          <div className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span className="text-purple-800">
                Performing cross-reference reasoning with Gemini 2.5 Flash-Lite...
              </span>
            </div>
            <p className="text-xs text-purple-700 mt-2 ml-8">
              Analyzing video damage + policy coverage + calculating claim validity
            </p>
          </div>
        )}

        {enhancedError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm">
              <strong>Error:</strong> {enhancedError}
            </p>
          </div>
        )}

        {enhancedResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-purple-900">Enhanced Analysis Result:</h3>
            <div className="p-4 bg-white rounded border border-purple-200">
              <pre className="overflow-auto text-xs">
                {enhancedResult}
              </pre>
            </div>
            <p className="mt-2 text-xs text-purple-700">
              Check browser console for detailed token usage metadata
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 p-6 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-3">Test Instructions</h3>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Basic Video Analysis:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
            <li>Prepare a video showing car damage (bumper, dent, scratch, etc.)</li>
            <li>Ensure video is under 20MB and in MP4/MOV/AVI format</li>
            <li>Upload the video using the first file input</li>
            <li>Wait for Gemini to analyze (typically 5-15 seconds)</li>
            <li>Review the structured damage report in JSON format</li>
          </ol>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-purple-800 mb-2">Enhanced Analysis (The Secret Sauce):</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
            <li>Upload the same car damage video (or a different one)</li>
            <li>Upload a sample insurance policy PDF document</li>
            <li>Click "Analyze Claim (Video + Policy)" button</li>
            <li>Wait for cross-reference reasoning (20-30 seconds)</li>
            <li>Review the enhanced analysis with:
              <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5 text-xs">
                <li>Damage assessment from video</li>
                <li>Policy coverage extraction</li>
                <li>Claim status (approved/denied/partial)</li>
                <li>Financial breakdown with estimated payout</li>
                <li>Policy section citations</li>
              </ul>
            </li>
          </ol>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          <strong>Note:</strong> Check browser console for detailed token usage metadata
        </p>
      </div>
    </div>
  );
}

import { TestGeminiClient } from "@/components/test-gemini-client";

export default function TestGeminiPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Gemini 2.5 Flash-Lite Integration Test</h1>
      <p className="text-gray-600 mb-6">
        Test video analysis for auto damage assessment
      </p>
      <TestGeminiClient />
    </div>
  );
}

# Gemini API Integration - Comprehensive Guide

> **Skill Created:** January 2026
> **SDK Version:** @google/genai v1.34.0
> **Purpose:** Complete reference for Google Gemini API integration in Next.js with TypeScript
> **TypeScript:** Fully type-safe patterns with proper error handling

---

## Table of Contents

1. [Overview & Project Context](#overview--project-context) ⭐
2. [Installation & Setup](#installation--setup)
3. [Models Reference](#models-reference)
4. [Free Tier Limitations & Rate Limits](#free-tier-limitations--rate-limits) 🆓
5. [Text Generation](#text-generation)
6. [Streaming Responses](#streaming-responses)
7. [Configuration Parameters](#configuration-parameters)
8. [System Instructions](#system-instructions)
9. [Function Calling](#function-calling)
10. [Multimodal Input](#multimodal-input)
11. [Chat & Conversations](#chat--conversations)
12. [Error Handling](#error-handling)
13. [Security Best Practices](#security-best-practices)
14. [Performance Optimization](#performance-optimization)
15. [Next.js Integration Patterns](#nextjs-integration-patterns)
16. [Common Patterns for Your Project](#common-patterns-for-your-project)
17. [Quick Reference](#quick-reference)
18. [Official Resources](#official-resources)
19. [When to Use This Skill](#when-to-use-this-skill)

---

## Overview & Project Context

### What is Gemini API?

The Gemini API is **Google's advanced AI platform** that provides:
- 🤖 **State-of-the-art LLMs** - Gemini 2.5 Pro, 3 Pro, Flash variants
- 📝 **Text Generation** - Long-form content, summarization, analysis
- 🔧 **Function Calling** - Agentic workflows with tool integration
- 🎨 **Multimodal Input** - Text, images, video, audio, documents
- 💬 **Chat Interface** - Multi-turn conversations with context
- 🧠 **Advanced Reasoning** - Complex problem-solving with thinking mode
- 📊 **Structured Outputs** - JSON schema enforcement

### Your Project Status

**Installed Version:** `@google/genai@1.34.0`

**Environment Variables:**
```bash
GEMINI_API_KEY="your_api_key_here"
```

**Project Architecture:**
```
insurance/
├── app/                    # Next.js App Router
├── appwrite/              # Backend integration
├── lib/
│   └── gemini/           # Gemini API helpers (to be created)
└── .env                  # API key configuration
```

**Current Tech Stack:**
- Next.js 16.1.1 (App Router with React Server Components)
- React 19.2.3
- TypeScript 5
- Appwrite for database
- Server Actions pattern

**Primary Model:** **Gemini 2.5 Flash-Lite** 🚀

The project uses Gemini 2.5 Flash-Lite as the default model for optimal free tier performance:
- ✅ **15 RPM** on free tier (vs 2 RPM for Pro)
- ✅ **Fastest** response times
- ✅ **Lowest** cost
- ✅ Sufficient quality for 90%+ of insurance platform use cases

### Key Integration Points

**✅ Insurance Platform Use Cases:**
- Patient record summarization
- Medical document analysis
- Appointment scheduling assistance
- Insurance claim processing
- FAQ answering for patients and facilities
- Form field auto-completion suggestions

---

## Installation & Setup

### Install Package

```bash
npm install @google/genai
```

**Current version in your project:** `@google/genai@1.34.0` ✅ Already installed

**Requirements:**
- Node.js 18+ (recommended)
- TypeScript 5+ (for type safety)
- Next.js 13+ (for server actions)

### Environment Configuration

**Add to `.env` (already configured in your project):**
```bash
GEMINI_API_KEY="your_api_key_from_google_ai_studio"
```

**Get API Key:**
Visit https://aistudio.google.com/apikey to generate your API key

### Basic Client Initialization

```typescript
import { GoogleGenAI } from "@google/genai";

// Automatically uses GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

// Use the client
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: "Explain how insurance claims work",
});

console.log(response.text);
```

### Your Project Pattern (Server Action)

**File:** `lib/gemini/client.ts`

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

/**
 * Initialize Gemini client with API key from environment
 * Server-side only - never expose to client
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Generate content with Gemini
 * @param prompt - User prompt
 * @param model - Model to use (default: gemini-2.5-flash-lite)
 * @returns Generated text response
 */
export async function generateContent(
  prompt: string,
  model: string = "gemini-2.5-flash-lite"
) {
  try {
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return {
      success: true,
      text: response.text,
    };
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate content",
    };
  }
}
```

**Why This Pattern? 🔒**
- **Server-Only:** API key never exposed to client
- **Clean:** Simple function interface for the rest of your app
- **Safe:** Consistent error handling
- **Flexible:** Easy to switch models

---

## Models Reference

### Available Models

| Model | Context Window | Best For | Speed | Cost |
|-------|---------------|----------|-------|------|
| **gemini-2.5-pro** | 1M tokens | Complex reasoning, coding | Medium | Higher |
| **gemini-2.5-flash** | 1M tokens | Speed & scale, balanced tasks | Fast | Lower |
| **gemini-2.5-flash-lite** | 1M tokens | Cost optimization | Fastest | Lowest |
| **gemini-3-pro** | 1M tokens | Best multimodal understanding | Medium | Highest |
| **gemini-3-flash** | 1M tokens | Frontier intelligence + speed | Fast | Medium |
| **gemini-2.0-flash** | 1M tokens | Previous gen workhorse | Fast | Lower |

### Token Limits

**Most Models:**
- **Input:** 1,048,576 tokens (1M)
- **Output:** 65,536 tokens

**Image-Specific Models:**
- **Input:** 65,536 tokens
- **Output:** 32,768 tokens

### Model Selection Guide

**For Your Insurance Platform:**

```typescript
// ✅ Complex medical analysis or claim processing
model: "gemini-2.5-pro"

// ✅ Patient record summarization (fast, cost-effective)
model: "gemini-2.5-flash"

// ✅ Simple FAQ answers or form suggestions
model: "gemini-2.5-flash-lite"

// ✅ Medical image analysis with text
model: "gemini-3-pro"
```

### Model Naming Conventions

- **Stable:** Fixed version for production (`gemini-2.5-pro-001`)
- **Preview:** Production-ready, may change with 2+ week notice
- **Latest:** Auto-updates to newest version (not recommended for prod)
- **Experimental:** Early-stage, restricted rate limits

**Recommendation:** Use specific stable versions in production ⭐

---

## Free Tier Limitations & Rate Limits

### Understanding the Free Tier

The Gemini API offers a **generous free tier** that's perfect for development, prototyping, and low-volume production use.

**What's Included:**
- ✅ Access to multiple models (Flash, Flash-Lite, 2.0 Flash, **2.5 Pro**)
- ✅ Free input & output tokens
- ✅ Google AI Studio access for testing
- ✅ Code execution (no charge)
- ✅ No credit card required to start

**Free vs Paid Tier:**

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Rate Limits | Lower (see below) | Higher |
| Context Caching | ❌ Not available | ✅ Available |
| Batch API | ❌ Not available | ✅ 50% cost reduction |
| Content Usage | Used to improve products | NOT used |
| Support | Community | Priority support |

**Important:** ⚠️ Content submitted on free tier may be used to improve Google's products and services.

### Rate Limit Dimensions

The Gemini API enforces rate limits across **three dimensions**:

1. **RPM** (Requests Per Minute) - How many API calls per minute
2. **RPD** (Requests Per Day) - Total daily request quota
3. **TPM** (Tokens Per Minute) - Input token throughput

**Critical:** Exceeding **ANY** of these limits will trigger a rate limit error, regardless of your status on the other dimensions.

### Free Tier Quotas

**⚠️ Important Note:** Google does not publish exact free tier rate limits in public documentation. Limits may vary by:
- Region/country
- Account status
- Model selected
- Historical usage patterns

**Check Your Limits:**

The **only reliable way** to know your current limits is to check **Google AI Studio**:

1. Visit https://aistudio.google.com
2. Navigate to **Settings** → **API Keys**
3. View your **Rate Limits** dashboard
4. Monitor real-time usage

**Typical Free Tier Patterns** (observed, not guaranteed):

| Model | Est. RPM | Est. RPD | Est. TPM (Input) |
|-------|----------|----------|------------------|
| Gemini 2.5 Flash | 15 | 1,500 | 1,000,000 |
| Gemini 2.5 Flash-Lite | 15 | 1,500 | 1,000,000 |
| **Gemini 2.5 Pro** | **2** | **50** | **32,000** |
| Gemini 2.0 Flash | 15 | 1,500 | 1,000,000 |

**⚠️ Note on Gemini 2.5 Pro:** Free tier limits for Pro models are **significantly lower** than Flash models. For high-volume free tier usage, prefer Flash models.

**🚀 RECOMMENDED FOR FREE TIER: Gemini 2.5 Flash-Lite**

For optimal free tier performance, use **Gemini 2.5 Flash-Lite** as your default model:
- ✅ **15 RPM** - 7.5x more than Pro
- ✅ **Fastest** response times
- ✅ **Lowest** cost
- ✅ **Sufficient quality** for 90%+ of insurance platform tasks

Only upgrade to Flash or Pro when absolutely necessary for complex reasoning tasks.

### Model Selection for Free Tier

**For Your Insurance Platform:**

```typescript
// ❌ BAD - Using Pro for high-volume simple tasks (will hit limits)
// Processing 100 patient FAQs with Gemini 2.5 Pro
model: "gemini-2.5-pro"  // Only 2 RPM = 50 minutes for 100 requests!

// ✅ GOOD - Use Flash for high-volume simple tasks
model: "gemini-2.5-flash"  // 15 RPM = 7 minutes for 100 requests

// ✅ GOOD - Reserve Pro for complex analysis
// Analyzing medical document (1 request every 30 seconds = fine)
model: "gemini-2.5-pro"

// ✅ GOOD - Use Flash-Lite for very simple queries
model: "gemini-2.5-flash-lite"  // Cheapest, fastest for FAQs
```

**Strategic Model Use:**

```typescript
function selectModel(taskComplexity: "simple" | "medium" | "complex") {
  switch (taskComplexity) {
    case "simple":
      // FAQ answering, simple summaries
      return "gemini-2.5-flash-lite";

    case "medium":
      // Patient record summarization, form suggestions
      return "gemini-2.5-flash";

    case "complex":
      // Medical document analysis, complex reasoning
      // Use sparingly on free tier!
      return "gemini-2.5-pro";
  }
}
```

### Rate Limit Error Handling

**Error Detection:**

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

export async function generateWithRateLimitHandling(prompt: string) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return { success: true, text: response.text };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check for rate limit error
      if (
        error.message.includes("429") ||
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        return {
          success: false,
          isRateLimit: true,
          message: "Rate limit exceeded. Please try again in a moment.",
          retryAfter: 60, // seconds
        };
      }

      // Other errors
      return {
        success: false,
        isRateLimit: false,
        message: error.message,
      };
    }

    return { success: false, message: "Unknown error" };
  }
}
```

**Retry with Exponential Backoff:**

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

export async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });

      return { success: true, text: response.text, attempts: attempt + 1 };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Only retry on rate limit errors
      const isRateLimit =
        lastError.message.includes("429") ||
        lastError.message.includes("rate limit") ||
        lastError.message.includes("quota");

      if (!isRateLimit) {
        // Don't retry non-rate-limit errors
        break;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);

      console.log(`Rate limit hit. Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    message: lastError?.message || "Failed after retries",
    attempts: maxRetries,
  };
}
```

### Request Queue Pattern

**For high-volume applications**, implement a queue to stay within rate limits:

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

class GeminiRequestQueue {
  private queue: Array<{
    prompt: string;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  private processing = false;
  private requestsThisMinute = 0;
  private maxRPM = 15; // Conservative for Flash models on free tier
  private lastResetTime = Date.now();

  async add(prompt: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // Reset counter every minute
      const now = Date.now();
      if (now - this.lastResetTime >= 60000) {
        this.requestsThisMinute = 0;
        this.lastResetTime = now;
      }

      // Wait if we've hit the rate limit
      if (this.requestsThisMinute >= this.maxRPM) {
        const waitTime = 60000 - (now - this.lastResetTime);
        console.log(`Rate limit reached. Waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.requestsThisMinute = 0;
        this.lastResetTime = Date.now();
      }

      // Process next request
      const item = this.queue.shift();
      if (!item) break;

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: item.prompt,
        });

        this.requestsThisMinute++;
        item.resolve({ success: true, text: response.text });
      } catch (error: unknown) {
        item.reject(error);
      }

      // Small delay between requests (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

// Singleton instance
const geminiQueue = new GeminiRequestQueue();

export async function queuedGenerate(prompt: string) {
  try {
    return await geminiQueue.add(prompt);
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate",
    };
  }
}
```

### Usage Tracking

**Track your usage to avoid surprises:**

```typescript
"use server";

import { adminAction } from "@/appwrite/adminOrClient";
import { ID } from "node-appwrite";

interface UsageLog {
  userId: string;
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  timestamp: string;
}

export async function logGeminiUsage(log: UsageLog) {
  const { databases } = await adminAction();

  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    "ai_usage_logs",
    ID.unique(),
    {
      user_id: log.userId,
      model: log.model,
      prompt_tokens: log.promptTokens,
      response_tokens: log.responseTokens,
      total_tokens: log.totalTokens,
      timestamp: log.timestamp,
    }
  );
}

export async function getDailyUsage(userId: string) {
  const { databases } = await adminAction();

  const today = new Date().toISOString().split("T")[0];

  const logs = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    "ai_usage_logs",
    [
      Query.equal("user_id", userId),
      Query.greaterThan("timestamp", `${today}T00:00:00`),
    ]
  );

  const totalRequests = logs.documents.length;
  const totalTokens = logs.documents.reduce(
    (sum: number, log: any) => sum + log.total_tokens,
    0
  );

  return {
    requests: totalRequests,
    tokens: totalTokens,
    remainingEstimate: Math.max(0, 1500 - totalRequests), // Est. 1500 RPD
  };
}
```

### Best Practices for Free Tier

#### 1. Implement Aggressive Caching

```typescript
const cache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function cachedGenerate(prompt: string) {
  // Check cache
  const cached = cache.get(prompt);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { success: true, text: cached.text, cached: true };
  }

  // Generate new
  const result = await generateContent(prompt);

  if (result.success && result.text) {
    cache.set(prompt, { text: result.text, timestamp: Date.now() });
  }

  return { ...result, cached: false };
}
```

#### 2. Choose the Right Model

```typescript
// ✅ GOOD - Model selection based on task
const tasks = [
  { text: "Simple FAQ", model: "gemini-2.5-flash-lite" },
  { text: "Patient summary", model: "gemini-2.5-flash" },
  { text: "Complex analysis", model: "gemini-2.5-pro" }, // Use sparingly!
];
```

#### 3. Optimize Prompts

```typescript
// ❌ BAD - Verbose prompt (wastes tokens)
const prompt = `
I would like you to please analyze this patient record and provide a detailed summary.
Please include all relevant information about the patient's medical history, current medications,
recent visits, and any other pertinent details. Make sure to be thorough and comprehensive in your analysis.

Patient data: ${record}
`;

// ✅ GOOD - Concise prompt (saves tokens)
const prompt = `Summarize this patient record, including medical history, medications, and recent visits:\n\n${record}`;
```

#### 4. Monitor Usage Dashboard

- Check Google AI Studio daily
- Set up alerts when approaching limits
- Track usage per feature in your app
- Adjust model selection based on usage patterns

#### 5. Implement Graceful Degradation

```typescript
export async function smartGenerate(prompt: string, priority: "high" | "low") {
  // Try premium model for high priority
  if (priority === "high") {
    const result = await generateWithRetry(prompt);
    if (result.success) return result;
  }

  // Fall back to cached responses
  const cached = await getCachedResponse(prompt);
  if (cached) {
    return { success: true, text: cached, fallback: true };
  }

  // Fall back to simpler model
  const flashResult = await generateContent(prompt, "gemini-2.5-flash-lite");
  return { ...flashResult, fallback: true };
}
```

#### 6. Batch Similar Requests

```typescript
// ❌ BAD - Individual requests
for (const record of records) {
  await generateSummary(record); // 100 requests!
}

// ✅ GOOD - Batch in single request
const batchPrompt = `Summarize each patient record separately:\n\n${
  records.map((r, i) => `Record ${i + 1}:\n${r}`).join("\n\n")
}`;

const result = await generateContent(batchPrompt);
```

### Upgrading to Paid Tier

**When to Upgrade:**

- Exceeding free tier limits regularly
- Need for production-level reliability
- Require context caching
- Want batch processing discounts
- Need content to NOT be used for improvement

**How to Upgrade:**

1. Visit https://aistudio.google.com
2. Go to **API Keys** section
3. Click **Upgrade to Paid**
4. Add billing information
5. Select usage tier based on needs

**Paid Tier Benefits:**
- Higher RPM/RPD/TPM limits
- Context caching (reduce costs by 50-90%)
- Batch API (50% cost reduction)
- Priority support
- Content privacy guarantee

---

## Text Generation

### Basic Generation

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: "Summarize the benefits of health insurance",
});

console.log(response.text);
```

### Response Structure

```typescript
{
  text: string;                    // Main generated text
  candidates?: Array<{             // Alternative responses
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;          // Why generation stopped
    safetyRatings: Array<{         // Content safety scores
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;      // Input tokens used
    candidatesTokenCount: number;  // Output tokens used
    totalTokenCount: number;       // Total tokens
  };
}
```

### Server Action Pattern

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

interface GenerateTextOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateText(options: GenerateTextOptions) {
  const {
    prompt,
    model = "gemini-2.5-flash-lite",
    temperature = 1.0,
    maxOutputTokens = 2048,
  } = options;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature,
        maxOutputTokens,
      },
    });

    return {
      success: true,
      text: response.text,
      usage: response.usageMetadata,
    };
  } catch (error: unknown) {
    console.error("Gemini generation error:", error);
    return {
      success: false,
      message: "Failed to generate text",
    };
  }
}
```

### Usage in Component

```typescript
"use client";

import { generateText } from "@/lib/gemini/actions";
import { useState } from "react";

export default function SummarizeButton({ patientRecord }: { patientRecord: string }) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSummarize() {
    setLoading(true);

    const result = await generateText({
      prompt: `Summarize this patient record in 2-3 sentences:\n\n${patientRecord}`,
      model: "gemini-2.5-flash-lite",
      maxOutputTokens: 200,
    });

    if (result.success) {
      setSummary(result.text);
    } else {
      alert(result.message);
    }

    setLoading(false);
  }

  return (
    <div>
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize Record"}
      </button>
      {summary && <p className="mt-4">{summary}</p>}
    </div>
  );
}
```

---

## Streaming Responses

### Why Use Streaming?

- ⚡ **Faster perceived response** - Show text as it generates
- 🎯 **Better UX** - Users see progress in real-time
- 📱 **Interactive experiences** - Chatbots, assistants
- 💰 **Cost-effective** - Stop generation early if needed

### Basic Streaming

```typescript
const ai = new GoogleGenAI({});

const stream = ai.models.generateContentStream({
  model: "gemini-2.5-flash-lite",
  contents: "Explain the insurance claim process step by step",
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Server Action with Streaming (Next.js)

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

export async function* streamText(prompt: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const stream = ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    for await (const chunk of stream) {
      yield chunk.text || "";
    }
  } catch (error: unknown) {
    yield `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
```

### Client Component with Streaming

```typescript
"use client";

import { streamText } from "@/lib/gemini/actions";
import { useState } from "react";

export default function StreamingChat() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate(prompt: string) {
    setLoading(true);
    setResponse("");

    try {
      const stream = streamText(prompt);

      for await (const chunk of stream) {
        setResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => handleGenerate("Explain health insurance deductibles")}
        disabled={loading}
      >
        Generate with Streaming
      </button>
      <div className="mt-4 whitespace-pre-wrap">{response}</div>
    </div>
  );
}
```

---

## Configuration Parameters

### Complete Configuration Options

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: "Your prompt here",
  config: {
    // Randomness control (0.0 = deterministic, 2.0 = very random)
    temperature: 1.0,

    // Nucleus sampling (consider top tokens totaling this probability)
    topP: 0.95,

    // Limit to top K tokens
    topK: 40,

    // Maximum tokens to generate
    maxOutputTokens: 2048,

    // Stop generation at these sequences
    stopSequences: ["END", "STOP"],

    // Output format (e.g., "application/json")
    responseMIMEType: "text/plain",

    // JSON schema for structured output
    responseSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        score: { type: "number" },
      },
    },

    // System instruction (model personality/role)
    systemInstruction: "You are a helpful medical assistant.",

    // Safety settings
    safetySettings: [
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],

    // Tools for function calling
    tools: [{
      functionDeclarations: [/* function definitions */],
    }],

    // Thinking configuration (for reasoning)
    thinkingConfig: {
      thinkingBudget: 1024,  // Tokens for internal reasoning
    },
  },
});
```

### Temperature Guide

```typescript
// ❌ BAD - Too low for creative tasks
temperature: 0.0  // Very deterministic, repetitive

// ✅ GOOD - Balanced for most tasks (Gemini 3 default)
temperature: 1.0  // Recommended by Google

// ✅ GOOD - Creative writing
temperature: 1.5  // More creative, less predictable

// ⚠️ Use with caution - Very random
temperature: 2.0  // Maximum creativity, may be incoherent
```

**For Your Insurance Platform:**

```typescript
// Medical record summarization (factual)
config: { temperature: 0.3, maxOutputTokens: 500 }

// FAQ answering (balanced)
config: { temperature: 0.7, maxOutputTokens: 200 }

// Patient communication drafting (creative)
config: { temperature: 1.2, maxOutputTokens: 1000 }

// Data extraction (deterministic)
config: { temperature: 0.0, responseMIMEType: "application/json" }
```

### Max Output Tokens

```typescript
// ❌ BAD - Might truncate important information
maxOutputTokens: 50

// ✅ GOOD - Short answers
maxOutputTokens: 200

// ✅ GOOD - Detailed explanations
maxOutputTokens: 1024

// ✅ GOOD - Long-form content
maxOutputTokens: 4096

// ⚠️ Maximum allowed
maxOutputTokens: 65536  // Use only when necessary (cost!)
```

---

## System Instructions

### What are System Instructions?

System instructions set the **model's personality, role, and behavior**. They're like giving the model a job description.

### Basic System Instruction

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: "What should I do for a headache?",
  config: {
    systemInstruction: "You are a professional medical assistant. Provide helpful, accurate information but always remind users to consult healthcare professionals for medical advice.",
  },
});
```

### Insurance Platform Examples

```typescript
// Patient support assistant
config: {
  systemInstruction: `You are a helpful assistant for an insurance management platform.
Your role is to help patients understand:
- Their insurance benefits
- Appointment scheduling
- Facility information
- General health insurance questions

Always be empathetic, clear, and concise. If you don't know something, say so.
Never provide medical diagnoses or treatment recommendations.`
}

// Facility administrator assistant
config: {
  systemInstruction: `You are an assistant for facility administrators in a medical insurance platform.
Help with:
- Patient record management
- Appointment coordination
- Insurance claim processing
- Specialist scheduling

Be professional, efficient, and accurate. Prioritize data privacy and security.`
}

// Medical document analyzer
config: {
  systemInstruction: `You are a medical document analysis specialist.
Extract key information from medical records, focusing on:
- Patient demographics
- Diagnosis codes
- Treatment plans
- Insurance information

Return structured data in JSON format. Be precise and thorough.`
}
```

### System Instruction Best Practices

**✅ DO:**
- Be specific about the role
- Include formatting preferences
- Specify tone (professional, friendly, etc.)
- List key responsibilities
- Mention constraints or limitations

**❌ DON'T:**
- Make it too long (keep under 500 tokens)
- Include examples (use few-shot in contents instead)
- Change system instructions mid-conversation
- Put prompt-specific info (that goes in contents)

---

## Function Calling

### How Function Calling Works

Function calling enables Gemini to determine **when to call functions** and provide the necessary **parameters**. The model doesn't execute functions—your code does.

**4-Step Process:**

1. **Define Functions** - Describe available tools to the model
2. **Send Prompt + Functions** - Model analyzes and may request function calls
3. **Execute Function** - Your code runs the actual function
4. **Send Result Back** - Model incorporates result into final response

### Function Declaration Schema

```typescript
interface FunctionDeclaration {
  name: string;              // Unique identifier
  description: string;       // What the function does
  parameters: {
    type: "object";
    properties: {
      [key: string]: {
        type: string;        // "string" | "number" | "boolean" | "array" | "object"
        description: string; // Parameter purpose
        enum?: string[];     // Optional: limit to specific values
      };
    };
    required: string[];      // Required parameter names
  };
}
```

### Example: Schedule Appointment

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

const scheduleAppointmentTool = {
  functionDeclarations: [
    {
      name: "schedule_appointment",
      description: "Schedule a medical appointment for a patient",
      parameters: {
        type: "object",
        properties: {
          patient_id: {
            type: "string",
            description: "Patient's unique identifier",
          },
          specialist_id: {
            type: "string",
            description: "Specialist's unique identifier",
          },
          date: {
            type: "string",
            description: "Appointment date in YYYY-MM-DD format",
          },
          time: {
            type: "string",
            description: "Appointment time in HH:MM format (24-hour)",
          },
          reason: {
            type: "string",
            description: "Reason for appointment",
          },
        },
        required: ["patient_id", "specialist_id", "date", "time"],
      },
    },
  ],
};

export async function processAppointmentRequest(userMessage: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Step 1: Send message with function declaration
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: userMessage,
      config: {
        tools: [scheduleAppointmentTool],
        temperature: 0,  // Deterministic for function calls
      },
    });

    // Step 2: Check if model wants to call function
    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.functionCall
    )?.functionCall;

    if (!functionCall) {
      // No function call, just return text response
      return {
        success: true,
        text: response.text,
      };
    }

    // Step 3: Execute the actual function
    const { name, args } = functionCall;

    if (name === "schedule_appointment") {
      // Your actual scheduling logic
      const appointmentResult = await scheduleAppointmentInDatabase(args);

      // Step 4: Send result back to model for final response
      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [
          { role: "user", parts: [{ text: userMessage }] },
          {
            role: "model",
            parts: [{ functionCall: { name, args } }],
          },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name,
                  response: appointmentResult,
                },
              },
            ],
          },
        ],
      });

      return {
        success: true,
        text: finalResponse.text,
        appointment: appointmentResult,
      };
    }

    return {
      success: false,
      message: "Unknown function call",
    };
  } catch (error: unknown) {
    console.error("Function calling error:", error);
    return {
      success: false,
      message: "Failed to process request",
    };
  }
}

// Mock function - replace with actual database operation
async function scheduleAppointmentInDatabase(args: any) {
  // Your Appwrite database logic here
  return {
    appointment_id: "apt-123",
    status: "scheduled",
    ...args,
  };
}
```

### Multi-Turn Function Calling

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

const insuranceTools = {
  functionDeclarations: [
    {
      name: "check_insurance_coverage",
      description: "Check if a procedure is covered by patient's insurance",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string", description: "Patient ID" },
          procedure_code: { type: "string", description: "Medical procedure code" },
        },
        required: ["patient_id", "procedure_code"],
      },
    },
    {
      name: "get_copay_amount",
      description: "Get the copay amount for a covered procedure",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string", description: "Patient ID" },
          procedure_code: { type: "string", description: "Medical procedure code" },
        },
        required: ["patient_id", "procedure_code"],
      },
    },
  ],
};

export async function handleInsuranceQuery(query: string, patient_id: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const conversationHistory: any[] = [
    { role: "user", parts: [{ text: query }] },
  ];

  let maxTurns = 5;  // Prevent infinite loops

  while (maxTurns > 0) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: conversationHistory,
      config: {
        tools: [insuranceTools],
        temperature: 0,
      },
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.functionCall
    )?.functionCall;

    if (!functionCall) {
      // No more function calls, return final answer
      return {
        success: true,
        text: response.text,
      };
    }

    // Add model's function call to history
    conversationHistory.push({
      role: "model",
      parts: [{ functionCall }],
    });

    // Execute function
    let functionResult: any;

    switch (functionCall.name) {
      case "check_insurance_coverage":
        functionResult = await checkCoverageInDatabase({
          patient_id,
          ...functionCall.args,
        });
        break;
      case "get_copay_amount":
        functionResult = await getCopayFromDatabase({
          patient_id,
          ...functionCall.args,
        });
        break;
      default:
        functionResult = { error: "Unknown function" };
    }

    // Add function result to history
    conversationHistory.push({
      role: "user",
      parts: [
        {
          functionResponse: {
            name: functionCall.name,
            response: functionResult,
          },
        },
      ],
    });

    maxTurns--;
  }

  return {
    success: false,
    message: "Maximum function call limit reached",
  };
}

// Mock functions - replace with actual database queries
async function checkCoverageInDatabase(params: any) {
  return { covered: true, coverage_percentage: 80 };
}

async function getCopayFromDatabase(params: any) {
  return { copay_amount: 25, currency: "USD" };
}
```

### Function Calling Best Practices

**✅ DO:**
- Use temperature 0 for deterministic function calls
- Validate function parameters before execution
- Limit number of tools to 10-20 max
- Use descriptive function and parameter names
- Always check `finishReason` for errors
- Implement maximum turn limits (prevent loops)

**❌ DON'T:**
- Let the model execute sensitive operations without validation
- Expose all functions at once (filter by context)
- Skip error handling in function execution
- Assume parameters are always valid
- Allow infinite function call loops

---

## Multimodal Input

### Supported Input Types

- 📷 **Images** - JPEG, PNG, GIF, WebP
- 🎥 **Video** - MP4, MPEG, MOV, AVI, FLV, MPG, WebM, WMV, 3GPP
- 🎵 **Audio** - WAV, MP3, AIFF, AAC, OGG, FLAC
- 📄 **Documents** - PDF files

### Image Analysis Example

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";
import fs from "fs";

export async function analyzeInsuranceCard(imagePath: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",  // Efficient for most image analysis
      contents: [
        {
          parts: [
            {
              text: `Analyze this insurance card and extract:
- Insurance provider name
- Policy number
- Group number
- Member name
- Member ID
- Coverage type

Return the information in JSON format.`,
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMIMEType: "application/json",
      },
    });

    const insuranceData = JSON.parse(response.text);

    return {
      success: true,
      data: insuranceData,
    };
  } catch (error: unknown) {
    console.error("Image analysis error:", error);
    return {
      success: false,
      message: "Failed to analyze insurance card",
    };
  }
}
```

### Medical Document (PDF) Analysis

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";
import fs from "fs";

export async function analyzeMedicalReport(pdfPath: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        {
          parts: [
            {
              text: "Summarize this medical report in 3-4 sentences, focusing on diagnosis, treatment plan, and follow-up requirements.",
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return {
      success: true,
      summary: response.text,
    };
  } catch (error: unknown) {
    console.error("PDF analysis error:", error);
    return {
      success: false,
      message: "Failed to analyze medical report",
    };
  }
}
```

### Multiple Images

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: [
    {
      parts: [
        { text: "Compare these two X-ray images. What differences do you notice?" },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image1,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image2,
          },
        },
      ],
    },
  ],
});
```

### Multimodal Best Practices

**✅ DO:**
- Use Gemini 3 Pro for best multimodal understanding
- Compress images when possible (reduce cost)
- Provide clear instructions about what to analyze
- Use base64 encoding for images
- Check file size limits (20MB per file)

**❌ DON'T:**
- Send very large files (optimize first)
- Use low-quality images for detail extraction
- Forget to specify MIME type
- Mix too many modalities in one request

---

## Chat & Conversations

### Multi-Turn Conversations

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

interface Message {
  role: "user" | "model";
  content: string;
}

export async function chatWithAssistant(
  messages: Message[],
  newMessage: string
) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    // Build conversation history
    const contents = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Add new user message
    contents.push({
      role: "user",
      parts: [{ text: newMessage }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: "You are a helpful insurance platform assistant.",
      },
    });

    return {
      success: true,
      message: response.text,
      conversation: [
        ...messages,
        { role: "user" as const, content: newMessage },
        { role: "model" as const, content: response.text },
      ],
    };
  } catch (error: unknown) {
    console.error("Chat error:", error);
    return {
      success: false,
      message: "Failed to process message",
    };
  }
}
```

### Chat Component Example

```typescript
"use client";

import { chatWithAssistant } from "@/lib/gemini/chat";
import { useState } from "react";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function InsuranceChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    setLoading(true);

    const result = await chatWithAssistant(messages, input);

    if (result.success && result.conversation) {
      setMessages(result.conversation);
      setInput("");
    } else {
      alert(result.message);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-md rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about insurance..."
          className="flex-1 border rounded px-3 py-2"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
```

### Conversation Memory Management

```typescript
// ❌ BAD - Keeping entire history (may exceed token limit)
const allMessages = messages;  // Could be thousands of tokens

// ✅ GOOD - Sliding window (keep last N messages)
const recentMessages = messages.slice(-10);  // Last 10 messages only

// ✅ GOOD - Summarize old messages
async function summarizeOldMessages(messages: Message[]) {
  if (messages.length <= 10) return messages;

  const oldMessages = messages.slice(0, -10);
  const recentMessages = messages.slice(-10);

  // Summarize old conversation
  const summary = await generateContent(
    `Summarize this conversation:\n${JSON.stringify(oldMessages)}`,
    "gemini-2.5-flash"
  );

  if (!summary.success) return recentMessages;

  return [
    { role: "user" as const, content: `Previous conversation summary: ${summary.text}` },
    ...recentMessages,
  ];
}
```

---

## Error Handling

### Common Error Types

```typescript
try {
  const response = await ai.models.generateContent({ ... });
} catch (error: unknown) {
  if (error instanceof Error) {
    // Check error message for specific issues
    if (error.message.includes("API key")) {
      return { success: false, message: "Invalid API key" };
    }

    if (error.message.includes("quota")) {
      return { success: false, message: "API quota exceeded" };
    }

    if (error.message.includes("timeout")) {
      return { success: false, message: "Request timeout" };
    }

    if (error.message.includes("safety")) {
      return { success: false, message: "Content blocked by safety filters" };
    }
  }

  return { success: false, message: "Unknown error occurred" };
}
```

### Retry with Exponential Backoff

```typescript
async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });

      return { success: true, text: response.text };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on certain errors
      if (
        lastError.message.includes("API key") ||
        lastError.message.includes("safety")
      ) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    message: lastError?.message || "Failed after retries",
  };
}
```

### Finish Reason Handling

```typescript
const response = await ai.models.generateContent({ ... });

const finishReason = response.candidates?.[0]?.finishReason;

switch (finishReason) {
  case "STOP":
    // ✅ Normal completion
    return { success: true, text: response.text };

  case "MAX_TOKENS":
    // ⚠️ Hit token limit
    return {
      success: false,
      message: "Response truncated due to length",
      partial: response.text,
    };

  case "SAFETY":
    // 🚫 Blocked by safety filters
    return {
      success: false,
      message: "Content filtered for safety reasons",
    };

  case "RECITATION":
    // 🚫 Too similar to training data
    return {
      success: false,
      message: "Response blocked due to recitation",
    };

  default:
    return { success: true, text: response.text };
}
```

### Error Handling Best Practices

**✅ DO:**
- Always wrap API calls in try-catch
- Return consistent error format `{ success: false, message }`
- Log errors server-side for debugging
- Implement retry logic for transient failures
- Check `finishReason` for completion status
- Provide user-friendly error messages

**❌ DON'T:**
- Expose raw API errors to users
- Retry on authentication errors (will always fail)
- Ignore `finishReason` (may return incomplete content)
- Use generic "something went wrong" messages
- Let errors crash the application

---

## Security Best Practices

### 1. API Key Protection

```typescript
// ❌ BAD - Hardcoded
const ai = new GoogleGenAI({ apiKey: "AIzaSyD..." });

// ❌ BAD - In client-side code
"use client";
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

// ✅ GOOD - Server-side only
"use server";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

**Best Practices:**
- Store in `.env` file (never commit)
- Use server actions or API routes only
- Never expose to client-side code
- Rotate keys periodically (every 3-6 months)
- Use separate keys for dev/staging/prod

### 2. Input Validation

```typescript
"use server";

export async function analyzeMedicalRecord(record: string) {
  // Validate input length
  if (!record || record.length === 0) {
    return { success: false, message: "Record cannot be empty" };
  }

  if (record.length > 50000) {
    return { success: false, message: "Record too long (max 50,000 characters)" };
  }

  // Sanitize input (remove potential injection attempts)
  const sanitized = record
    .replace(/<script>/gi, "")
    .replace(/javascript:/gi, "")
    .trim();

  // Your Gemini API call
  const result = await generateContent(sanitized);

  return result;
}
```

### 3. Rate Limiting

```typescript
import { RateLimiter } from "limiter";

// Allow 10 requests per minute per user
const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "minute",
});

export async function rateLimitedGenerate(userId: string, prompt: string) {
  const allowed = await limiter.removeTokens(1);

  if (!allowed) {
    return {
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    };
  }

  return await generateContent(prompt);
}
```

### 4. Content Safety

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    safetySettings: [
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  },
});

// Check if content was blocked
if (response.candidates?.[0]?.finishReason === "SAFETY") {
  return {
    success: false,
    message: "Content blocked for safety reasons",
  };
}
```

### 5. User Authentication

```typescript
"use server";

import { clientAction } from "@/appwrite/adminOrClient";
import { isAppwriteClient } from "@/lib/types/appwrite";

export async function authenticatedGenerate(prompt: string) {
  // Verify user is authenticated
  const result = await clientAction();

  if (!isAppwriteClient(result)) {
    return { success: false, message: "Authentication required" };
  }

  const { account } = result;
  const user = await account.get();

  // Now safe to use Gemini API
  const response = await generateContent(prompt);

  // Log usage for this user
  await logAIUsage(user.$id, response.usage);

  return response;
}

async function logAIUsage(userId: string, usage: any) {
  // Track AI usage per user for billing/analytics
  // Your Appwrite database logic here
}
```

---

## Performance Optimization

### 1. Model Selection

```typescript
// ❌ BAD - Using expensive model for simple task
model: "gemini-3-pro"  // For "What is the deductible?"

// ✅ GOOD - Right model for the job
model: "gemini-2.5-flash-lite"  // Fast + cheap for simple queries
```

**Cost Optimization Matrix:**

| Task Complexity | Model Choice | Speed | Cost |
|----------------|--------------|-------|------|
| Simple FAQ | Flash-Lite | ⚡⚡⚡ | 💰 |
| Standard queries | Flash | ⚡⚡ | 💰💰 |
| Complex analysis | Pro | ⚡ | 💰💰💰 |
| Multimodal | 3 Pro | ⚡ | 💰💰💰💰 |

### 2. Token Management

```typescript
// ❌ BAD - Sending entire patient history (100k tokens)
const prompt = `Analyze this:\n${entirePatientHistory}`;

// ✅ GOOD - Send relevant excerpt only
const recentHistory = patientHistory.slice(-5000);  // Last 5k chars
const prompt = `Analyze this recent history:\n${recentHistory}`;

// ✅ GOOD - Summarize old data first
const summary = await summarizeOldRecords(oldRecords);
const prompt = `Context: ${summary}\n\nAnalyze: ${currentRecord}`;
```

### 3. Caching Responses

```typescript
import { createClient } from "redis";

const redis = createClient();
await redis.connect();

export async function cachedGenerate(prompt: string, ttl: number = 3600) {
  // Check cache first
  const cacheKey = `gemini:${hashPrompt(prompt)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return { success: true, text: cached, cached: true };
  }

  // Generate new response
  const result = await generateContent(prompt);

  if (result.success && result.text) {
    // Cache for 1 hour
    await redis.setEx(cacheKey, ttl, result.text);
  }

  return { ...result, cached: false };
}

function hashPrompt(prompt: string): string {
  // Simple hash function - use crypto in production
  return Buffer.from(prompt).toString("base64").slice(0, 32);
}
```

### 4. Parallel Requests

```typescript
// ❌ BAD - Sequential (slow)
const summary = await generateContent("Summarize patient A");
const analysis = await generateContent("Analyze patient B");
const report = await generateContent("Report for patient C");

// ✅ GOOD - Parallel (3x faster)
const [summary, analysis, report] = await Promise.all([
  generateContent("Summarize patient A"),
  generateContent("Analyze patient B"),
  generateContent("Report for patient C"),
]);
```

### 5. Streaming for Long Responses

```typescript
// ❌ BAD - Wait for entire response (slow perceived time)
const response = await generateContent(longPrompt);
display(response.text);  // User waits 10+ seconds

// ✅ GOOD - Stream response (appears instant)
const stream = generateContentStream(longPrompt);
for await (const chunk of stream) {
  display(chunk);  // User sees immediate progress
}
```

---

## Next.js Integration Patterns

### Server Action Pattern (Recommended)

```typescript
// app/actions/gemini.ts
"use server";

import { GoogleGenAI } from "@google/genai";

export async function summarizePatientRecord(recordText: string) {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Summarize this patient record concisely:\n\n${recordText}`,
      config: {
        temperature: 0.3,
        maxOutputTokens: 300,
      },
    });

    return { success: true, summary: response.text };
  } catch (error: unknown) {
    console.error("Gemini error:", error);
    return { success: false, message: "Failed to summarize" };
  }
}
```

```typescript
// app/components/SummarizeButton.tsx
"use client";

import { summarizePatientRecord } from "@/app/actions/gemini";

export function SummarizeButton({ record }: { record: string }) {
  const [summary, setSummary] = useState("");

  async function handleClick() {
    const result = await summarizePatientRecord(record);
    if (result.success) {
      setSummary(result.summary);
    }
  }

  return (
    <div>
      <button onClick={handleClick}>Summarize</button>
      {summary && <p>{summary}</p>}
    </div>
  );
}
```

### API Route Pattern

```typescript
// app/api/gemini/generate/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = "gemini-2.5-flash" } = await request.json();

    // Validate
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid prompt" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      text: response.text,
      usage: response.usageMetadata,
    });
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, message: "Generation failed" },
      { status: 500 }
    );
  }
}
```

### Environment Variables

```typescript
// ✅ Server-side only (no NEXT_PUBLIC prefix)
GEMINI_API_KEY=your_key_here

// ❌ DON'T expose to client
// NEXT_PUBLIC_GEMINI_API_KEY=your_key_here  // WRONG!
```

### Middleware for Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, number[]>();

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/gemini")) {
    return NextResponse.next();
  }

  const ip = request.ip || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  // Get request timestamps for this IP
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return NextResponse.json(
      { success: false, message: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Add current request
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);

  return NextResponse.next();
}
```

---

## Common Patterns for Your Project

### Pattern 1: Patient Record Summarization

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

interface PatientRecord {
  full_name: string;
  date_of_birth: string;
  medical_history: string;
  current_medications: string[];
  allergies: string[];
  recent_visits: Array<{
    date: string;
    reason: string;
    diagnosis: string;
  }>;
}

export async function summarizePatientRecord(record: PatientRecord) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `As a medical assistant, create a concise summary of this patient record:

Patient: ${record.full_name}
DOB: ${record.date_of_birth}
Medical History: ${record.medical_history}
Current Medications: ${record.current_medications.join(", ")}
Allergies: ${record.allergies.join(", ")}
Recent Visits: ${JSON.stringify(record.recent_visits, null, 2)}

Provide:
1. Brief patient overview (2-3 sentences)
2. Key medical concerns
3. Active treatments
4. Important notes for healthcare providers`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",  // Fast and efficient for summaries
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return { success: true, summary: response.text };
  } catch (error: unknown) {
    console.error("Summarization error:", error);
    return { success: false, message: "Failed to summarize record" };
  }
}
```

### Pattern 2: Insurance Document Analysis

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

export async function extractInsuranceInfo(documentText: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `Extract insurance information from this document and return as JSON:

${documentText}

Extract:
{
  "provider_name": "Insurance company name",
  "policy_number": "Policy ID",
  "group_number": "Group ID if applicable",
  "member_name": "Insured person's name",
  "member_id": "Member ID",
  "coverage_type": "Type of coverage (e.g., PPO, HMO)",
  "deductible": "Deductible amount",
  "copay": "Copay amount",
  "effective_date": "Coverage start date",
  "expiration_date": "Coverage end date"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",  // Efficient for structured data extraction
      contents: prompt,
      config: {
        temperature: 0,
        responseMIMEType: "application/json",
      },
    });

    const data = JSON.parse(response.text);

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Extraction error:", error);
    return { success: false, message: "Failed to extract information" };
  }
}
```

### Pattern 3: Appointment Scheduling Assistant

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";
import { adminAction } from "@/appwrite/adminOrClient";
import { Query } from "node-appwrite";

const appointmentTools = {
  functionDeclarations: [
    {
      name: "find_available_slots",
      description: "Find available appointment slots for a specialist",
      parameters: {
        type: "object",
        properties: {
          specialist_id: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD format" },
        },
        required: ["specialist_id", "date"],
      },
    },
    {
      name: "book_appointment",
      description: "Book an appointment",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string" },
          specialist_id: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          reason: { type: "string" },
        },
        required: ["patient_id", "specialist_id", "date", "time"],
      },
    },
  ],
};

export async function handleAppointmentRequest(
  patientId: string,
  message: string
) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        tools: [appointmentTools],
        temperature: 0,
        systemInstruction: `You are an appointment scheduling assistant for a medical facility.
Help patients find and book appointments. Be friendly and professional.`,
      },
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.functionCall
    )?.functionCall;

    if (!functionCall) {
      return { success: true, message: response.text };
    }

    // Execute function
    let result: any;

    if (functionCall.name === "find_available_slots") {
      result = await findAvailableSlots(functionCall.args);
    } else if (functionCall.name === "book_appointment") {
      result = await bookAppointment({
        patient_id: patientId,
        ...functionCall.args,
      });
    }

    // Send result back to model for final response
    const finalResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: message }] },
        { role: "model", parts: [{ functionCall }] },
        {
          role: "user",
          parts: [{ functionResponse: { name: functionCall.name, response: result } }],
        },
      ],
    });

    return {
      success: true,
      message: finalResponse.text,
      action: functionCall.name,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Appointment request error:", error);
    return { success: false, message: "Failed to process request" };
  }
}

async function findAvailableSlots(args: any) {
  const { databases } = await adminAction();

  // Query appointments for this specialist on this date
  const appointments = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    "appointments",
    [
      Query.equal("specialist_id", args.specialist_id),
      Query.equal("date", args.date),
    ]
  );

  // Return available slots logic
  const allSlots = generateTimeSlots(); // Your slot generation logic
  const bookedTimes = appointments.documents.map((a: any) => a.time);
  const available = allSlots.filter((slot) => !bookedTimes.includes(slot));

  return { available_slots: available };
}

async function bookAppointment(args: any) {
  const { databases } = await adminAction();

  const appointment = await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    "appointments",
    "unique()",
    {
      patient_id: args.patient_id,
      specialist_id: args.specialist_id,
      date: args.date,
      time: args.time,
      reason: args.reason || "",
      status: "scheduled",
    }
  );

  return { appointment_id: appointment.$id, status: "booked" };
}

function generateTimeSlots(): string[] {
  // Generate time slots (9:00 AM - 5:00 PM, 30-min intervals)
  const slots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return slots;
}
```

### Pattern 4: Medical FAQ Assistant

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

const insuranceFAQs = `
Common Insurance Questions:

Q: What is a deductible?
A: A deductible is the amount you pay before your insurance starts covering costs.

Q: What is a copay?
A: A copay is a fixed amount you pay for each medical service or prescription.

Q: What is coinsurance?
A: Coinsurance is the percentage of costs you pay after meeting your deductible.

Q: What is an out-of-pocket maximum?
A: The most you'll pay in a year before insurance covers 100% of costs.

Q: What's the difference between in-network and out-of-network?
A: In-network providers have agreements with your insurance for lower rates.
`;

export async function answerInsuranceQuestion(question: string) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `Using this insurance FAQ knowledge base, answer the patient's question.
If the question isn't covered in the FAQs, provide a helpful general answer and suggest contacting their insurance provider.

FAQs:
${insuranceFAQs}

Patient Question: ${question}

Answer concisely and clearly:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    return { success: true, answer: response.text };
  } catch (error: unknown) {
    console.error("FAQ error:", error);
    return { success: false, message: "Failed to answer question" };
  }
}
```

### Pattern 5: Form Field Auto-Completion

```typescript
"use server";

import { GoogleGenAI } from "@google/genai";

interface PatientData {
  full_name?: string;
  date_of_birth?: string;
  address?: string;
  phone?: string;
  email?: string;
  insurance_provider?: string;
}

export async function suggestFormCompletion(
  partialData: PatientData,
  fieldName: string
) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const prompt = `Based on this partial patient information, suggest a reasonable value for the "${fieldName}" field.
Return ONLY the suggested value, no explanation.

Current data:
${JSON.stringify(partialData, null, 2)}

Field to suggest: ${fieldName}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 50,
      },
    });

    return { success: true, suggestion: response.text.trim() };
  } catch (error: unknown) {
    console.error("Suggestion error:", error);
    return { success: false, message: "Failed to generate suggestion" };
  }
}
```

---

## Quick Reference

### Common Methods

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_KEY" });

// Text generation (Flash-Lite recommended for free tier)
await ai.models.generateContent({
  model: "gemini-2.5-flash-lite",
  contents: "Your prompt",
  config: { temperature: 1.0 },
});

// Streaming
for await (const chunk of ai.models.generateContentStream({ ... })) {
  console.log(chunk.text);
}

// With system instruction
config: {
  systemInstruction: "You are a helpful assistant.",
}

// With function calling
config: {
  tools: [{ functionDeclarations: [...] }],
}

// Multimodal
contents: [
  {
    parts: [
      { text: "Describe this image" },
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
    ],
  },
];
```

### Configuration Options

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `temperature` | number | 1.0 | Randomness (0=deterministic, 2=very random) |
| `topP` | number | 0.95 | Nucleus sampling threshold |
| `topK` | number | 40 | Limit to top K tokens |
| `maxOutputTokens` | number | 2048 | Max tokens to generate |
| `stopSequences` | string[] | [] | Stop generation at these strings |
| `responseMIMEType` | string | "text/plain" | Output format |
| `systemInstruction` | string | - | Model personality/role |

### Model Comparison

| Model | Speed | Cost | Free Tier RPM | Best For |
|-------|-------|------|---------------|----------|
| **gemini-2.5-flash-lite** ⭐ | ⚡⚡⚡ | $ | **15** | **DEFAULT - Simple queries, FAQs, summaries** |
| gemini-2.5-flash | ⚡⚡ | $$ | 15 | Balanced tasks, medium complexity |
| gemini-2.5-pro | ⚡ | $$$ | **2** | Complex reasoning (use sparingly on free tier) |
| gemini-3-flash | ⚡⚡ | $$ | 15 | Fast + intelligent |
| gemini-3-pro | ⚡ | $$$$ | 2 | Best multimodal, complex (rarely needed) |

**⭐ Recommended:** Use Flash-Lite for 90%+ of insurance platform tasks on free tier

### Error Handling Checklist

- ✅ Wrap API calls in try-catch
- ✅ Return `{ success: boolean, message/data }` format
- ✅ Check `finishReason` for completion status
- ✅ Implement retry logic for transient errors
- ✅ Validate inputs before API call
- ✅ Log errors server-side for debugging
- ✅ Provide user-friendly error messages

### Security Checklist

- ✅ Store API key in `.env` (never commit)
- ✅ Use server actions or API routes only
- ✅ Never expose API key to client
- ✅ Validate and sanitize all inputs
- ✅ Implement rate limiting
- ✅ Check user authentication before API calls
- ✅ Enable safety settings for content filtering
- ✅ Monitor and log API usage

---

## Official Resources

### Documentation
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **Quickstart Guide:** https://ai.google.dev/gemini-api/docs/quickstart
- **Text Generation:** https://ai.google.dev/gemini-api/docs/text-generation
- **Function Calling:** https://ai.google.dev/gemini-api/docs/function-calling
- **Models:** https://ai.google.dev/gemini-api/docs/models
- **Multimodal:** https://ai.google.dev/gemini-api/docs/multimodal

### Tools & Resources
- **Google AI Studio:** https://aistudio.google.com (Test prompts, get API key)
- **NPM Package:** https://www.npmjs.com/package/@google/genai
- **API Reference:** https://ai.google.dev/api
- **Prompt Guide:** https://ai.google.dev/gemini-api/docs/prompting-intro

### Community
- **Developer Forum:** https://discuss.ai.google.dev/c/gemini-api/
- **GitHub Issues:** https://github.com/google-gemini/generative-ai-js/issues
- **Stack Overflow:** Tag `google-gemini`

---

## When to Use This Skill

**Use this skill when:**
- ✅ Integrating Gemini API into your insurance platform
- ✅ Implementing AI-powered features (summarization, analysis, chat)
- ✅ Setting up text generation with Next.js server actions
- ✅ Creating multimodal applications (text + images/documents)
- ✅ Building conversational interfaces or assistants
- ✅ Implementing function calling for agentic workflows
- ✅ Optimizing AI performance and costs
- ✅ Troubleshooting Gemini API errors
- ✅ Designing prompts and system instructions
- ✅ Implementing security best practices

**This skill provides:**
- 📖 Complete Gemini API reference
- 💻 Insurance platform-specific patterns
- 🔒 Security and error handling best practices
- ⚡ Performance optimization strategies
- 🎯 Next.js integration examples
- 🤖 Function calling and tool use
- 📊 Multimodal input handling
- 💬 Chat and conversation management

---

**End of Skill Document**

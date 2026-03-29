/**
 * AI content engine powered by Claude.
 *
 * Generates GBP posts, review responses, optimization audits,
 * and business descriptions.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Post Generation ─────────────────────────────────────────

interface PostInput {
  businessName: string;
  category: string;
  description?: string;
  topic: string; // "general" | "offer" | "event" | "tip" | "seasonal" | "product"
  context?: string; // e.g. "It's spring, promote outdoor seating"
  previousPosts?: string[]; // Avoid repetition
}

export async function generatePost(input: PostInput): Promise<{
  content: string;
  callToAction?: string;
  hashtags: string[];
}> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: `You write engaging Google Business Profile posts for local businesses.
Rules:
- Keep posts between 100-300 characters (Google's sweet spot for engagement)
- Be warm, authentic, and action-oriented
- Never use generic filler ("we're excited to announce...")
- Include a clear reason for customers to visit/call/click
- Match the tone to the business category
- Return ONLY valid JSON with keys: content, callToAction (optional, one of: LEARN_MORE, BOOK, ORDER, SHOP, SIGN_UP, CALL), hashtags (array of 2-3)`,
    messages: [
      {
        role: "user",
        content: `Business: ${input.businessName}
Category: ${input.category}
${input.description ? `About: ${input.description}` : ""}
Post type: ${input.topic}
${input.context ? `Context: ${input.context}` : ""}
${input.previousPosts?.length ? `Avoid similarity to recent posts:\n${input.previousPosts.slice(0, 3).join("\n")}` : ""}

Generate one Google Business Profile post.`,
      },
    ],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

// ─── Batch Post Calendar ─────────────────────────────────────

export async function generatePostCalendar(
  businessName: string,
  category: string,
  description: string | undefined,
  count: number = 4
): Promise<Array<{ content: string; topic: string; suggestedDay: string }>> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `You create a content calendar of Google Business Profile posts for local businesses.
Return ONLY a JSON array. Each item has: content (100-300 chars), topic (general/offer/tip/seasonal/product), suggestedDay (day of week).
Space topics across the month for variety. Make each post unique and specific to the business.`,
    messages: [
      {
        role: "user",
        content: `Business: ${businessName}
Category: ${category}
${description ? `About: ${description}` : ""}

Generate ${count} posts for the next month.`,
      },
    ],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

// ─── Review Response ─────────────────────────────────────────

interface ReviewInput {
  businessName: string;
  category: string;
  reviewerName: string;
  rating: number;
  comment: string;
  existingReplies?: string[]; // Previous responses for tone consistency
}

export async function generateReviewResponse(input: ReviewInput): Promise<{
  reply: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  keywords: string[];
}> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You write review responses for local businesses on Google Business Profile.
Rules:
- Thank the reviewer by name
- For positive reviews (4-5 stars): be grateful, reinforce what they liked, invite them back
- For neutral reviews (3 stars): acknowledge, address concerns professionally, invite them to return
- For negative reviews (1-2 stars): empathize, take ownership, offer to resolve offline (no arguing)
- Keep responses 2-4 sentences
- Sound human, not corporate
- Never be defensive or dismissive
- Return ONLY valid JSON with keys: reply, sentiment (POSITIVE/NEUTRAL/NEGATIVE), keywords (array of topics mentioned)`,
    messages: [
      {
        role: "user",
        content: `Business: ${input.businessName} (${input.category})
Reviewer: ${input.reviewerName}
Rating: ${input.rating}/5
Review: "${input.comment || "(no text, star rating only)"}"
${input.existingReplies?.length ? `\nTone reference from previous replies:\n${input.existingReplies.slice(0, 2).join("\n")}` : ""}

Write a response.`,
      },
    ],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

// ─── Optimization Audit ──────────────────────────────────────

interface AuditInput {
  businessName: string;
  category: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  hasPhotos: boolean;
  photoCount: number;
  postCount: number;
  lastPostDate: string | null;
  reviewCount: number;
  averageRating: number;
  responseRate: number; // 0-1
  hasHours: boolean;
  hasAttributes: boolean;
}

export interface AuditResult {
  overallScore: number; // 0-100
  sections: Array<{
    name: string;
    score: number;
    maxScore: number;
    status: "good" | "needs_work" | "critical";
    recommendation: string;
  }>;
  topPriorities: string[];
  estimatedImpact: string;
}

export async function runOptimizationAudit(input: AuditInput): Promise<AuditResult> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a Google Business Profile optimization expert. Audit the profile and score it.

Scoring rubric (100 points total):
- Business description (15 pts): filled, 750 chars, keyword-rich, compelling
- Photos (15 pts): 10+ photos, cover photo set, variety (interior, exterior, team, products)
- Posts (15 pts): posting weekly, varied topics, engagement-focused
- Reviews (15 pts): high count, 4.5+ avg, high response rate (>80%)
- Basic info (10 pts): phone, website, address, hours all filled
- Categories (10 pts): primary + secondary categories set correctly
- Attributes (10 pts): amenities, accessibility, payments, etc. filled
- Q&A (10 pts): pre-populated Q&A, timely responses

Return ONLY valid JSON matching this structure:
{
  "overallScore": number,
  "sections": [{ "name": string, "score": number, "maxScore": number, "status": "good"|"needs_work"|"critical", "recommendation": string }],
  "topPriorities": [string, string, string],
  "estimatedImpact": string
}`,
    messages: [
      {
        role: "user",
        content: `Audit this Google Business Profile:
Business: ${input.businessName}
Category: ${input.category}
Description: ${input.description || "MISSING"}
Phone: ${input.phone || "MISSING"}
Website: ${input.website || "MISSING"}
Address: ${input.address || "MISSING"}
Hours set: ${input.hasHours ? "Yes" : "No"}
Attributes set: ${input.hasAttributes ? "Yes" : "No"}
Photos: ${input.photoCount} photos ${input.hasPhotos ? "" : "(NONE)"}
Posts: ${input.postCount} total, last post: ${input.lastPostDate || "Never"}
Reviews: ${input.reviewCount} reviews, ${input.averageRating} avg rating, ${Math.round(input.responseRate * 100)}% response rate`,
      },
    ],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

// ─── Description Rewrite ─────────────────────────────────────

export async function rewriteDescription(
  businessName: string,
  category: string,
  currentDescription: string | undefined,
  location: string | undefined
): Promise<{ description: string; keywords: string[] }> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You write optimized Google Business Profile descriptions.
Rules:
- Exactly 750 characters (Google's max) — use every character
- Front-load with primary category + location keywords
- Include services, unique selling points, and a call-to-action
- Natural language, not keyword-stuffed
- Return ONLY JSON: { description: string, keywords: string[] }`,
    messages: [
      {
        role: "user",
        content: `Business: ${businessName}
Category: ${category}
Location: ${location || "Unknown"}
Current description: "${currentDescription || "None — write from scratch"}"

Write an optimized GBP description.`,
      },
    ],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

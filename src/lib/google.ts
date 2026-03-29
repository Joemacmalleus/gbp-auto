/**
 * Google Business Profile API client.
 *
 * Handles OAuth flow and wraps the GBP API for:
 * - Listing accounts & locations
 * - Reading reviews, insights, posts
 * - Publishing posts and review replies
 *
 * All API calls go through ensureValidToken() to handle
 * token refresh automatically before expiry.
 */

import { google } from "googleapis";
import { prisma } from "./db";

// ─── OAuth Setup ─────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/business.manage", // Full GBP access
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// Buffer before expiry to trigger refresh (5 minutes)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ─── Token Management ────────────────────────────────────────

/**
 * Ensure we have a valid access token for a user.
 * If the token is expired or about to expire, refresh it.
 * Returns the valid access token string.
 *
 * This is the ONLY function that should be called before any Google API call.
 */
export async function ensureValidToken(user: {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}): Promise<string> {
  if (!user.accessToken) {
    throw new Error("No access token. User must re-authenticate with Google.");
  }

  // Check if token needs refresh
  const now = Date.now();
  const expiresAt = user.tokenExpiry?.getTime() ?? 0;
  const needsRefresh = !user.tokenExpiry || (expiresAt - now) < TOKEN_REFRESH_BUFFER_MS;

  if (!needsRefresh) {
    return user.accessToken;
  }

  // Token expired or about to expire — refresh it
  if (!user.refreshToken) {
    throw new Error("No refresh token. User must re-authenticate with Google.");
  }

  try {
    const credentials = await refreshAccessToken(user.refreshToken);

    if (!credentials.access_token) {
      throw new Error("Google returned no access token on refresh");
    }

    // Update tokens in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000), // Default 1hr if no expiry
        // Only update refresh token if Google sent a new one
        ...(credentials.refresh_token && {
          refreshToken: credentials.refresh_token,
        }),
      },
    });

    return credentials.access_token;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // If refresh fails with invalid_grant, the refresh token is dead
    if (message.includes("invalid_grant") || message.includes("Token has been expired or revoked")) {
      // Clear tokens so user knows they need to re-auth
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
        },
      });
      throw new Error("Google authorization expired. Please reconnect your Google account.");
    }
    throw new Error(`Token refresh failed: ${message}`);
  }
}

// ─── OAuth Flow ──────────────────────────────────────────────

export function getAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

function setCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

// Refresh token if expired, return new credentials
async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

// ─── Google API Call Wrapper with Retry ──────────────────────

interface RetryConfig {
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Wraps a Google API call with:
 * - Timeout protection (default 15s)
 * - Exponential backoff on rate limit (429)
 * - Retry on transient server errors (500, 503)
 */
export async function callGoogleAPI<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries = 3, timeoutMs = 15000 } = config;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Race the API call against a timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Google API timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      return result;
    } catch (error: unknown) {
      lastError = error;
      const status = (error as { status?: number })?.status ??
                     (error as { code?: number })?.code;
      const message = error instanceof Error ? error.message : "";

      // Rate limited (429) — back off exponentially
      if (status === 429) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.warn(`Google API rate limited, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // Transient server errors (500, 502, 503) — retry with backoff
      if (status && status >= 500 && status <= 503) {
        const backoffMs = 1000 * attempt;
        console.warn(`Google API server error ${status}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      // Timeout — retry once
      if (message.includes("timeout") && attempt < maxRetries) {
        console.warn(`Google API timeout, retrying (attempt ${attempt}/${maxRetries})`);
        continue;
      }

      // Non-retryable error — throw immediately
      throw error;
    }
  }

  throw lastError;
}

// ─── User Info ───────────────────────────────────────────────

export async function getUserInfo(accessToken: string) {
  setCredentials(accessToken);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return { email: data.email!, name: data.name, googleId: data.id! };
}

// ─── GBP Accounts & Locations ────────────────────────────────

export async function listAccounts(accessToken: string) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    const mybusiness = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2Client,
    });
    const { data } = await mybusiness.accounts.list();
    return data.accounts || [];
  });
}

export async function listLocations(accessToken: string, accountId: string) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth: oauth2Client,
    });
    const { data } = await mybusiness.accounts.locations.list({
      parent: accountId,
      readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,profile,metadata,regularHours",
    });
    return data.locations || [];
  });
}

export interface GBPLocation {
  name: string;
  title: string;
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  description?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseLocation(raw: any): GBPLocation {
  const addr = raw.storefrontAddress;
  const phoneNumbers = raw.phoneNumbers;
  const categories = raw.categories;
  const profile = raw.profile;
  const metadata = raw.metadata;
  const latlng = metadata?.latlng;

  return {
    name: raw.name as string,
    title: raw.title as string,
    address: addr
      ? [(addr.addressLines as string[] | undefined)?.[0], addr.locality, addr.administrativeArea, addr.postalCode]
          .filter(Boolean)
          .join(", ")
      : undefined,
    phone: phoneNumbers?.primaryPhone,
    website: raw.websiteUri as string | undefined,
    category: categories?.primaryCategory?.displayName,
    description: profile?.description,
    placeId: metadata?.placeId as string | undefined,
    latitude: latlng?.latitude,
    longitude: latlng?.longitude,
  };
}

// ─── Reviews ─────────────────────────────────────────────────

export async function listReviews(
  accessToken: string,
  locationName: string,
  pageSize = 50,
  pageToken?: string
) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    let url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const response = await oauth2Client.request({ url });
    const data = response.data as Record<string, unknown>;
    return {
      reviews: (data.reviews as unknown[]) || [],
      averageRating: data.averageRating as number | undefined,
      totalReviewCount: data.totalReviewCount as number | undefined,
      nextPageToken: data.nextPageToken as string | undefined,
    };
  });
}

/**
 * Fetch ALL reviews using pagination.
 * Use this for full syncs; use listReviews() for single page.
 */
export async function listAllReviews(
  accessToken: string,
  locationName: string
) {
  const allReviews: unknown[] = [];
  let pageToken: string | undefined;
  let averageRating: number | undefined;
  let totalReviewCount: number | undefined;

  do {
    const result = await listReviews(accessToken, locationName, 50, pageToken);
    allReviews.push(...result.reviews);
    averageRating = result.averageRating;
    totalReviewCount = result.totalReviewCount;
    pageToken = result.nextPageToken;
  } while (pageToken);

  return { reviews: allReviews, averageRating, totalReviewCount };
}

export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
    await oauth2Client.request({
      url,
      method: "PUT",
      data: { comment },
    });
  });
}

// ─── Posts ────────────────────────────────────────────────────

export async function createLocalPost(
  accessToken: string,
  locationName: string,
  post: {
    summary: string;
    callToAction?: { actionType: string; url: string };
    media?: { mediaFormat: string; sourceUrl: string };
    topicType?: string;
  }
) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;

    const body: Record<string, unknown> = {
      languageCode: "en",
      summary: post.summary,
      topicType: post.topicType || "STANDARD",
    };

    if (post.callToAction) {
      body.callToAction = post.callToAction;
    }
    if (post.media) {
      body.media = [post.media];
    }

    const response = await oauth2Client.request({
      url,
      method: "POST",
      data: body,
    });
    return response.data;
  });
}

export async function listLocalPosts(accessToken: string, locationName: string) {
  setCredentials(accessToken);
  return callGoogleAPI(async () => {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts?pageSize=20`;
    const response = await oauth2Client.request({ url });
    return ((response.data as Record<string, unknown>).localPosts as unknown[]) || [];
  });
}

// ─── Insights ────────────────────────────────────────────────

export async function getInsights(
  accessToken: string,
  locationName: string,
  startDate: string, // "YYYY-MM-DD"
  endDate: string
) {
  setCredentials(accessToken);

  // Safely parse dates
  const parseDateParts = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date values in: ${dateStr}`);
    }
    return { year, month, day };
  };

  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);

  return callGoogleAPI(async () => {
    const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`;
    const response = await oauth2Client.request({
      url,
      method: "GET",
      params: {
        "dailyMetrics": [
          "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
          "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
          "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
          "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
          "CALL_CLICKS",
          "WEBSITE_CLICKS",
          "BUSINESS_DIRECTION_REQUESTS",
        ],
        "dailyRange.startDate.year": start.year,
        "dailyRange.startDate.month": start.month,
        "dailyRange.startDate.day": start.day,
        "dailyRange.endDate.year": end.year,
        "dailyRange.endDate.month": end.month,
        "dailyRange.endDate.day": end.day,
      },
    });
    return response.data;
  });
}

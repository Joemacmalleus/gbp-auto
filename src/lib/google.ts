/**
 * Google Business Profile API client.
 *
 * Handles OAuth flow and wraps the GBP API for:
 * - Listing accounts & locations
 * - Reading reviews, insights, posts
 * - Publishing posts and review replies
 */

import { google } from "googleapis";

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

export function setCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

// Refresh token if expired, return new access token
export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
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
  const mybusiness = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });
  const { data } = await mybusiness.accounts.list();
  return data.accounts || [];
}

export async function listLocations(accessToken: string, accountId: string) {
  setCredentials(accessToken);
  // Using the Business Profile API v1
  const mybusiness = google.mybusinessbusinessinformation({
    version: "v1",
    auth: oauth2Client,
  });
  const { data } = await mybusiness.accounts.locations.list({
    parent: accountId,
    readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri,categories,profile,metadata,regularHours",
  });
  return data.locations || [];
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

export function parseLocation(raw: any): GBPLocation {
  const addr = raw.storefrontAddress;
  return {
    name: raw.name,
    title: raw.title,
    address: addr
      ? [addr.addressLines?.[0], addr.locality, addr.administrativeArea, addr.postalCode]
          .filter(Boolean)
          .join(", ")
      : undefined,
    phone: raw.phoneNumbers?.primaryPhone,
    website: raw.websiteUri,
    category: raw.categories?.primaryCategory?.displayName,
    description: raw.profile?.description,
    placeId: raw.metadata?.placeId,
    latitude: raw.metadata?.latlng?.latitude,
    longitude: raw.metadata?.latlng?.longitude,
  };
}

// ─── Reviews ─────────────────────────────────────────────────

export async function listReviews(accessToken: string, locationName: string, pageSize = 50) {
  setCredentials(accessToken);
  // GBP Reviews API — mybusiness v4 (still supported for reviews)
  const res = await google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });

  // Use direct API call for reviews (not all are in the generated client)
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}`;
  const response = await oauth2Client.request({ url });
  const data = response.data as any;
  return {
    reviews: data.reviews || [],
    averageRating: data.averageRating,
    totalReviewCount: data.totalReviewCount,
  };
}

export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
) {
  setCredentials(accessToken);
  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;
  await oauth2Client.request({
    url,
    method: "PUT",
    data: { comment },
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
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`;

  const body: any = {
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
}

export async function listLocalPosts(accessToken: string, locationName: string) {
  setCredentials(accessToken);
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts?pageSize=20`;
  const response = await oauth2Client.request({ url });
  return (response.data as any).localPosts || [];
}

// ─── Insights ────────────────────────────────────────────────

export async function getInsights(
  accessToken: string,
  locationName: string,
  startDate: string, // "YYYY-MM-DD"
  endDate: string
) {
  setCredentials(accessToken);
  // Performance API (newer)
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
      "dailyRange.startDate.year": parseInt(startDate.split("-")[0]),
      "dailyRange.startDate.month": parseInt(startDate.split("-")[1]),
      "dailyRange.startDate.day": parseInt(startDate.split("-")[2]),
      "dailyRange.endDate.year": parseInt(endDate.split("-")[0]),
      "dailyRange.endDate.month": parseInt(endDate.split("-")[1]),
      "dailyRange.endDate.day": parseInt(endDate.split("-")[2]),
    },
  });
  return response.data;
}

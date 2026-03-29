/**
 * Local Rank Grid Heatmap Engine
 *
 * Generates a geographic grid around a business location and queries
 * Google Places API (Text Search) at each grid point to find the
 * business's ranking position for a given keyword.
 *
 * Similar to Local Falcon / Search Atlas heatmap functionality.
 */

// ─── Grid Generation ─────────────────────────────────────────

interface GridPoint {
  row: number;
  col: number;
  lat: number;
  lng: number;
}

/**
 * Generate an NxN grid of lat/lng points centered on a location.
 * Uses equirectangular approximation (good enough for <50km grids).
 */
export function generateGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number,
  radiusKm: number
): GridPoint[] {
  const points: GridPoint[] = [];

  // Convert km to degrees (approximate)
  const latDegPerKm = 1 / 111.32;
  const lngDegPerKm = 1 / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  const radiusLat = radiusKm * latDegPerKm;
  const radiusLng = radiusKm * lngDegPerKm;

  const step = gridSize > 1 ? 2 / (gridSize - 1) : 0; // -1 to 1 range

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const normalizedRow = gridSize > 1 ? -1 + row * step : 0;
      const normalizedCol = gridSize > 1 ? -1 + col * step : 0;

      points.push({
        row,
        col,
        lat: centerLat + normalizedRow * radiusLat,
        lng: centerLng + normalizedCol * radiusLng,
      });
    }
  }

  return points;
}

// ─── Google Places API Query ─────────────────────────────────

interface PlacesResult {
  rank: number | null;        // null = not found in top 20
  totalResults: number;
  topCompetitor: string | null;
}

/**
 * Query Google Places Text Search API at a specific location
 * and find the rank of a target business (by Place ID).
 */
export async function queryRankAtPoint(
  keyword: string,
  lat: number,
  lng: number,
  targetPlaceId: string,
  apiKey: string
): Promise<PlacesResult> {
  // Use the Places API (New) Text Search with location bias
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body = {
    textQuery: keyword,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 2000.0, // 2km radius for each grid point
      },
    },
    maxResultCount: 20,
    languageCode: "en",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Places API error at (${lat},${lng}):`, err);
    return { rank: null, totalResults: 0, topCompetitor: null };
  }

  const data = await response.json();
  const places = data.places || [];

  // Find our business in results by Place ID
  let rank: number | null = null;
  let topCompetitor: string | null = null;

  for (let i = 0; i < places.length; i++) {
    const placeId = places[i].id;
    const name = places[i].displayName?.text || "Unknown";

    if (placeId === targetPlaceId) {
      rank = i + 1; // 1-based rank
    }
    if (i === 0 && placeId !== targetPlaceId) {
      topCompetitor = name;
    }
  }

  // If we're #1, the top competitor is #2
  if (rank === 1 && places.length > 1) {
    topCompetitor = places[1].displayName?.text || null;
  }

  return {
    rank,
    totalResults: places.length,
    topCompetitor,
  };
}

// ─── Heatmap Statistics ──────────────────────────────────────

interface HeatmapStats {
  avgRank: number | null;
  bestRank: number | null;
  worstRank: number | null;
  visibility: number;
}

export function computeHeatmapStats(
  points: Array<{ rank: number | null }>
): HeatmapStats {
  const rankedPoints = points.filter((p) => p.rank !== null);

  if (rankedPoints.length === 0) {
    return { avgRank: null, bestRank: null, worstRank: null, visibility: 0 };
  }

  const ranks = rankedPoints.map((p) => p.rank!);
  const avgRank = Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10;
  const bestRank = Math.min(...ranks);
  const worstRank = Math.max(...ranks);
  const visibility = Math.round((rankedPoints.length / points.length) * 100);

  return { avgRank, bestRank, worstRank, visibility };
}

// ─── Color mapping ───────────────────────────────────────────

export function rankToColor(rank: number | null): string {
  if (rank === null) return "#6B7280"; // gray — not found
  if (rank <= 3) return "#22C55E";      // green — top 3
  if (rank <= 5) return "#84CC16";      // lime — 4-5
  if (rank <= 7) return "#EAB308";      // yellow — 6-7
  if (rank <= 10) return "#F97316";     // orange — 8-10
  if (rank <= 15) return "#EF4444";     // red — 11-15
  return "#991B1B";                      // dark red — 16-20
}

// ─── Auto-keyword generation from GBP category ──────────────

const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  // Food & Drink
  "Restaurant": ["restaurant near me", "best restaurant", "place to eat", "dinner near me"],
  "Italian Restaurant": ["italian restaurant", "pasta near me", "italian food", "pizza near me"],
  "Mexican Restaurant": ["mexican restaurant", "tacos near me", "mexican food", "burritos near me"],
  "Chinese Restaurant": ["chinese restaurant", "chinese food near me", "asian restaurant"],
  "Japanese Restaurant": ["japanese restaurant", "sushi near me", "ramen near me"],
  "Thai Restaurant": ["thai restaurant", "thai food near me", "pad thai near me"],
  "Indian Restaurant": ["indian restaurant", "indian food near me", "curry near me"],
  "Pizza Restaurant": ["pizza near me", "best pizza", "pizza delivery", "pizza restaurant"],
  "Burger Restaurant": ["burger near me", "best burgers", "burger restaurant"],
  "Seafood Restaurant": ["seafood restaurant", "seafood near me", "fish restaurant"],
  "Steakhouse": ["steakhouse near me", "best steak", "steak restaurant"],
  "Bakery": ["bakery near me", "fresh bread", "cakes near me", "pastry shop"],
  "Cafe": ["cafe near me", "coffee shop", "coffee near me", "breakfast near me"],
  "Coffee Shop": ["coffee shop near me", "best coffee", "cafe near me", "espresso near me"],
  "Bar": ["bar near me", "drinks near me", "happy hour", "nightlife"],
  "Fast Food Restaurant": ["fast food near me", "quick food", "drive through near me"],

  // Health & Medical
  "Dentist": ["dentist near me", "dental office", "teeth cleaning", "dental care"],
  "Doctor": ["doctor near me", "physician near me", "medical clinic", "primary care"],
  "Chiropractor": ["chiropractor near me", "back pain treatment", "chiropractic care"],
  "Optometrist": ["eye doctor near me", "optometrist", "eye exam near me", "glasses near me"],
  "Veterinarian": ["vet near me", "veterinarian", "animal hospital", "pet doctor"],
  "Pharmacy": ["pharmacy near me", "drugstore", "prescription pickup"],
  "Physical Therapist": ["physical therapy near me", "PT near me", "rehab center"],
  "Dermatologist": ["dermatologist near me", "skin doctor", "skin care clinic"],

  // Home Services
  "Plumber": ["plumber near me", "plumbing service", "emergency plumber", "drain cleaning"],
  "Electrician": ["electrician near me", "electrical repair", "emergency electrician"],
  "HVAC Contractor": ["hvac near me", "ac repair", "heating repair", "furnace service"],
  "Roofer": ["roofer near me", "roof repair", "roofing company", "roof replacement"],
  "Painter": ["painter near me", "house painting", "painting contractor"],
  "Landscaper": ["landscaper near me", "lawn care", "landscaping service", "yard maintenance"],
  "Locksmith": ["locksmith near me", "lock repair", "emergency locksmith", "key copy"],
  "Pest Control": ["pest control near me", "exterminator", "bug spray service"],
  "Cleaning Service": ["cleaning service near me", "house cleaning", "maid service"],
  "Moving Company": ["movers near me", "moving company", "moving service"],
  "Handyman": ["handyman near me", "home repair", "fix it service"],

  // Auto
  "Auto Repair Shop": ["auto repair near me", "mechanic near me", "car repair", "auto shop"],
  "Car Dealer": ["car dealer near me", "used cars", "car dealership", "buy a car"],
  "Auto Body Shop": ["auto body shop near me", "collision repair", "dent repair"],
  "Car Wash": ["car wash near me", "auto detailing", "car cleaning"],
  "Tire Shop": ["tires near me", "tire shop", "tire replacement", "tire repair"],

  // Professional Services
  "Lawyer": ["lawyer near me", "attorney near me", "legal services", "law firm"],
  "Accountant": ["accountant near me", "tax preparation", "CPA near me", "bookkeeper"],
  "Real Estate Agent": ["real estate agent near me", "realtor near me", "homes for sale", "houses near me"],
  "Insurance Agent": ["insurance near me", "insurance agent", "car insurance", "home insurance"],
  "Financial Advisor": ["financial advisor near me", "financial planner", "investment advisor"],

  // Beauty & Personal Care
  "Hair Salon": ["hair salon near me", "haircut near me", "stylist near me", "barber near me"],
  "Barber Shop": ["barber near me", "barbershop", "haircut near me", "mens haircut"],
  "Nail Salon": ["nail salon near me", "manicure near me", "pedicure near me", "nails near me"],
  "Spa": ["spa near me", "massage near me", "day spa", "facial near me"],
  "Beauty Salon": ["beauty salon near me", "salon near me", "beauty services"],

  // Fitness & Recreation
  "Gym": ["gym near me", "fitness center", "workout near me", "health club"],
  "Yoga Studio": ["yoga near me", "yoga studio", "yoga classes", "hot yoga"],
  "Personal Trainer": ["personal trainer near me", "fitness trainer", "PT near me"],

  // Retail
  "Clothing Store": ["clothing store near me", "clothes shopping", "fashion store"],
  "Jewelry Store": ["jewelry store near me", "jeweler near me", "rings near me"],
  "Florist": ["florist near me", "flower shop", "flowers near me", "flower delivery"],
  "Pet Store": ["pet store near me", "pet shop", "pet supplies"],
  "Hardware Store": ["hardware store near me", "tools near me", "home improvement"],
  "Grocery Store": ["grocery store near me", "supermarket", "food store near me"],

  // Education
  "School": ["school near me", "private school", "elementary school"],
  "Tutoring Service": ["tutor near me", "tutoring service", "math tutor", "homework help"],
  "Driving School": ["driving school near me", "driving lessons", "drivers ed"],

  // Lodging
  "Hotel": ["hotel near me", "hotels nearby", "places to stay", "lodging"],
  "Bed & Breakfast": ["bed and breakfast near me", "B&B near me", "inn near me"],
};

/**
 * Generate search keywords from a GBP category.
 * Falls back to generic variants if exact category not mapped.
 */
export function generateKeywordsFromCategory(
  category: string | null | undefined,
  businessName?: string | null
): string[] {
  if (!category) return ["business near me"];

  // Try exact match
  const exact = CATEGORY_KEYWORD_MAP[category];
  if (exact) return exact;

  // Try partial match (e.g. "Family Dentist" → match "Dentist")
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return keywords;
    }
  }

  // Fallback: generate from category name
  const normalized = category.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  return [
    `${normalized} near me`,
    `best ${normalized}`,
    `${normalized} nearby`,
  ];
}

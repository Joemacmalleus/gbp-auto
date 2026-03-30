"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  rank: number | null;
  gridRow: number;
  gridCol: number;
  topCompetitor?: string | null;
  totalResults?: number | null;
}

interface MapGridProps {
  points: MapPoint[];
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  selectedPointId?: string | null;
  onSelectPoint?: (point: MapPoint) => void;
  height?: string;
  interactive?: boolean;
  showBusinessPin?: boolean;
}

// ─── Google Maps Script Loader (singleton) ──────────────────

let _loadPromise: Promise<void> | null = null;

function loadMapsAPI(): Promise<void> {
  if (_loadPromise) return _loadPromise;
  if (typeof window !== "undefined" && (window as any).google?.maps) {
    return Promise.resolve();
  }
  _loadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      _loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });
  return _loadPromise;
}

// ─── Color mapping ──────────────────────────────────────────

export function rankToColor(rank: number | null): string {
  if (rank === null) return "#6B7280";
  if (rank <= 3) return "#22C55E";
  if (rank <= 5) return "#84CC16";
  if (rank <= 7) return "#EAB308";
  if (rank <= 10) return "#F97316";
  if (rank <= 15) return "#EF4444";
  return "#991B1B";
}

// ─── SVG marker factory ─────────────────────────────────────

function markerSvg(rank: number | null, selected: boolean): string {
  const s = selected ? 38 : 30;
  const fs = selected ? 14 : 11;
  const color = rankToColor(rank);
  const label = rank !== null ? String(rank) : "—";
  const shadow = selected ? 3 : 1.5;
  const ring = selected
    ? `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1.5}" fill="none" stroke="#fff" stroke-width="2.5"/>`
    : `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1}" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
    <defs><filter id="ds"><feDropShadow dx="0" dy="${shadow}" stdDeviation="${shadow}" flood-opacity="0.35"/></filter></defs>
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="${color}" filter="url(#ds)"/>
    ${ring}
    <text x="${s / 2}" y="${s / 2 + fs * 0.37}" text-anchor="middle" fill="#fff" font-size="${fs}" font-weight="700" font-family="system-ui,-apple-system,sans-serif">${label}</text>
  </svg>`;
}

function markerIconUrl(rank: number | null, selected: boolean): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg(rank, selected))}`;
}

// ─── Dark map styling ───────────────────────────────────────

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ─── Zoom calculator ────────────────────────────────────────

function zoomForRadius(radiusKm: number): number {
  if (radiusKm <= 1) return 15;
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  return 10;
}

// ─── MapGrid Component ──────────────────────────────────────

export default function MapGrid({
  points,
  centerLat,
  centerLng,
  radiusKm,
  selectedPointId,
  onSelectPoint,
  height = "500px",
  interactive = true,
  showBusinessPin = true,
}: MapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    let cancelled = false;

    loadMapsAPI()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const g = (window as any).google;

        const map = new g.maps.Map(containerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoomForRadius(radiusKm),
          styles: DARK_STYLE,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: interactive ? "cooperative" : "none",
          backgroundColor: "#0f172a",
          clickableIcons: false,
        });

        mapRef.current = map;
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, radiusKm, interactive]);

  // Render markers whenever points or selection changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = (window as any).google;

    // Clear previous markers
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    // Business center pin
    if (showBusinessPin) {
      const center = new g.maps.Marker({
        position: { lat: centerLat, lng: centerLng },
        map: mapRef.current,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
        zIndex: 1000,
        title: "Your business",
      });
      markersRef.current.push(center);
    }

    // Grid point markers
    points.forEach((pt) => {
      const sel = pt.id === selectedPointId;
      const sz = sel ? 38 : 30;
      const marker = new g.maps.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map: mapRef.current,
        icon: {
          url: markerIconUrl(pt.rank, sel),
          scaledSize: new g.maps.Size(sz, sz),
          anchor: new g.maps.Point(sz / 2, sz / 2),
        },
        zIndex: sel ? 999 : pt.rank ? 100 - pt.rank : 1,
        title: pt.rank ? `#${pt.rank}` : "Not found",
        optimized: false,
      });

      if (onSelectPoint) {
        marker.addListener("click", () => onSelectPoint(pt));
      }
      markersRef.current.push(marker);
    });
  }, [points, selectedPointId, ready, centerLat, centerLng, showBusinessPin, onSelectPoint]);

  // Error state
  if (error) {
    return (
      <div
        style={{ height }}
        className="bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800"
      >
        <div className="text-center px-8">
          <p className="text-slate-400 text-sm mb-1">Map unavailable</p>
          <p className="text-slate-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-xs">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend (exported for use in pages) ─────────────────────

export function MapLegend() {
  const items = [
    { label: "#1–3", color: "#22C55E" },
    { label: "#4–5", color: "#84CC16" },
    { label: "#6–7", color: "#EAB308" },
    { label: "#8–10", color: "#F97316" },
    { label: "#11–15", color: "#EF4444" },
    { label: "#16+", color: "#991B1B" },
    { label: "N/A", color: "#6B7280" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

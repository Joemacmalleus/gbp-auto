"use client";

import { useState, useEffect, useRef } from "react";

// ─── Demo Heatmap on Real Google Maps ──────────────────────

const DEMO_CENTER = { lat: 40.758, lng: -73.9855 }; // Midtown Manhattan

const DEMO_POINTS = [
  { lat: 40.766, lng: -73.998, rank: null },
  { lat: 40.766, lng: -73.992, rank: 12 },
  { lat: 40.766, lng: -73.986, rank: 8 },
  { lat: 40.766, lng: -73.980, rank: 15 },
  { lat: 40.766, lng: -73.974, rank: null },
  { lat: 40.762, lng: -73.998, rank: 9 },
  { lat: 40.762, lng: -73.992, rank: 5 },
  { lat: 40.762, lng: -73.986, rank: 3 },
  { lat: 40.762, lng: -73.980, rank: 6 },
  { lat: 40.762, lng: -73.974, rank: 11 },
  { lat: 40.758, lng: -73.998, rank: 7 },
  { lat: 40.758, lng: -73.992, rank: 2 },
  { lat: 40.758, lng: -73.986, rank: 1 },
  { lat: 40.758, lng: -73.980, rank: 3 },
  { lat: 40.758, lng: -73.974, rank: 8 },
  { lat: 40.754, lng: -73.998, rank: 10 },
  { lat: 40.754, lng: -73.992, rank: 4 },
  { lat: 40.754, lng: -73.986, rank: 2 },
  { lat: 40.754, lng: -73.980, rank: 5 },
  { lat: 40.754, lng: -73.974, rank: 13 },
  { lat: 40.750, lng: -73.998, rank: null },
  { lat: 40.750, lng: -73.992, rank: 9 },
  { lat: 40.750, lng: -73.986, rank: 6 },
  { lat: 40.750, lng: -73.980, rank: 10 },
  { lat: 40.750, lng: -73.974, rank: null },
];

function rankToColor(rank: number | null): string {
  if (rank === null) return "#6B7280";
  if (rank <= 3) return "#22C55E";
  if (rank <= 5) return "#84CC16";
  if (rank <= 7) return "#EAB308";
  if (rank <= 10) return "#F97316";
  if (rank <= 15) return "#EF4444";
  return "#991B1B";
}

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

function markerSvg(rank: number | null): string {
  const s = 30;
  const fs = 11;
  const color = rankToColor(rank);
  const label = rank !== null ? String(rank) : "\u2014";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
    <defs><filter id="ds"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.35"/></filter></defs>
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="${color}" filter="url(#ds)"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1}" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
    <text x="${s / 2}" y="${s / 2 + fs * 0.37}" text-anchor="middle" fill="#fff" font-size="${fs}" font-weight="700" font-family="system-ui,-apple-system,sans-serif">${label}</text>
  </svg>`;
}

let _loadPromise: Promise<void> | null = null;
function loadMapsAPI(): Promise<void> {
  if (_loadPromise) return _loadPromise;
  if (typeof window !== "undefined" && (window as any).google?.maps) return Promise.resolve();
  _loadPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) { reject(new Error("no key")); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { _loadPromise = null; reject(new Error("load failed")); };
    document.head.appendChild(s);
  });
  return _loadPromise;
}

function DemoMapHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    loadMapsAPI()
      .then(() => {
        if (!containerRef.current) return;
        const g = (window as any).google;
        const map = new g.maps.Map(containerRef.current, {
          center: DEMO_CENTER,
          zoom: 14,
          styles: DARK_STYLE,
          disableDefaultUI: true,
          gestureHandling: "none",
          backgroundColor: "#0f172a",
          clickableIcons: false,
        });

        // Business center pin
        new g.maps.Marker({
          position: DEMO_CENTER,
          map,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          },
          zIndex: 1000,
        });

        // Rank pins
        DEMO_POINTS.forEach((pt) => {
          const svg = markerSvg(pt.rank);
          const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
          new g.maps.Marker({
            position: { lat: pt.lat, lng: pt.lng },
            map,
            icon: {
              url,
              scaledSize: new g.maps.Size(30, 30),
              anchor: new g.maps.Point(15, 15),
            },
            zIndex: pt.rank ? 100 - pt.rank : 1,
            optimized: false,
          });
        });

        setReady(true);
      })
      .catch(() => setFallback(true));
  }, []);

  if (fallback) return <StaticHeroGrid />;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: "360px" }}>
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// CSS fallback when no Maps API key
function StaticHeroGrid() {
  const grid = [
    [null, 12, 8, 15, null],
    [9, 5, 3, 6, 11],
    [7, 2, 1, 3, 8],
    [10, 4, 2, 5, 13],
    [null, 9, 6, 10, null],
  ];

  return (
    <div className="bg-slate-900 rounded-2xl p-8 inline-block">
      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {grid.flat().map((rank, i) => (
          <div
            key={i}
            className="heatmap-cell aspect-square rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm"
            style={{
              backgroundColor: rankToColor(rank),
              animationDelay: `${i * 0.04}s`,
            }}
          >
            {rank ?? "\u2014"}
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-xs mt-3 text-center">Your business is at the center</p>
    </div>
  );
}

// ─── FAQ ────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    {
      q: "Do I need to give full access to my Google account?",
      a: "No. We only request access to manage your Google Business Profile \u2014 reading reviews, posting content, and viewing insights. We cannot access Gmail, Drive, or any other Google service.",
    },
    {
      q: "How does ranking tracking work?",
      a: "We check your position in Google Maps search results from a grid of geographic points around your business. You see exactly where you rank from every direction \u2014 your strong zones and blind spots.",
    },
    {
      q: "How is this different from BrightLocal or SEMrush?",
      a: "Those tools serve agencies managing dozens of clients. GBP Auto is built for the business owner who just wants their Google profile handled \u2014 the right posts, review responses, and optimization fixes without learning SEO jargon.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. No contracts, no cancellation fees. We also offer a 7-day free trial with no credit card required.",
    },
  ];

  return (
    <section className="py-20 bg-slate-950">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-3xl font-bold text-center text-white mb-10">Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50 transition"
              >
                <span className="font-medium text-white text-sm pr-4">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-4 pb-4">
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ───────────────────────────────────────────
export default function LandingPage() {
  const [annual, setAnnual] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-slate-900 p-6 flex flex-col gap-4">
            <button onClick={() => setMobileMenu(false)} className="self-end text-slate-400" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="text-white text-sm py-2">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenu(false)} className="text-white text-sm py-2">FAQ</a>
            <a href="/api/auth/google" className="bg-white text-slate-900 text-center text-sm py-2.5 rounded-lg font-medium mt-4">
              Start free trial
            </a>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-slate-800/50 sticky top-0 z-40 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-semibold text-sm">GBP Auto</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#pricing" className="text-slate-400 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-slate-400 hover:text-white transition">FAQ</a>
            <a href="/api/auth/google" className="text-slate-400 hover:text-white transition">Sign in</a>
            <a href="/api/auth/google" className="bg-white text-slate-900 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 transition">
              Start free trial
            </a>
          </div>
          <button onClick={() => setMobileMenu(true)} className="md:hidden text-slate-400" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-slate-500 text-sm mb-4">Local rank tracking for Google Maps</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            See where you rank.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Fix what&apos;s broken.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-12">
            Connect your Google Business Profile. Get a heatmap of your local rankings across every direction. Then let AI handle posts, reviews, and optimization.
          </p>

          {/* The real map hero */}
          <div className="mb-8">
            <DemoMapHero />
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {[
                { label: "#1\u20133", color: "#22C55E" },
                { label: "#4\u20135", color: "#84CC16" },
                { label: "#6\u20137", color: "#EAB308" },
                { label: "#8\u201310", color: "#F97316" },
                { label: "#11+", color: "#EF4444" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-xs mt-2">Your business is at the center</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/api/auth/google"
              className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition shadow-lg shadow-white/10"
            >
              Connect your GBP free
            </a>
            <a href="#how" className="text-slate-400 px-8 py-3 rounded-lg hover:text-white transition">
              How it works &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────────── */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Rank Heatmap",
                desc: "See your Google Maps ranking from every direction around your business. Updated weekly.",
              },
              {
                title: "AI Posts",
                desc: "Weekly posts written and scheduled for your business. Review and approve with one click.",
              },
              {
                title: "Review Responses",
                desc: "AI drafts replies to every review instantly. Approve or edit before posting.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                <h3 className="text-white font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how" className="py-16 border-t border-slate-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold text-center mb-12">Three steps. Five minutes.</h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Connect your Google Business Profile", desc: "Sign in with Google. We only access your business profile \u2014 nothing else." },
              { step: "2", title: "See your rank grid instantly", desc: "We scan Google Maps from a grid of points around you. See where you rank from every direction." },
              { step: "3", title: "Let AI improve your profile", desc: "Posts, review responses, and optimization fixes \u2014 all generated automatically. You approve." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border border-slate-700">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                  <p className="text-slate-500 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────── */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Marco", biz: "Italian Kitchen", metric: "3x more orders", quote: "Started getting 3x more online orders within 2 weeks." },
              { name: "Dr. Sarah", biz: "Bright Smiles Dental", metric: "100% response rate", quote: "Finally keeping up with review responses." },
              { name: "Mike T.", biz: "Thompson Plumbing", metric: "#8 \u2192 #2", quote: "The heatmap showed me exactly where I was invisible." },
            ].map((t, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                <div className="text-emerald-400 font-bold text-sm mb-2">{t.metric}</div>
                <p className="text-slate-400 text-sm mb-3">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-xs text-slate-600">{t.name} &middot; {t.biz}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="py-20 border-t border-slate-800/50">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">One plan. Everything included.</h2>
          <p className="text-slate-500 mb-8">No feature gates. No upsells.</p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition ${annual ? "bg-blue-600" : "bg-slate-700"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${annual ? "left-7" : "left-1"}`} />
            </button>
            <span className={`text-sm ${annual ? "text-white" : "text-slate-500"}`}>
              Annual <span className="text-emerald-400 text-xs ml-1">Save 20%</span>
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-bold">${annual ? "63" : "79"}</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              {annual ? "Billed annually \u2014 2 months free" : "Billed monthly, cancel anytime"}
            </p>

            <a
              href="/api/auth/google"
              className="block w-full bg-white text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-100 transition mb-6"
            >
              Start 7-day free trial
            </a>

            <div className="grid grid-cols-2 gap-2 text-left text-sm text-slate-400">
              {[
                "Local rank heatmap",
                "AI-generated posts",
                "Review response drafts",
                "Optimization audit",
                "Weekly reports",
                "Unlimited scans",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs mt-4">No credit card required for trial</p>
        </div>
      </section>

      {/* FAQ */}
      <div id="faq">
        <FAQ />
      </div>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold mb-4">Your competitors already know where they rank.</h2>
          <p className="text-slate-500 mb-8">Do you?</p>
          <a
            href="/api/auth/google"
            className="inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition shadow-lg shadow-white/10"
          >
            See your rank grid free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span>&copy; {new Date().getFullYear()} GBP Auto</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition">Terms</a>
            <a href="mailto:support@gbpauto.com" className="hover:text-slate-400 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

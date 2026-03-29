"use client";

import { useState } from "react";

export default function LandingPage() {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-semibold text-lg">GBP Auto</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="#how" className="hover:text-gray-900">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/auth/google" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </a>
            <a
              href="/api/auth/google"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Start free trial
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          7-day free trial — no credit card required
        </div>
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Your Google Business Profile,{" "}
          <span className="text-blue-600">optimized by AI</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Connect your GBP and let AI handle the rest — weekly posts, review responses,
          optimization scoring, and ranking tracking. All on autopilot.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/api/auth/google"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
          >
            Connect your GBP free
          </a>
          <a
            href="#how"
            className="text-gray-600 px-6 py-3 rounded-lg text-lg hover:text-gray-900 transition"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Dashboard preview placeholder */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="bg-gray-900 rounded-xl p-8 shadow-2xl">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Optimization Score", value: "87/100", color: "text-green-400" },
              { label: "Posts This Month", value: "4", color: "text-blue-400" },
              { label: "Reviews Responded", value: "12/12", color: "text-purple-400" },
              { label: "Avg. Ranking", value: "#3", color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-lg p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="h-32 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
            Activity feed, upcoming posts, and AI recommendations appear here
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything your GBP needs, nothing it doesn&apos;t
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            No bloated SEO suite. Just the tools that actually move the needle for local businesses.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "✍️",
                title: "AI Post Generation",
                desc: "Claude writes engaging posts tailored to your business. Review, edit, or auto-publish on a schedule. Never stare at a blank screen again.",
              },
              {
                icon: "💬",
                title: "Smart Review Responses",
                desc: "New review comes in, AI drafts a response instantly. Approve with one click or tweak first. Keep your response rate at 100%.",
              },
              {
                icon: "📊",
                title: "Optimization Audit",
                desc: "See exactly what's missing from your profile — photos, description, categories, attributes. Get a score and a prioritized fix list.",
              },
              {
                icon: "📈",
                title: "Ranking Tracker",
                desc: "Track where you show up in Google Maps for your key search terms. See trends over time. Know if you're moving up or slipping.",
              },
              {
                icon: "🔔",
                title: "Weekly Reports",
                desc: "Every Monday, get a summary of what happened — new reviews, post performance, ranking changes, and what to focus on this week.",
              },
              {
                icon: "⚡",
                title: "One-Click Actions",
                desc: "Approve posts, respond to reviews, apply optimizations — all from your dashboard. No logging into Google. No switching tabs.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Three steps. Five minutes.</h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Connect your Google Business Profile",
                desc: "Sign in with your Google account. We request access to your business profile — read your reviews, post on your behalf, and view your insights. You can revoke access anytime.",
              },
              {
                step: "2",
                title: "Get your optimization audit",
                desc: "Within seconds, AI analyzes your entire profile — description, photos, posts, reviews, categories, attributes — and gives you a score with a prioritized list of improvements.",
              },
              {
                step: "3",
                title: "Turn on autopilot",
                desc: "Approve your first batch of AI-generated posts, set your review response preferences, and let GBP Auto handle the rest. Check your dashboard whenever you want to see how things are going.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple pricing. One plan.</h2>
          <p className="text-gray-600 mb-8">
            Everything you need to optimize your Google Business Profile. No upsells, no feature gates.
          </p>

          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm ${!annualBilling ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className={`relative w-12 h-6 rounded-full transition ${
                annualBilling ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${
                  annualBilling ? "left-6" : "left-0.5"
                }`}
              />
            </button>
            <span className={`text-sm ${annualBilling ? "text-gray-900 font-medium" : "text-gray-500"}`}>
              Annual <span className="text-green-600 text-xs font-medium">Save 20%</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 shadow-lg">
            <div className="text-sm text-blue-600 font-medium mb-2">GBP Auto Pro</div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-bold">${annualBilling ? "63" : "79"}</span>
              <span className="text-gray-500">/mo</span>
            </div>
            {annualBilling && (
              <div className="text-sm text-gray-500 mb-6">Billed annually ($756/year)</div>
            )}
            {!annualBilling && <div className="text-sm text-gray-500 mb-6">Billed monthly</div>}

            <a
              href="/api/auth/google"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mb-8"
            >
              Start 7-day free trial
            </a>

            <div className="grid sm:grid-cols-2 gap-3 text-left text-sm">
              {[
                "AI-generated weekly posts",
                "Smart review response drafts",
                "Optimization audit & score",
                "Local ranking tracker",
                "Weekly email reports",
                "One-click publish & reply",
                "Content calendar",
                "Competitor monitoring",
                "Unlimited AI generations",
                "Cancel anytime",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} GBP Auto</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="mailto:support@gbpauto.com" className="hover:text-gray-700">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

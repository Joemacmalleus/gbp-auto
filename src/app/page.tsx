"use client";

import { useState } from "react";

export default function LandingPage() {
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">GBP Auto</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">Pricing</a>
            <a href="#how" className="hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/auth/google" className="text-sm text-gray-600 hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-3 py-2">
              Sign in
            </a>
            <a
              href="/api/auth/google"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 font-medium"
            >
              Start free trial
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-white pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-block bg-blue-500/20 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-400/30 backdrop-blur">
            7-day free trial — no credit card required
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-white">
            Your Google Business Profile,{" "}
            <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-200 bg-clip-text text-transparent">optimized by AI</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connect your GBP and let AI handle the rest — weekly posts, review responses, optimization scoring, and ranking tracking. All on autopilot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="/api/auth/google"
              className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/40 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              <span className="relative z-10">Connect your GBP free</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur transition"></div>
            </a>
            <a
              href="#how"
              className="text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/10 transition focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              See how it works →
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 text-blue-100">
            <div className="flex -space-x-2">
              {["#4F46E5", "#3B82F6", "#06B6D4", "#10B981"].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                ></div>
              ))}
            </div>
            <span className="text-sm">Trusted by 500+ local businesses</span>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative -mt-16 mx-auto max-w-5xl px-6 pb-20 z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Optimization Score", value: "87/100", color: "text-emerald-400" },
              { label: "Posts This Month", value: "4", color: "text-blue-400" },
              { label: "Reviews Responded", value: "12/12", color: "text-purple-400" },
              { label: "Avg. Ranking", value: "#3", color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gradient-to-br from-slate-800/80 to-blue-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className={`text-2xl md:text-3xl font-bold ${s.color} animate-pulse`}>{s.value}</div>
                <div className="text-slate-400 text-xs md:text-sm mt-2">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="h-40 bg-gradient-to-br from-slate-700/50 to-blue-900/30 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-slate-700/30">
            <div className="text-center">
              <div className="text-slate-300 mb-1">Activity feed, upcoming posts & AI recommendations</div>
              <div className="text-xs text-slate-500">Real-time dashboard sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="bg-gradient-to-b from-white via-blue-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Loved by SMB owners</h2>
            <p className="text-gray-600">See what restaurants, dentists, and service pros are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marco's Italian Kitchen",
                role: "Owner",
                quote: "Started getting 3x more online orders within 2 weeks. The AI posts are so good, I barely have to edit them.",
                rating: 5,
              },
              {
                name: "Dr. Sarah Chen",
                role: "Dentist",
                quote: "Finally keeping up with review responses without dying of stress. GBP Auto does the heavy lifting.",
                rating: 5,
              },
              {
                name: "Mike's Plumbing",
                role: "Owner",
                quote: "Went from #8 to #2 in local search. The optimization audit alone paid for a year's subscription.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything your GBP needs, nothing it doesn&apos;t
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              No bloated SEO suite. Just the tools that actually move the needle for local businesses.
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                icon: "✍️",
                title: "AI Post Generation",
                desc: "Claude writes engaging posts tailored to your business. Review, edit, or auto-publish on a schedule. Never stare at a blank screen again.",
                image: "left",
              },
              {
                icon: "💬",
                title: "Smart Review Responses",
                desc: "New review comes in, AI drafts a response instantly. Approve with one click or tweak first. Keep your response rate at 100%.",
                image: "right",
              },
              {
                icon: "📊",
                title: "Optimization Audit",
                desc: "See exactly what's missing from your profile — photos, description, categories, attributes. Get a score and a prioritized fix list.",
                image: "left",
              },
              {
                icon: "📈",
                title: "Ranking Tracker",
                desc: "Track where you show up in Google Maps for your key search terms. See trends over time. Know if you're moving up or slipping.",
                image: "right",
              },
            ].map((f, i) => (
              <div key={f.title} className={`flex flex-col ${f.image === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}>
                <div className="flex-1">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-2xl mb-3 text-slate-900">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{f.desc}</p>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl h-64 flex items-center justify-center text-slate-400 border border-slate-200">
                    <div className="text-center">
                      <div className="text-5xl mb-2">{f.icon}</div>
                      <div className="text-sm">Feature preview</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔔",
                title: "Weekly Reports",
                desc: "Every Monday, get a summary — new reviews, post performance, ranking changes, and focus areas.",
              },
              {
                icon: "⚡",
                title: "One-Click Actions",
                desc: "Approve posts, respond to reviews, apply optimizations — all from your dashboard. No tab switching.",
              },
              {
                icon: "🎯",
                title: "Smart Analytics",
                desc: "See which posts drive engagement, which reviews matter most, and where you're gaining ground.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border border-slate-200 hover:border-blue-300 hover:shadow-md transition">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-4xl font-bold text-center mb-4">Three steps. Five minutes.</h2>
          <p className="text-center text-gray-600 mb-16">Get from zero to optimized faster than you can make a coffee.</p>

          <div className="relative space-y-12">
            {/* Vertical line connector */}
            <div className="hidden md:block absolute left-5 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200"></div>

            {[
              {
                step: "1",
                title: "Connect your Google Business Profile",
                desc: "Sign in with your Google account. We request access to manage your business profile — read reviews, post content, and view insights. You control everything and can revoke access anytime.",
              },
              {
                step: "2",
                title: "Get your optimization audit",
                desc: "Within seconds, AI analyzes your entire profile — description, photos, posts, reviews, categories, attributes — and gives you a score with a prioritized list of improvements.",
              },
              {
                step: "3",
                title: "Turn on autopilot",
                desc: "Approve your first batch of AI-generated posts, set review response preferences, and let GBP Auto handle the rest. Check your dashboard anytime to see how things are going.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-6 items-start md:ml-20">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30 flex-shrink-0 border-2 border-white">
                    {s.step}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur animate-pulse"></div>
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-xl mb-2 text-slate-900">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple pricing. One plan.</h2>
          <p className="text-gray-600 text-lg mb-12">
            Everything you need to optimize your Google Business Profile. No upsells, no feature gates.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition ${!annualBilling ? "text-slate-900" : "text-gray-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className={`relative w-14 h-7 rounded-full transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 ${
                annualBilling ? "bg-blue-600" : "bg-gray-300"
              }`}
              aria-label="Toggle annual billing"
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition ${
                  annualBilling ? "left-7" : "left-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition ${annualBilling ? "text-slate-900" : "text-gray-500"}`}>
              Annual <span className="text-green-600 text-xs font-bold ml-1">Save 20%</span>
            </span>
          </div>

          <div className="relative bg-white rounded-2xl border-2 border-blue-600 p-8 shadow-xl hover:shadow-2xl transition">
            <div className="absolute -top-3 left-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>

            <div className="text-sm text-blue-600 font-semibold mb-2">GBP Auto Pro</div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-6xl font-bold text-slate-900">${annualBilling ? "63" : "79"}</span>
              <span className="text-gray-500">/mo</span>
            </div>
            {annualBilling && (
              <div className="text-sm text-gray-500 mb-8">Billed annually ($756/year) — 2 months free</div>
            )}
            {!annualBilling && <div className="text-sm text-gray-500 mb-8">Billed monthly, cancel anytime</div>}

            <a
              href="/api/auth/google"
              className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md shadow-blue-600/30 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 mb-8"
            >
              Start 7-day free trial
            </a>

            <div className="grid sm:grid-cols-2 gap-4 text-left text-sm">
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
                "Email support",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

          <p className="text-sm text-gray-500 mt-8">All plans include a 7-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Stop losing customers to competitors with better profiles.
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Your GBP is your digital front door. Make it unforgettable with AI-powered optimization.
          </p>
          <a
            href="/api/auth/google"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/40 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            Get started free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <span className="font-bold text-sm bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">GBP Auto</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">Terms</a>
              <a href="mailto:support@gbpauto.com" className="text-gray-600 hover:text-gray-900 transition focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded px-2 py-1">Support</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <span>&copy; {new Date().getFullYear()} GBP Auto. Made with AI, built for local business.</span>
            <span>Optimize your Google Business Profile with confidence.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

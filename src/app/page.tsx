"use client";

import { useState } from "react";

// ─── Mobile Nav ─────────────────────────────────────────────
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col gap-4">
        <button onClick={onClose} className="self-end text-gray-400 hover:text-gray-600" aria-label="Close menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <a href="#features" onClick={onClose} className="text-gray-700 font-medium py-2">Features</a>
        <a href="#pricing" onClick={onClose} className="text-gray-700 font-medium py-2">Pricing</a>
        <a href="#how" onClick={onClose} className="text-gray-700 font-medium py-2">How it works</a>
        <a href="#faq" onClick={onClose} className="text-gray-700 font-medium py-2">FAQ</a>
        <hr className="border-gray-200" />
        <a href="/api/auth/google" className="text-gray-700 font-medium py-2">Sign in</a>
        <a
          href="/api/auth/google"
          className="bg-blue-600 text-white text-center py-2.5 rounded-lg font-medium"
        >
          Start free trial
        </a>
      </div>
    </div>
  );
}

// ─── Feature Preview Mockups ────────────────────────────────
function PostPreview() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">AI</div>
        <div>
          <div className="text-xs font-medium text-gray-900">AI-generated draft</div>
          <div className="text-[10px] text-gray-400">Just now</div>
        </div>
        <span className="ml-auto text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Draft</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        Fresh pasta made in-house daily — swing by Nonna&apos;s Kitchen for our new truffle mushroom ravioli, available this week only. Bring your appetite!
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <span>237 chars</span>
        <span>·</span>
        <span>Scheduled for Wed</span>
      </div>
      <div className="flex gap-2">
        <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
        <button className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg">Edit</button>
      </div>
    </div>
  );
}

function ReviewPreview() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold">J</div>
        <div>
          <div className="text-xs font-medium text-gray-900">Jessica M.</div>
          <div className="text-yellow-500 text-xs tracking-wider">★★★★★</div>
        </div>
        <span className="ml-auto text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Positive</span>
      </div>
      <p className="text-sm text-gray-600 italic mb-3">&ldquo;Best pizza in town. Friendly staff and cozy atmosphere!&rdquo;</p>
      <div className="bg-purple-50 rounded-lg p-3">
        <div className="text-[10px] font-medium text-purple-600 mb-1">AI suggested reply</div>
        <p className="text-xs text-purple-900 leading-relaxed">Thank you so much, Jessica! We&apos;re thrilled you loved the pizza and the vibe. Can&apos;t wait to welcome you back!</p>
        <div className="flex gap-2 mt-2">
          <button className="text-[10px] bg-green-600 text-white px-2.5 py-1 rounded-lg">Approve &amp; post</button>
          <button className="text-[10px] text-purple-600 bg-purple-100 px-2.5 py-1 rounded-lg">Edit</button>
        </div>
      </div>
    </div>
  );
}

function AuditPreview() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="8" strokeDasharray="188 251" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-green-600">75</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-900">Profile Score</div>
          <div className="text-[10px] text-gray-400">3 items need attention</div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Description", score: 12, max: 15, color: "bg-green-500" },
          { label: "Photos", score: 5, max: 15, color: "bg-yellow-500" },
          { label: "Posts", score: 8, max: 15, color: "bg-green-500" },
          { label: "Reviews", score: 10, max: 15, color: "bg-red-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-16">{s.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${s.color}`} style={{ width: `${(s.score / s.max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-400">{s.score}/{s.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingPreview() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left">
      <div className="text-xs font-medium text-gray-900 mb-1">Local Pack Ranking</div>
      <div className="text-[10px] text-gray-400 mb-4">&ldquo;italian restaurant downtown&rdquo;</div>
      <div className="flex items-end gap-1 h-28 mb-3">
        {[8, 7, 6, 5, 4, 4, 3, 3, 3, 2, 2, 2].map((rank, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end">
            <div
              className={`w-full rounded-t ${i >= 9 ? "bg-green-500" : i >= 6 ? "bg-blue-400" : "bg-blue-200"}`}
              style={{ height: `${((10 - rank) / 10) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>12 weeks ago</span>
        <span>This week</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-lg font-bold text-green-600">#2</span>
        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑6 positions</span>
      </div>
    </div>
  );
}

// ─── FAQ ────────────────────────────────────────────────────
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need to give GBP Auto full access to my Google account?",
      a: "No. We only request access to manage your Google Business Profile — specifically reading reviews, posting content, and viewing insights. We cannot access your Gmail, Drive, or any other Google service. You can revoke access anytime from your Google account settings.",
    },
    {
      q: "How does the AI generate posts?",
      a: "We use Claude (by Anthropic) to write posts tailored to your business category, location, and previous posting history. Each post is 100–300 characters (Google's engagement sweet spot), and you always review and approve before anything goes live.",
    },
    {
      q: "What if I don't like the AI-generated content?",
      a: "Every post and review response is a draft until you approve it. You can edit, regenerate, or write your own. The AI learns from your edits over time to better match your voice.",
    },
    {
      q: "How is ranking tracked?",
      a: "We check your position in Google Maps search results for the keywords that matter to your business. You'll see weekly trends and can track whether your optimization efforts are actually moving the needle.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. No contracts, no cancellation fees. If you're on the annual plan, you'll keep access through the end of your billing period. We also offer a 7-day free trial with no credit card required.",
    },
    {
      q: "Is this different from a full SEO suite?",
      a: "Intentionally. Tools like BrightLocal or SEMrush serve agencies managing dozens of clients. GBP Auto is built for the business owner who just wants their Google profile handled — the right posts, review responses, and optimization fixes without learning SEO jargon.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-4xl font-bold text-center mb-4">Frequently asked questions</h2>
        <p className="text-center text-gray-600 mb-12">Everything you need to know before getting started.</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Landing Page ──────────────────────────────────────
export default function LandingPage() {
  const [annualBilling, setAnnualBilling] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">GBP Auto</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition rounded px-2 py-1">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition rounded px-2 py-1">Pricing</a>
            <a href="#how" className="hover:text-gray-900 transition rounded px-2 py-1">How it works</a>
            <a href="#faq" className="hover:text-gray-900 transition rounded px-2 py-1">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/auth/google" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 transition rounded px-3 py-2">
              Sign in
            </a>
            <a
              href="/api/auth/google"
              className="hidden sm:inline bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20 font-medium"
            >
              Start free trial
            </a>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
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
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-white">
            Rank higher on Google Maps{" "}
            <span className="bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-200 bg-clip-text text-transparent">without lifting a finger</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            Connect your Google Business Profile and let AI handle weekly posts, review responses, and profile optimization. More visibility, more customers, zero busywork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="/api/auth/google"
              className="group relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/40"
            >
              <span className="relative z-10">Connect your GBP free</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 blur transition"></div>
            </a>
            <a
              href="#how"
              className="text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/10 transition"
            >
              See how it works →
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 text-blue-100">
            <div className="flex -space-x-2">
              {["#4F46E5", "#3B82F6", "#06B6D4", "#10B981"].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {["M", "S", "K", "J"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm">Trusted by local restaurants, dentists, and service pros</span>
          </div>
        </div>
      </section>

      {/* Dashboard Preview — Realistic mockup */}
      <section className="relative -mt-16 mx-auto max-w-5xl px-6 pb-20 z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Optimization Score", value: "87/100", color: "text-emerald-400", icon: "📊" },
              { label: "Posts This Month", value: "4", color: "text-blue-400", icon: "✍️" },
              { label: "Reviews Responded", value: "12/12", color: "text-purple-400", icon: "💬" },
              { label: "Map Ranking", value: "#3 →  #2", color: "text-amber-400", icon: "📈" },
            ].map((s) => (
              <div key={s.label} className="bg-gradient-to-br from-slate-800/80 to-blue-900/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-700/50 to-blue-900/30 rounded-xl p-4 border border-slate-700/30">
              <div className="text-slate-300 text-xs font-medium mb-3">Latest AI post draft</div>
              <div className="bg-slate-800/60 rounded-lg p-3 text-sm text-slate-300 leading-relaxed">
                &ldquo;Fresh pasta made in-house daily — try our new truffle mushroom ravioli this week!&rdquo;
              </div>
              <div className="flex gap-2 mt-3">
                <div className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Approve</div>
                <div className="text-[10px] bg-slate-600/30 text-slate-400 px-2 py-1 rounded">Edit</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-700/50 to-blue-900/30 rounded-xl p-4 border border-slate-700/30">
              <div className="text-slate-300 text-xs font-medium mb-3">Top priority</div>
              <div className="space-y-2">
                {[
                  { text: "Add 5 more photos (exterior + team)", status: "critical" },
                  { text: "Fill in business attributes", status: "warning" },
                  { text: "Weekly posting schedule", status: "done" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.status === "critical" ? "bg-red-400" :
                      item.status === "warning" ? "bg-yellow-400" : "bg-green-400"
                    }`} />
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="bg-gradient-to-b from-white via-blue-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Real results from real businesses</h2>
            <p className="text-gray-600">See what local business owners are saying about GBP Auto</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marco",
                business: "Marco's Italian Kitchen",
                location: "Portland, OR",
                initial: "M",
                color: "bg-blue-600",
                quote: "Started getting 3x more online orders within 2 weeks. The AI posts are so good, I barely have to edit them.",
                metric: "3x more orders",
                rating: 5,
              },
              {
                name: "Dr. Sarah Chen",
                business: "Bright Smiles Dental",
                location: "Austin, TX",
                initial: "S",
                color: "bg-emerald-600",
                quote: "Finally keeping up with review responses without dying of stress. GBP Auto does the heavy lifting.",
                metric: "100% response rate",
                rating: 5,
              },
              {
                name: "Mike Thompson",
                business: "Thompson Plumbing",
                location: "Denver, CO",
                initial: "M",
                color: "bg-amber-600",
                quote: "Went from #8 to #2 in local search. The optimization audit alone paid for a year's subscription.",
                metric: "#8 → #2 ranking",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-block mb-4">
                  {testimonial.metric}
                </div>
                <div className="border-t border-gray-200 pt-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${testimonial.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                    {testimonial.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section — Outcome-first headlines with real previews */}
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

          <div className="space-y-20">
            {/* Feature 1: Post Generation */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="font-bold text-2xl mb-3 text-slate-900">Never stare at a blank post again</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Claude writes engaging posts tailored to your business — weekly specials, tips, seasonal content, product highlights. Review, edit, or auto-publish on a schedule.
                </p>
              </div>
              <div className="flex-1 w-full">
                <PostPreview />
              </div>
            </div>

            {/* Feature 2: Review Responses */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="font-bold text-2xl mb-3 text-slate-900">Respond to every review in seconds</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  New review comes in, AI drafts a thoughtful response instantly. Approve with one click or tweak first. Keep your response rate at 100% without the time sink.
                </p>
              </div>
              <div className="flex-1 w-full">
                <ReviewPreview />
              </div>
            </div>

            {/* Feature 3: Optimization Audit */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold text-2xl mb-3 text-slate-900">Know exactly what&apos;s holding you back</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Instant AI audit of your entire profile — description, photos, categories, attributes, posting frequency, review health. Get a score and a prioritized fix list.
                </p>
              </div>
              <div className="flex-1 w-full">
                <AuditPreview />
              </div>
            </div>

            {/* Feature 4: Ranking Tracker */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="font-bold text-2xl mb-3 text-slate-900">Watch yourself climb the local pack</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Track where you show up in Google Maps for your key search terms. See trends over time. Know if your optimization work is paying off — or if you&apos;re slipping.
                </p>
              </div>
              <div className="flex-1 w-full">
                <RankingPreview />
              </div>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔔",
                title: "Weekly Reports",
                desc: "Every Monday — new reviews, post performance, ranking changes, and where to focus next.",
              },
              {
                icon: "⚡",
                title: "One-Click Actions",
                desc: "Approve posts, respond to reviews, apply fixes — all from your dashboard. No tab switching.",
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
            <div className="hidden md:block absolute left-5 top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200"></div>

            {[
              {
                step: "1",
                title: "Connect your Google Business Profile",
                desc: "Sign in with your Google account. We request access to manage your business profile — read reviews, post content, and view insights. You control everything and can revoke access anytime.",
              },
              {
                step: "2",
                title: "Get your optimization audit instantly",
                desc: "Within seconds, AI analyzes your entire profile — description, photos, posts, reviews, categories, attributes — and gives you a score with a prioritized list of improvements.",
              },
              {
                step: "3",
                title: "Turn on autopilot and watch rankings climb",
                desc: "Approve your first batch of AI-generated posts, set review response preferences, and let GBP Auto handle the rest. Check your dashboard anytime to see progress.",
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
              className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md shadow-blue-600/30 mb-8"
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

      {/* FAQ */}
      <FAQ />

      {/* CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Stop losing customers to competitors with better profiles.
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Your GBP is your digital front door. Make it unforgettable with AI-powered optimization.
          </p>
          <a
            href="/api/auth/google"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/40"
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
              <a href="#" className="text-gray-600 hover:text-gray-900 transition rounded px-2 py-1">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition rounded px-2 py-1">Terms</a>
              <a href="mailto:support@gbpauto.com" className="text-gray-600 hover:text-gray-900 transition rounded px-2 py-1">Support</a>
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

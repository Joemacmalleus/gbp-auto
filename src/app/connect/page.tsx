"use client";

import { useEffect, useState } from "react";

interface Account {
  name: string;
  accountName: string;
}

interface Location {
  name: string;
  title: string;
  address: string;
  phone: string;
  category: string;
}

export default function ConnectPage() {
  const [step, setStep] = useState<"loading" | "select" | "auditing" | "done">("loading");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [auditProgress, setAuditProgress] = useState(0);

  // Load accounts on mount
  useEffect(() => {
    fetch("/api/business/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts || []);
        setStep("select");
      })
      .catch(() => setStep("select"));
  }, []);

  // Load locations when account is selected
  useEffect(() => {
    if (!selectedAccount) return;
    fetch(`/api/business/locations?account=${encodeURIComponent(selectedAccount)}`)
      .then((r) => r.json())
      .then((data) => setLocations(data.locations || []));
  }, [selectedAccount]);

  const connectLocation = async () => {
    if (!selectedLocation) return;
    setStep("auditing");

    // Simulate audit progress
    const interval = setInterval(() => {
      setAuditProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + Math.random() * 15;
      });
    }, 400);

    const res = await fetch("/api/business/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: selectedAccount,
        locationId: selectedLocation,
      }),
    });

    clearInterval(interval);
    setAuditProgress(100);

    if (res.ok) {
      setTimeout(() => setStep("done"), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">G</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">Connect your business</h1>
            <p className="text-sm text-gray-500">
              Select the Google Business Profile you want to optimize
            </p>
          </div>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading your Google Business accounts...</p>
          </div>
        )}

        {/* Select account + location */}
        {step === "select" && (
          <div className="space-y-6">
            {/* Account selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business account
              </label>
              {accounts.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  No Google Business accounts found. Make sure you&apos;re signed in with the
                  Google account that manages your business profile.
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => {
                        setSelectedAccount(a.name);
                        setSelectedLocation(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedAccount === a.name
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">{a.accountName}</div>
                      <div className="text-xs text-gray-500">{a.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location selector */}
            {selectedAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business location
                </label>
                {locations.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    Loading locations...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {locations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => setSelectedLocation(loc.name)}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedLocation === loc.name
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium">{loc.title}</div>
                        <div className="text-xs text-gray-500">
                          {[loc.address, loc.phone, loc.category].filter(Boolean).join(" · ")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Connect button */}
            <button
              onClick={connectLocation}
              disabled={!selectedLocation}
              className={`w-full py-3 rounded-lg font-medium transition ${
                selectedLocation
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Connect &amp; run audit
            </button>
          </div>
        )}

        {/* Auditing */}
        {step === "auditing" && (
          <div className="text-center py-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="8"
                  strokeDasharray={`${auditProgress * 2.51} 251`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{Math.round(auditProgress)}%</span>
              </div>
            </div>
            <h2 className="font-semibold text-lg mb-2">Running AI audit</h2>
            <p className="text-sm text-gray-500">
              Analyzing your profile, reviews, posts, and completeness...
            </p>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-semibold text-lg mb-2">You&apos;re connected!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your optimization audit is ready. Head to your dashboard to see results and start improving.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

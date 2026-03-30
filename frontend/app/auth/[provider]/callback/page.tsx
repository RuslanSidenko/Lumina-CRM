"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/app/actions/auth";
import { API_BASE } from "@/app/config";

export default function OAuthCallback() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Some nextjs setups make params a Promise, but usually it works directly in Client components.
    // If provider is missing, it skips.
    const run = async () => {
      // In Next.js 15+ sometimes params is a promise even in client components
      const unwrappedParams = params instanceof Promise ? await params : params;
      const provider = unwrappedParams?.provider as string;
      const code = searchParams.get("code");

      if (!provider || !code) {
        setError("Missing provider or authorization code.");
        return;
      }

      try {
        const token = await getAccessToken();
        if (!token) {
          setError("You must be logged in to connect your calendar.");
          return;
        }

        const res = await fetch(`${API_BASE}/api/v1/meetings/callback/${provider}?code=${encodeURIComponent(code)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setStatus("Successfully connected! You can close this window.");
          // Close the popup so the parent window's interval detects it and updates the UI
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to connect calendar.");
        }
      } catch (err) {
        setError("An unexpected error occurred while connecting.");
      }
    };

    run();
  }, [params, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white font-sans p-4">
      <div className="bg-[#161b22] p-8 rounded-2xl shadow-2xl border border-[#30363d] max-w-sm w-full text-center">
        {error ? (
          <div>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-sm text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.close()}
              className="px-6 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors border border-[#30363d] w-full font-medium"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold mb-2">{status}</h2>
            <p className="text-gray-400 text-sm">Please wait while we finalize your connection...</p>
          </div>
        )}
      </div>
    </div>
  );
}

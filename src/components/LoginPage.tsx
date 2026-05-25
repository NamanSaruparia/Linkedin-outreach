import { ArrowRight, MessageSquareText, Smartphone } from "lucide-react";
import { useState } from "react";
import { formatMobileDisplay } from "../lib/auth";
import { PRIMARY_MOBILE } from "../lib/config";
import { inputClass } from "./ui";

interface LoginPageProps {
  onLogin: (mobile: string) => Promise<boolean>;
  loginError: string | null;
  loggingIn: boolean;
  recentUsers: string[];
}

export function LoginPage({
  onLogin,
  loginError,
  loggingIn,
  recentUsers,
}: LoginPageProps) {
  const [mobile, setMobile] = useState(PRIMARY_MOBILE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(mobile);
  };

  const quickLogin = async (m: string) => {
    setMobile(m);
    await onLogin(m);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0a66c2] flex items-center justify-center mx-auto shadow-lg shadow-[#0a66c2]/20">
            <MessageSquareText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-5 tracking-tight">
            LinkedIn Outreach
          </h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Open for everyone. Enter your mobile number — we save your progress
            under that number. No password, no approval.
          </p>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Your mobile number
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600 font-medium shrink-0">
                  +91
                </span>
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="98765 43210"
                    className={`${inputClass} pl-10`}
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Your progress on this browser will link to this number in the
                cloud
              </p>
            </div>

            {loginError && (
              <div
                role="alert"
                className="text-sm text-rose-800 bg-rose-50 border-2 border-rose-200 rounded-xl px-4 py-3 font-medium"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={mobile.length < 10 || loggingIn}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0a66c2] text-white font-medium text-sm hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loggingIn ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loggingIn ? "Loading your data…" : "Continue"}
            </button>
          </form>

          {recentUsers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <p className="text-xs font-medium text-zinc-500 mb-3">
                Used recently on this browser
              </p>
              <div className="flex flex-wrap gap-2">
                {recentUsers.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => quickLogin(m)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:border-[#0a66c2]/40 hover:bg-[#0a66c2]/5 transition-colors"
                  >
                    {formatMobileDisplay(m)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6 leading-relaxed">
          Friend A and Friend B can both use this link with different numbers —
          each gets their own data in the cloud.
        </p>
        {!import.meta.env.DEV && (
          <p className="text-center text-xs text-zinc-400 mt-2">
            API check:{" "}
            <a
              href={`${window.location.origin}/api/health`}
              target="_blank"
              rel="noreferrer"
              className="text-[#0a66c2] underline"
            >
              {window.location.origin}/api/health
            </a>
            {" "}(should show JSON, not 404)
          </p>
        )}
      </div>
    </div>
  );
}

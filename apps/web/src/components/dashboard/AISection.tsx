"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertCircle, Utensils, Dumbbell, Pill, HeartPulse, ShieldAlert, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { getAIHealthInsights, type AIHealthInsight, type AIHealthInsightsResponse } from "@/actions/dashboard";
import { getProviders } from "@/lib/ai/providers";

const categoryConfig = {
  NUTRITION: {
    icon: Utensils,
    label: "Nutrition",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    link: "/dashboard/diet",
  },
  EXERCISE: {
    icon: Dumbbell,
    label: "Fitness",
    badge: "bg-blue-500/20 text-blue-200 border-blue-400/30",
    link: "/dashboard/exercise",
  },
  MEDICATION: {
    icon: Pill,
    label: "Medication",
    badge: "bg-purple-500/20 text-purple-200 border-purple-400/30",
    link: "/dashboard/medicine",
  },
  WELLNESS: {
    icon: HeartPulse,
    label: "Wellness",
    badge: "bg-teal-500/20 text-teal-200 border-teal-400/30",
    link: "/dashboard/health-diary",
  },
  ALERT: {
    icon: ShieldAlert,
    label: "Advisory",
    badge: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    link: "/dashboard/metabolic-risk",
  },
};

export function AISection() {
  const [data, setData] = useState<AIHealthInsightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const providers = getProviders();
      const rawProvidersJson = JSON.stringify(providers);
      const res = await getAIHealthInsights(rawProvidersJson);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to generate AI recommendations";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--teal-900)] via-[#0e3b33] to-[var(--teal-800)] p-6 md:p-8 shadow-lg border border-[var(--teal-700)] text-white">
      {/* Decorative gradient blur blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl md:text-2xl text-white font-semibold tracking-tight">
                AI Health Insights &amp; Recommendations
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 font-medium">
                Live Intelligence
              </span>
            </div>
            <p className="font-body text-emerald-100/75 text-xs md:text-sm mt-0.5 max-w-2xl leading-relaxed">
              Personalized guidance derived from your diet, activity logs, metabolic tier, and medication routine.
            </p>
          </div>
        </div>

        {/* Actions & Provider Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {data?.providerUsed && (
            <span className="text-[11px] font-mono text-emerald-200/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm hidden sm:inline-block">
              Engine: <strong className="text-emerald-200 font-semibold">{data.providerUsed}</strong>
            </span>
          )}
          <button
            onClick={() => fetchInsights(true)}
            disabled={loading || refreshing}
            title="Refresh recommendations"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-300" : ""}`} />
            <span>{refreshing ? "Analyzing..." : "Re-analyze"}</span>
          </button>
          <Link
            href="/dashboard/ai-config"
            title="Manage AI Model & Keys"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white transition-all"
          >
            <Settings2 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse space-y-2.5">
                <div className="h-4 w-20 bg-white/20 rounded" />
                <div className="h-5 w-3/4 bg-white/30 rounded" />
                <div className="h-10 w-full bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-400/20 flex items-start gap-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-100">Unable to load AI Insights</p>
              <p className="text-xs text-rose-200/80 mt-0.5">{error}</p>
            </div>
          </div>
        ) : data && data.insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.insights.map((insight: AIHealthInsight) => {
              const cfg = categoryConfig[insight.category] || categoryConfig.WELLNESS;
              const Icon = cfg.icon;

              return (
                <div
                  key={insight.id}
                  className="group relative flex flex-col justify-between p-5 rounded-xl bg-white/10 hover:bg-white/[0.14] border border-white/15 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div>
                    {/* Top Row: Category & Priority */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${cfg.badge}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {insight.importance === "HIGH" && (
                        <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.5 rounded">
                          Priority
                        </span>
                      )}
                    </div>

                    {/* Title & Summary */}
                    <h4 className="font-display font-semibold text-sm text-white group-hover:text-emerald-200 transition-colors">
                      {insight.title}
                    </h4>
                    <p className="font-body text-xs text-emerald-100/85 mt-1.5 leading-relaxed">
                      {insight.summary}
                    </p>
                  </div>

                  {/* Actionable Step Footer */}
                  {insight.actionableStep && (
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-200/90 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{insight.actionableStep}</span>
                      </div>
                      <Link
                        href={cfg.link}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-emerald-300 hover:text-white"
                        title={`Open ${cfg.label}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-emerald-100/70 text-sm">
            No health insights generated yet. Add your daily meals, workouts, or symptoms to trigger tailored AI guidance.
          </div>
        )}
      </div>
    </div>
  );
}

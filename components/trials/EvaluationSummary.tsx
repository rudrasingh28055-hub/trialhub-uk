"use client";

import { motion } from "framer-motion";
import type { TrialEvaluation } from "../../lib/trials/types";

interface EvaluationSummaryProps {
  evaluation: TrialEvaluation;
}

const recommendationLabels: Record<string, { label: string; color: string }> = {
  offer_contract: { label: 'Contract Offered', color: 'text-emerald-400 bg-emerald-500/10' },
  invite_academy: { label: 'Academy Invite', color: 'text-violet-400 bg-violet-500/10' },
  watch_list: { label: 'Watch List', color: 'text-sky-400 bg-sky-500/10' },
  re_trial: { label: 'Future Trial', color: 'text-amber-400 bg-amber-500/10' },
  reject: { label: 'Not Selected', color: 'text-slate-400 bg-slate-500/10' },
};

export function EvaluationSummary({ evaluation }: EvaluationSummaryProps) {
  const rec = recommendationLabels[evaluation.recommendation];

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-xl font-bold text-white">
            {evaluation.profiles?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{evaluation.profiles?.full_name || 'Unknown'}</h3>
            <p className="text-sm text-slate-400">
              Evaluated on {new Date(evaluation.evaluated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${rec.color}`}>
          {rec.label}
        </span>
      </div>

      {/* Score */}
      <div className="rounded-xl bg-slate-900/50 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Overall Score</p>
            <p className="text-3xl font-black text-white">{evaluation.percentage_score}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Points</p>
            <p className="text-xl font-bold text-white">{evaluation.total_score}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Category Scores</h4>
        {Object.entries(evaluation.evaluation_data).map(([category, score]) => (
          <div key={category} className="flex items-center justify-between">
            <span className="text-sm text-slate-300 capitalize">{category}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm text-white w-8">{score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Development */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((strength: string, i: number) => (
                <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400">+</span> {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {evaluation.development_areas && evaluation.development_areas.length > 0 && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
            <h4 className="text-sm font-semibold text-amber-300 mb-2">Development Areas</h4>
            <ul className="space-y-1">
              {evaluation.development_areas.map((area: string, i: number) => (
                <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-amber-400">→</span> {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Notes */}
      {evaluation.notes && (
        <div className="rounded-xl bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Notes</h4>
          <p className="text-sm text-slate-400">{evaluation.notes}</p>
        </div>
      )}
    </div>
  );
}

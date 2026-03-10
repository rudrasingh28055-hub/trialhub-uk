"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { EvaluationTemplate, EvaluationRecommendation, EvaluationCriterion } from "../../lib/trials/types";

interface ScorecardFormProps {
  template: EvaluationTemplate;
  athleteName: string;
  athleteProfileId: string;
  trialEventId: string;
  onSubmit: (data: {
    scores: Record<string, number>;
    strengths: string[];
    developmentAreas: string[];
    recommendation: EvaluationRecommendation;
    notes: string;
  }) => Promise<void>;
}

const recommendationOptions: { value: EvaluationRecommendation; label: string; color: string }[] = [
  { value: 'offer_contract', label: 'Offer Contract', color: 'from-emerald-500 to-green-500' },
  { value: 'invite_academy', label: 'Invite to Academy', color: 'from-violet-500 to-purple-500' },
  { value: 'watch_list', label: 'Add to Watch List', color: 'from-sky-500 to-blue-500' },
  { value: 're_trial', label: 'Invite to Future Trial', color: 'from-amber-500 to-orange-500' },
  { value: 'reject', label: 'Not Suitable', color: 'from-slate-600 to-slate-500' },
];

export function ScorecardForm({ 
  template, 
  athleteName,
  onSubmit 
}: ScorecardFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState<string[]>([]);
  const [developmentAreas, setDevelopmentAreas] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<EvaluationRecommendation | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group criteria by category
  const criteriaByCategory = template.criteria.reduce((acc: Record<string, EvaluationCriterion[]>, criterion: EvaluationCriterion) => {
    if (!acc[criterion.category]) acc[criterion.category] = [];
    acc[criterion.category].push(criterion);
    return acc;
  }, {});

  const handleScoreChange = (criterionId: string, score: number, maxScore: number) => {
    setScores(prev => ({ ...prev, [criterionId]: Math.min(maxScore, Math.max(0, score)) }));
  };

  const calculateCategoryScore = (category: string) => {
    const categoryCriteria: EvaluationCriterion[] = criteriaByCategory[category] || [];
    const categoryScores: number[] = categoryCriteria.map((c: EvaluationCriterion) => scores[c.name] || 0);
    const total: number = categoryScores.reduce((a: number, b: number) => a + b, 0);
    const max: number = template.max_score_per_category[category] || 0;
    return { total, max, percentage: max > 0 ? Math.round((total / max) * 100) : 0 };
  };

  const calculateTotalScore = () => {
    const total: number = Object.values(scores).reduce((a: number, b: number) => a + b, 0);
    return { total, max: template.total_max_score, percentage: Math.round((total / template.total_max_score) * 100) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendation) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        scores,
        strengths,
        developmentAreas,
        recommendation,
        notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalScore = calculateTotalScore();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-blue-500/10 p-6">
        <h3 className="text-xl font-bold text-white">Evaluation Scorecard</h3>
        <p className="text-sm text-slate-400 mt-1">
          Evaluating: <span className="text-sky-300 font-medium">{athleteName}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Template: {template.name}
        </p>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {template.categories.map((category: string) => {
          const { total, max, percentage } = calculateCategoryScore(category);
          return (
            <div key={category} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{category}</p>
              <p className="text-2xl font-black text-white mt-1">{total}/{max}</p>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Score */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Total Score</p>
            <p className="text-4xl font-black text-white">{totalScore.total}/{totalScore.max}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Percentage</p>
            <p className={`text-3xl font-black ${
              totalScore.percentage >= 80 ? 'text-emerald-400' :
              totalScore.percentage >= 60 ? 'text-sky-400' :
              totalScore.percentage >= 40 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {totalScore.percentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Criteria Scoring */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-white">Scoring Criteria</h4>
        
        {Object.entries(criteriaByCategory).map(([category, criteria]: [string, EvaluationCriterion[]]) => (
          <div key={category} className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h5 className="text-sm font-semibold text-sky-300 uppercase tracking-wider mb-4">
              {category}
            </h5>
            
            <div className="space-y-4">
              {criteria.map((criterion: EvaluationCriterion) => (
                <div key={criterion.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{criterion.name}</p>
                      {criterion.description && (
                        <p className="text-xs text-slate-500">{criterion.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={criterion.max_score}
                        value={scores[criterion.name] || 0}
                        onChange={(e) => handleScoreChange(criterion.name, parseInt(e.target.value) || 0, criterion.max_score)}
                        className="w-16 text-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 
                          text-white text-sm focus:border-sky-500/50 focus:outline-none"
                      />
                      <span className="text-sm text-slate-400">/ {criterion.max_score}</span>
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={criterion.max_score}
                    value={scores[criterion.name] || 0}
                    onChange={(e) => handleScoreChange(criterion.name, parseInt(e.target.value), criterion.max_score)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Development Areas */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-4">
            Key Strengths
          </h4>
          <TagInput
            tags={strengths}
            onChange={setStrengths}
            placeholder="Add a strength..."
            color="emerald"
          />
        </div>
        
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-6">
          <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-4">
            Development Areas
          </h4>
          <TagInput
            tags={developmentAreas}
            onChange={setDevelopmentAreas}
            placeholder="Add an area for improvement..."
            color="amber"
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Recommendation</h4>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {recommendationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRecommendation(option.value)}
              className={`rounded-xl p-4 text-center transition-all ${
                recommendation === option.value
                  ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Additional Notes
        </h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 
            text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
          placeholder="Any additional observations or notes about the athlete's performance..."
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !recommendation}
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 
            text-sm font-bold text-white shadow-lg shadow-sky-500/25 
            transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Evaluation"}
        </button>
        
        {!recommendation && (
          <p className="text-sm text-amber-400">Please select a recommendation to submit</p>
        )}
      </div>
    </form>
  );
}

// Tag Input Component
function TagInput({ 
  tags, 
  onChange, 
  placeholder,
  color 
}: { 
  tags: string[]; 
  onChange: (tags: string[]) => void; 
  placeholder: string;
  color: 'emerald' | 'amber';
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onChange([...tags, input.trim()]);
      setInput("");
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-white/10 bg-white/5 min-h-[80px]">
      {tags.map((tag, i) => (
        <span 
          key={i} 
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${colorClasses[color]}`}
        >
          {tag}
          <button 
            onClick={() => removeTag(i)}
            className="hover:text-white transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
      />
    </div>
  );
}

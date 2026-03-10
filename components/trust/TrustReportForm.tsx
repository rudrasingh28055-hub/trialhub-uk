"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReportType } from "../../lib/verifications/types";

interface TrustReportFormProps {
  reportedEntityType: 'club' | 'opportunity' | 'profile' | 'message' | 'agent';
  reportedEntityId: string;
  reportedEntityName?: string;
  onSubmit: (data: {
    reportType: ReportType;
    description: string;
    evidenceUrls?: string[];
  }) => Promise<void>;
  onClose: () => void;
}

const reportTypes: { type: ReportType; label: string; description: string; priority: 'high' | 'medium' | 'low' }[] = [
  {
    type: 'fake_opportunity',
    label: 'Fake Opportunity',
    description: 'The opportunity or trial does not exist or is fraudulent',
    priority: 'high',
  },
  {
    type: 'suspicious_agent',
    label: 'Suspicious Agent/Recruiter',
    description: 'Someone claiming to be an agent or recruiter with suspicious behavior',
    priority: 'high',
  },
  {
    type: 'misrepresentation',
    label: 'Misrepresentation',
    description: 'False information about club, identity, or credentials',
    priority: 'medium',
  },
  {
    type: 'inappropriate_behavior',
    label: 'Inappropriate Behavior',
    description: 'Unprofessional conduct or harassment',
    priority: 'high',
  },
  {
    type: 'safeguarding_concern',
    label: 'Safeguarding Concern',
    description: 'Concerns about child safety or welfare (immediate priority)',
    priority: 'high',
  },
  {
    type: 'spam',
    label: 'Spam',
    description: 'Unsolicited messages or promotional content',
    priority: 'low',
  },
  {
    type: 'other',
    label: 'Other',
    description: 'Something else not covered above',
    priority: 'medium',
  },
];

export function TrustReportForm({
  reportedEntityType,
  reportedEntityId,
  reportedEntityName,
  onSubmit,
  onClose,
}: TrustReportFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedReportType = reportTypes.find(t => t.type === selectedType);

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        reportType: selectedType,
        description: description.trim(),
        evidenceUrls: [], // Could add file upload support
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
        <p className="text-slate-400 mb-6">
          Thank you for helping keep AthLink safe. Our trust team will review your report within 24 hours.
        </p>
        <button
          onClick={onClose}
          className="rounded-lg bg-white/10 px-6 py-2 text-white font-medium hover:bg-white/20 transition-colors"
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Report {reportedEntityName || 'Content'}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? 'bg-sky-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Report Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-slate-400 mb-4">What type of issue are you reporting?</p>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => setSelectedType(type.type)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedType === type.type
                      ? 'border-sky-400/50 bg-sky-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{type.label}</span>
                        {type.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{type.description}</p>
                    </div>
                    {selectedType === type.type && (
                      <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedType && setStep(2)}
              disabled={!selectedType}
              className="w-full mt-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-white font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-sm">
                {selectedReportType?.label}
              </span>
            </div>
            
            <p className="text-slate-400 mb-4">
              Please provide details about the issue. The more information you provide, 
              the better we can investigate.
            </p>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
              placeholder="Describe what happened, when it occurred, and any other relevant details..."
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-white font-medium hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={() => description.trim() && setStep(3)}
                disabled={!description.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-white font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => setStep(2)}
              className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Report Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-white">{selectedReportType?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority:</span>
                  <span className={`capitalize ${
                    selectedReportType?.priority === 'high' ? 'text-red-400' :
                    selectedReportType?.priority === 'medium' ? 'text-amber-400' :
                    'text-slate-400'
                  }`}>
                    {selectedReportType?.priority}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-slate-500 block mb-1">Description:</span>
                  <p className="text-white">{description}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 mb-6">
              <p className="text-sm text-amber-300">
                <strong>Important:</strong> False reports can result in account suspension. 
                Please ensure your report is accurate and made in good faith.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 text-white font-medium hover:bg-white/10"
              >
                Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 py-3 text-white font-semibold disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

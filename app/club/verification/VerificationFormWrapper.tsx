"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { submitClubVerification } from "../../../lib/verifications/actions";
import type { ClubVerification, ClubVerificationInput } from "../../../lib/verifications/types";

interface VerificationFormWrapperProps {
  clubProfileId: string;
  existingVerification: ClubVerification | null;
}

export function VerificationFormWrapper({ 
  clubProfileId, 
  existingVerification 
}: VerificationFormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    const input: ClubVerificationInput = {
      legal_entity_name: formData.get("legal_entity_name") as string || undefined,
      registration_number: formData.get("registration_number") as string || undefined,
      website: formData.get("website") as string || undefined,
      year_established: formData.get("year_established") ? 
        parseInt(formData.get("year_established") as string) : undefined,
      primary_contact_name: formData.get("primary_contact_name") as string,
      contact_email: formData.get("contact_email") as string,
      contact_phone: formData.get("contact_phone") as string || undefined,
      safeguarding_officer_name: formData.get("safeguarding_officer_name") as string || undefined,
      safeguarding_officer_email: formData.get("safeguarding_officer_email") as string || undefined,
      safeguarding_officer_phone: formData.get("safeguarding_officer_phone") as string || undefined,
      facilities_address: formData.get("facilities_address") as string || undefined,
      facilities_postcode: formData.get("facilities_postcode") as string || undefined,
      facilities_description: formData.get("facilities_description") as string || undefined,
      insurance_provider: formData.get("insurance_provider") as string || undefined,
      insurance_policy_number: formData.get("insurance_policy_number") as string || undefined,
      insurance_expiry: formData.get("insurance_expiry") as string || undefined,
      insurance_coverage_amount: formData.get("insurance_coverage_amount") ? 
        parseInt(formData.get("insurance_coverage_amount") as string) : undefined,
    };

    try {
      const result = await submitClubVerification(clubProfileId, input);
      
      if (!result.success) {
        setError(result.error || "Failed to submit verification");
      } else {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [clubProfileId]);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
          ✓
        </div>
        <h4 className="text-lg font-bold text-white">Application Submitted!</h4>
        <p className="mt-2 text-sm text-slate-400">
          Your verification application has been received. Our team will review it within 2-3 business days.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </motion.div>
      )}

      {/* Legal Entity Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Legal Entity Information
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Legal Entity Name <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              name="legal_entity_name"
              defaultValue={existingVerification?.legal_entity_name || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., Manchester United Football Club Ltd"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Registration Number <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              name="registration_number"
              defaultValue={existingVerification?.registration_number || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Company registration number"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Website <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="url"
              name="website"
              defaultValue={existingVerification?.website || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="https://www.yourclub.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Year Established <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="number"
              name="year_established"
              min="1800"
              max={new Date().getFullYear()}
              defaultValue={existingVerification?.year_established || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 1878"
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Primary Contact <span className="text-amber-400">*</span>
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contact Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              name="primary_contact_name"
              required
              defaultValue={existingVerification?.primary_contact_name || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Full name of primary contact"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contact Email <span className="text-amber-400">*</span>
            </label>
            <input
              type="email"
              name="contact_email"
              required
              defaultValue={existingVerification?.contact_email || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="contact@yourclub.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Contact Phone <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            type="tel"
            name="contact_phone"
            defaultValue={existingVerification?.contact_phone || ""}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
              focus:outline-none focus:ring-2 focus:ring-sky-500/20 md:w-1/2"
            placeholder="+44 123 456 7890"
          />
        </div>
      </div>

      {/* Safeguarding Officer */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Safeguarding Officer <span className="text-slate-500">(Optional)</span>
        </h4>
        
        <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4 mb-4">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">Recommended for youth clubs:</span> Designating a 
            safeguarding officer demonstrates your commitment to athlete welfare and can 
            improve your verification tier.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Officer Name
            </label>
            <input
              type="text"
              name="safeguarding_officer_name"
              defaultValue={existingVerification?.safeguarding_officer_name || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Full name of safeguarding officer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Officer Email
            </label>
            <input
              type="email"
              name="safeguarding_officer_email"
              defaultValue={existingVerification?.safeguarding_officer_email || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="safeguarding@yourclub.com"
            />
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Facilities Information <span className="text-slate-500">(Optional)</span>
        </h4>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Facilities Address
          </label>
          <textarea
            name="facilities_address"
            rows={2}
            defaultValue={existingVerification?.facilities_address || ""}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
              focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="Training ground address"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Postcode
            </label>
            <input
              type="text"
              name="facilities_postcode"
              defaultValue={existingVerification?.facilities_postcode || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="SW1A 1AA"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Facilities Description
            </label>
            <input
              type="text"
              name="facilities_description"
              defaultValue={existingVerification?.facilities_description || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 3 full-size pitches, indoor facility"
            />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Insurance Information <span className="text-slate-500">(Optional)</span>
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Insurance Provider
            </label>
            <input
              type="text"
              name="insurance_provider"
              defaultValue={existingVerification?.insurance_provider || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., Marsh Sport"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Policy Number
            </label>
            <input
              type="text"
              name="insurance_policy_number"
              defaultValue={existingVerification?.insurance_policy_number || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Policy reference number"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              name="insurance_expiry"
              defaultValue={existingVerification?.insurance_expiry || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Coverage Amount (GBP)
            </label>
            <input
              type="number"
              name="insurance_coverage_amount"
              min="0"
              step="1000"
              defaultValue={existingVerification?.insurance_coverage_amount || ""}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 
                focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 5000000"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 
            px-8 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 
            transition-all hover:shadow-xl hover:shadow-sky-500/30 
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : existingVerification ? (
            "Update Application"
          ) : (
            "Submit for Verification"
          )}
        </button>
        
        <p className="mt-4 text-xs text-slate-500">
          By submitting, you confirm that all information provided is accurate and truthful. 
          False information may result in verification rejection and account suspension.
        </p>
      </div>
    </form>
  );
}

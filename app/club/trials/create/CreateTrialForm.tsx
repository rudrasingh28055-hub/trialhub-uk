"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CreateTrialFormProps {
  clubProfileId: string;
}

export function CreateTrialForm({ clubProfileId }: CreateTrialFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as 'open' | 'invite_only' | 'academy',
      date: formData.get("date") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      location_address: formData.get("location_address") as string,
      age_eligibility: {
        min: formData.get("age_min") ? parseInt(formData.get("age_min") as string) : undefined,
        max: formData.get("age_max") ? parseInt(formData.get("age_max") as string) : undefined,
      },
      positions_needed: (formData.get("positions") as string)?.split(",").map(p => p.trim()).filter(Boolean),
      capacity_total: parseInt(formData.get("capacity") as string),
      registration_opens_at: formData.get("registration_opens") as string || undefined,
      registration_closes_at: formData.get("registration_closes") as string || undefined,
      requires_passport: formData.get("requires_passport") === "on",
      requires_verified_identity: formData.get("requires_verified") === "on",
    };

    try {
      const response = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubProfileId, ...data }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create trial");
      }

      const result = await response.json();
      router.push(`/club/trials/${result.trial.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </motion.div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Trial Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="e.g., Under-18 Academy Trial Day"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="Describe the trial format, what athletes should expect, what to bring..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Trial Type <span className="text-red-400">*</span>
          </label>
          <select
            name="type"
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="open">Open Trial - Anyone can register</option>
            <option value="invite_only">Invite Only - By invitation only</option>
            <option value="academy">Academy - For academy prospects</option>
          </select>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white">Schedule</h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Start Time <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              name="start_time"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              End Time <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              name="end_time"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>

      {/* Location & Eligibility */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white">Location & Eligibility</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Location Address
          </label>
          <input
            type="text"
            name="location_address"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="Full address of the trial venue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Minimum Age
            </label>
            <input
              type="number"
              name="age_min"
              min="5"
              max="50"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 16"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Maximum Age
            </label>
            <input
              type="number"
              name="age_max"
              min="5"
              max="50"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 21"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Positions Needed (comma-separated)
          </label>
          <input
            type="text"
            name="positions"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
              text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            placeholder="e.g., Striker, Winger, Centre-back"
          />
        </div>
      </div>

      {/* Capacity & Registration */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white">Capacity & Registration</h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Total Capacity <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              required
              min="1"
              max="500"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., 30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Registration Opens
            </label>
            <input
              type="datetime-local"
              name="registration_opens"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Registration Closes
            </label>
            <input
              type="datetime-local"
              name="registration_closes"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 
                text-white focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white">Requirements</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="requires_passport"
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-sky-500 focus:ring-sky-500/20"
            />
            <div>
              <span className="text-sm font-medium text-white">Require AthLink Passport</span>
              <p className="text-xs text-slate-400">Athletes must have an active passport to register</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="requires_verified"
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-sky-500 focus:ring-sky-500/20"
            />
            <div>
              <span className="text-sm font-medium text-white">Require Verified Identity</span>
              <p className="text-xs text-slate-400">Only athletes with verified identity can register</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-6 border-t border-white/10">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 
              text-sm font-bold text-white shadow-lg shadow-sky-500/25 
              transition-all hover:shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Trial Event"}
          </button>
          
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 
              text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <p className="mt-4 text-xs text-slate-500">
          The trial will be created as a draft. You can publish it once you're ready to open registration.
        </p>
      </div>
    </form>
  );
}

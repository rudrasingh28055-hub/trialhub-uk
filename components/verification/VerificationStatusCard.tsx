"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { VerificationBadge, TrustScoreMeter, TrustIndicator } from "./VerificationBadge";
import type { 
  ClubVerification, 
  ClubTrustScore, 
  ClubVerificationInput,
  VerificationDocument,
  DocumentType
} from "../../lib/verifications/types";

interface VerificationStatusCardProps {
  verification: ClubVerification | null;
  trustScore: ClubTrustScore | null;
  isOwner: boolean;
  clubProfileId?: string;
}

const documentTypeLabels: Record<DocumentType, string> = {
  registration_certificate: "Club Registration Certificate",
  insurance_certificate: "Insurance Certificate",
  safeguarding_policy: "Safeguarding Policy",
  facility_photos: "Facility Photos",
  dbs_checks: "DBS Checks",
  club_constitution: "Club Constitution",
  fa_affiliation: "FA Affiliation",
  risk_assessment: "Risk Assessment",
};

export function VerificationStatusCard({ 
  verification, 
  trustScore, 
  isOwner,
  clubProfileId 
}: VerificationStatusCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!verification) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">
            ⚠️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Not Verified</h3>
            <p className="mt-1 text-sm text-slate-400">
              This club has not completed the verification process. 
              Verified clubs show higher commitment to athlete safety and professionalism.
            </p>
            {isOwner && clubProfileId && (
              <Link
                href="/club/verification"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r 
                  from-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white 
                  transition-all hover:shadow-lg hover:shadow-sky-500/25"
              >
                Start Verification
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isPending = verification.verification_status === 'pending';
  const isVerified = verification.verification_status === 'verified';
  const isRejected = verification.verification_status === 'rejected';

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 
      p-6 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <VerificationBadge 
            tier={verification.verification_tier} 
            status={verification.verification_status}
            size="md"
          />
          {trustScore && (
            <TrustScoreMeter score={trustScore.overall_score} size="sm" />
          )}
        </div>
        
        {isOwner && (
          <Link
            href="/club/verification"
            className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
          >
            Manage →
          </Link>
        )}
      </div>

      {/* Status Message */}
      <div className="mt-4">
        {isPending && (
          <div className="flex items-center gap-2 text-amber-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            <span className="text-sm">Verification under review. Typically takes 2-3 business days.</span>
          </div>
        )}
        {isVerified && (
          <div className="flex items-center gap-2 text-emerald-300">
            <VerifiedCheckmark verified size="sm" />
            <span className="text-sm">Verified since {new Date(verification.verified_at!).toLocaleDateString()}</span>
          </div>
        )}
        {isRejected && (
          <div className="text-red-300 text-sm">
            Verification rejected. {verification.reviewer_notes && (
              <span className="text-slate-400">Reason: {verification.reviewer_notes}</span>
            )}
          </div>
        )}
      </div>

      {/* Trust Indicators */}
      {trustScore && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TrustIndicator 
            label="Identity Verified" 
            verified={verification.verification_status === 'verified'}
            tooltip="Club identity has been verified by AthLink"
          />
          <TrustIndicator 
            label="Insurance Active" 
            verified={!!verification.insurance_expiry && new Date(verification.insurance_expiry) > new Date()}
            tooltip="Current liability insurance verified"
          />
          <TrustIndicator 
            label="Safeguarding" 
            verified={!!verification.safeguarding_officer_name}
            tooltip="Designated safeguarding officer assigned"
          />
          <TrustIndicator 
            label="Facilities Verified" 
            verified={verification.facilities_verified}
            tooltip="Training facilities have been verified"
          />
        </div>
      )}

      {/* Documents Summary */}
      {verification.submitted_documents && verification.submitted_documents.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 
              hover:text-white transition-colors"
          >
            <span>Submitted Documents ({verification.submitted_documents.length})</span>
            <svg 
              className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2"
            >
              {verification.submitted_documents.map((doc: VerificationDocument) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 
                    border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <DocumentStatusIcon status={doc.verification_status} />
                    <span className="text-sm text-slate-300">
                      {documentTypeLabels[doc.document_type as DocumentType]}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.verification_status === 'verified' 
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : doc.verification_status === 'rejected'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {doc.verification_status}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Badge Expiry Warning */}
      {verification.badge_expires_at && new Date(verification.badge_expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verification expires {new Date(verification.badge_expires_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentStatusIcon({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}

function VerifiedCheckmark({ verified, size = "md" }: { verified: boolean; size?: "sm" | "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  if (!verified) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-slate-600/50 flex items-center justify-center`}>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-emerald-500 flex items-center justify-center`}>
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

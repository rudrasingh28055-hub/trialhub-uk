"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VerificationDocument, DocumentType } from "../../lib/verifications/types";

interface DocumentUploadProps {
  verificationId: string;
  existingDocuments: VerificationDocument[];
  onUpload: (type: DocumentType, file: File) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  disabled?: boolean;
}

const documentTypes: { type: DocumentType; label: string; required: boolean; description: string }[] = [
  {
    type: "registration_certificate",
    label: "Club Registration Certificate",
    required: true,
    description: "Official certificate of registration with relevant football association",
  },
  {
    type: "insurance_certificate",
    label: "Public Liability Insurance",
    required: true,
    description: "Current insurance certificate covering athlete activities",
  },
  {
    type: "safeguarding_policy",
    label: "Safeguarding Policy",
    required: true,
    description: "Document outlining your safeguarding procedures for young athletes",
  },
  {
    type: "dbs_checks",
    label: "DBS/Police Checks",
    required: true,
    description: "Enhanced DBS checks for coaches and staff working with youth",
  },
  {
    type: "fa_affiliation",
    label: "FA/League Affiliation",
    required: false,
    description: "Proof of affiliation with FA or relevant league association",
  },
  {
    type: "facility_photos",
    label: "Facility Photos",
    required: false,
    description: "Recent photos of training facilities, pitches, and changing rooms",
  },
  {
    type: "club_constitution",
    label: "Club Constitution",
    required: false,
    description: "Club governing documents and constitution",
  },
  {
    type: "risk_assessment",
    label: "Risk Assessment",
    required: false,
    description: "Facility and activity risk assessments",
  },
];

export function DocumentUpload({
  verificationId,
  existingDocuments,
  onUpload,
  onDelete,
  disabled = false,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (type: DocumentType, file: File) => {
    if (!file) return;
    
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }
    
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPEG, PNG, and WebP files are allowed");
      return;
    }
    
    setError(null);
    setUploading(type);
    
    try {
      await onUpload(type, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }, [onUpload]);

  const handleDelete = useCallback(async (docId: string) => {
    setDeleting(docId);
    try {
      await onDelete(docId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }, [onDelete]);

  const getDocumentForType = (type: DocumentType) => {
    return existingDocuments.find((d) => d.document_type === type);
  };

  const requiredCount = documentTypes.filter((d) => d.required).length;
  const uploadedRequiredCount = documentTypes.filter(
    (d) => d.required && getDocumentForType(d.type)
  ).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            Required Documents
          </span>
          <span className="text-sm font-bold text-white">
            {uploadedRequiredCount}/{requiredCount}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${(uploadedRequiredCount / requiredCount) * 100}%` }}
          />
        </div>
        {uploadedRequiredCount === requiredCount && (
          <p className="mt-2 text-sm text-emerald-400 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All required documents uploaded
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </motion.div>
      )}

      {/* Document List */}
      <div className="grid gap-3">
        {documentTypes.map((docType) => {
          const existingDoc = getDocumentForType(docType.type);
          const isUploading = uploading === docType.type;

          return (
            <motion.div
              key={docType.type}
              layout
              className={`rounded-xl border p-4 transition-all ${
                existingDoc
                  ? "border-emerald-400/30 bg-emerald-500/5"
                  : "border-white/10 bg-white/5"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    existingDoc
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {existingDoc ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      {docType.label}
                    </h4>
                    {docType.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{docType.description}</p>

                  {/* Existing document info */}
                  <AnimatePresence>
                    {existingDoc && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-3"
                      >
                        <span className="text-xs text-slate-300">
                          {existingDoc.file_name || "Document uploaded"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            existingDoc.verification_status === "verified"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : existingDoc.verification_status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {existingDoc.verification_status}
                        </span>
                        {!disabled && (
                          <button
                            onClick={() => handleDelete(existingDoc.id)}
                            disabled={deleting === existingDoc.id}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors 
                              disabled:opacity-50"
                          >
                            {deleting === existingDoc.id ? "Deleting..." : "Remove"}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Upload button */}
                {!existingDoc && !disabled && (
                  <label
                    className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium 
                      transition-all ${
                        isUploading
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/25"
                      }`}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      "Upload"
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(docType.type, file);
                        e.target.value = "";
                      }}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

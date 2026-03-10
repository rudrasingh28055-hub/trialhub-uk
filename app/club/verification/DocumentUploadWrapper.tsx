"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DocumentUpload } from "../../../components/verification/DocumentUpload";
import { uploadVerificationDocument, deleteVerificationDocument } from "../../../lib/verifications/actions";
import type { VerificationDocument, DocumentType } from "../../../lib/verifications/types";

interface DocumentUploadWrapperProps {
  verificationId: string;
  existingDocuments: VerificationDocument[];
}

export function DocumentUploadWrapper({ 
  verificationId, 
  existingDocuments 
}: DocumentUploadWrapperProps) {
  const [docs, setDocs] = useState<VerificationDocument[]>(existingDocuments);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(async (type: DocumentType, file: File) => {
    setIsUploading(true);
    
    try {
      // First upload file to storage
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }
      
      const { url } = await uploadRes.json();
      
      // Then create document record
      const result = await uploadVerificationDocument(
        verificationId,
        type,
        url,
        file.name,
        file.size,
        file.type
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to save document");
      }
      
      // Update local state
      if (result.document) {
        setDocs(prev => [...prev, result.document]);
      }
    } finally {
      setIsUploading(false);
    }
  }, [verificationId]);

  const handleDelete = useCallback(async (documentId: string) => {
    const result = await deleteVerificationDocument(documentId);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to delete document");
    }
    
    setDocs(prev => prev.filter(d => d.id !== documentId));
  }, []);

  return (
    <DocumentUpload
      verificationId={verificationId}
      existingDocuments={docs}
      onUpload={handleUpload}
      onDelete={handleDelete}
      disabled={isUploading}
    />
  );
}

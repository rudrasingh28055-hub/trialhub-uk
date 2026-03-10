"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FollowStatus } from "@/lib/domain/social-graph/types";

interface FollowButtonProps {
  targetUsername: string;
  initialStatus?: FollowStatus | null;
  onFollow: () => Promise<{ status: FollowStatus }>;
  onUnfollow: () => Promise<void>;
}

export function FollowButton({ targetUsername, initialStatus, onFollow, onUnfollow }: FollowButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (status === 'approved') {
        await onUnfollow();
        setStatus(null);
      } else {
        const result = await onFollow();
        setStatus(result.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    if (status === 'approved') return 'Following';
    if (status === 'pending') return 'Requested';
    return 'Follow';
  };

  const getButtonStyle = () => {
    if (status === 'approved') return 'bg-slate-600 text-white';
    if (status === 'pending') return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg ${getButtonStyle()} disabled:opacity-50`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {getButtonText()}
    </motion.button>
  );
}

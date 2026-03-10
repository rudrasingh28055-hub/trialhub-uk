"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FollowRequestRow } from "@/lib/domain/social-graph/types";

interface FollowRequestsListProps {
  requests: FollowRequestRow[];
  onApprove: (requesterId: string) => Promise<void>;
  onReject: (requesterId: string) => Promise<void>;
}

export function FollowRequestsList({ requests, onApprove, onReject }: FollowRequestsListProps) {
  const [processing, setProcessing] = useState<string[]>([]);

  const handleApprove = async (requesterId: string) => {
    setProcessing([...processing, requesterId]);
    try {
      await onApprove(requesterId);
    } finally {
      setProcessing(processing.filter(id => id !== requesterId));
    }
  };

  const handleReject = async (requesterId: string) => {
    setProcessing([...processing, requesterId]);
    try {
      await onReject(requesterId);
    } finally {
      setProcessing(processing.filter(id => id !== requesterId));
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        No follow requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request.follower_user_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white">
              {request.follower_profile?.display_name?.[0] || 'U'}
            </div>
            <div>
              <div className="text-white font-medium">
                {request.follower_profile?.display_name}
              </div>
              <div className="text-slate-400 text-sm">
                @{request.follower_profile?.username}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(request.follower_user_id)}
              disabled={processing.includes(request.follower_user_id)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(request.follower_user_id)}
              disabled={processing.includes(request.follower_user_id)}
              className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

interface MatchingRecommendation {
  id: string;
  type: "player_for_club" | "opportunity_for_player";
  target: any;
  match_score: number;
  reasons: string[];
}

interface UseSmartMatchingReturn {
  recommendations: MatchingRecommendation[];
  isLoading: boolean;
  error: string | null;
  userRole: "athlete" | "club" | null;
  refetch: () => void;
}

export function useSmartMatching(): UseSmartMatchingReturn {
  const [recommendations, setRecommendations] = useState<MatchingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"athlete" | "club" | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/matching/scores");

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
        setUserRole(data.role);
      } else {
        throw new Error(data.error || "Failed to load recommendations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    userRole,
    refetch: fetchRecommendations,
  };
}

interface CalculateMatchScoreReturn {
  score: any;
  isLoading: boolean;
  error: string | null;
  calculate: (playerProfileId: string, opportunityId: string) => Promise<void>;
}

export function useCalculateMatchScore(): CalculateMatchScoreReturn {
  const [score, setScore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (playerProfileId: string, opportunityId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/matching/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_profile_id: playerProfileId,
          opportunity_id: opportunityId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate match score");
      }

      const data = await response.json();

      if (data.success) {
        setScore(data.data);
      } else {
        throw new Error(data.error || "Failed to calculate score");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    score,
    isLoading,
    error,
    calculate,
  };
}

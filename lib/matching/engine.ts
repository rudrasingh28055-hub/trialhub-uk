import { createClient } from "@/lib/supabase/server";

export interface PlayerProfile {
  id: string;
  profile_id: string;
  age?: number;
  primary_position?: string;
  secondary_position?: string;
  dominant_foot?: string;
  height_cm?: number;
  previous_club?: string;
  video_url?: string;
  instagram_url?: string;
  bio?: string;
  full_name?: string;
  city?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type?: string;
  age_group?: string;
  position_needed?: string;
  location_city?: string;
  location_country?: string;
  description?: string;
  trial_date?: string;
  deadline?: string;
  requirements?: OpportunityRequirement[];
}

export interface OpportunityRequirement {
  requirement_type: string;
  requirement_name: string;
  priority: number;
  min_value?: string;
  max_value?: string;
}

export interface PlayerSkill {
  skill_name: string;
  skill_category: string;
  skill_level: number;
}

export interface MatchingScore {
  player_profile_id: string;
  opportunity_id: string;
  overall_score: number;
  position_match_score: number;
  age_match_score: number;
  location_match_score: number;
  experience_match_score: number;
  skill_match_score: number;
  matching_factors: string[];
}

export interface MatchingRecommendation {
  id: string;
  type: 'player_for_club' | 'opportunity_for_player';
  target: PlayerProfile | Opportunity;
  match_score: number;
  reasons: string[];
}

// Position compatibility matrix
const POSITION_COMPATIBILITY: Record<string, string[]> = {
  'gk': ['gk'],
  'cb': ['cb', 'dm', 'sw'],
  'lb': ['lb', 'lwb', 'lm'],
  'rb': ['rb', 'rwb', 'rm'],
  'dm': ['dm', 'cm', 'cb'],
  'cm': ['cm', 'am', 'dm', 'lm', 'rm'],
  'am': ['am', 'cm', 'ss', 'rw', 'lw'],
  'lm': ['lm', 'lw', 'lwb', 'cm'],
  'rm': ['rm', 'rw', 'rwb', 'cm'],
  'lw': ['lw', 'lm', 'am', 'rw'],
  'rw': ['rw', 'rm', 'am', 'lw'],
  'ss': ['ss', 'am', 'st'],
  'st': ['st', 'ss', 'cf'],
  'cf': ['cf', 'st', 'ss'],
};

// Age group mapping
const AGE_GROUPS: Record<string, { min: number; max: number }> = {
  'u15': { min: 13, max: 15 },
  'u16': { min: 14, max: 16 },
  'u17': { min: 15, max: 17 },
  'u18': { min: 16, max: 18 },
  'u19': { min: 17, max: 19 },
  'u20': { min: 18, max: 20 },
  'u21': { min: 19, max: 21 },
  'u23': { min: 21, max: 23 },
  'senior': { min: 18, max: 35 },
  'veteran': { min: 35, max: 50 },
};

export class MatchingEngine {
  /**
   * Calculate position match score (0-100)
   */
  static calculatePositionMatch(
    playerPosition: string | undefined,
    opportunityPosition: string | undefined
  ): { score: number; factor: string } {
    if (!playerPosition || !opportunityPosition) {
      return { score: 50, factor: 'Position data incomplete' };
    }

    const playerPos = playerPosition.toLowerCase();
    const oppPos = opportunityPosition.toLowerCase();

    // Exact match
    if (playerPos === oppPos) {
      return { score: 100, factor: 'Perfect position match' };
    }

    // Check compatibility matrix
    const compatiblePositions = POSITION_COMPATIBILITY[oppPos] || [];
    if (compatiblePositions.includes(playerPos)) {
      const score = 85;
      return { 
        score, 
        factor: `${playerPosition.toUpperCase()} is compatible with ${opportunityPosition.toUpperCase()}` 
      };
    }

    // Related positions (secondary position check could go here)
    return { score: 40, factor: 'Position mismatch but potentially adaptable' };
  }

  /**
   * Calculate age match score (0-100)
   */
  static calculateAgeMatch(
    playerAge?: number,
    opportunityAgeGroup?: string
  ): { score: number; factor: string } {
    if (!playerAge || !opportunityAgeGroup) {
      return { score: 70, factor: 'Age criteria not specified' };
    }

    const ageGroup = AGE_GROUPS[opportunityAgeGroup.toLowerCase()];
    if (!ageGroup) {
      return { score: 70, factor: 'Age group criteria unclear' };
    }

    if (playerAge >= ageGroup.min && playerAge <= ageGroup.max) {
      // Calculate how centered they are in the age group
      const midPoint = (ageGroup.min + ageGroup.max) / 2;
      const distance = Math.abs(playerAge - midPoint);
      const range = (ageGroup.max - ageGroup.min) / 2;
      const score = Math.round(100 - (distance / range) * 20); // 80-100 range
      
      return { 
        score: Math.max(80, score), 
        factor: `Age ${playerAge} fits perfectly in ${opportunityAgeGroup.toUpperCase()} range` 
      };
    }

    // Outside age range but close
    if (playerAge >= ageGroup.min - 1 && playerAge <= ageGroup.max + 2) {
      return { 
        score: 60, 
        factor: `Age ${playerAge} is slightly outside ${opportunityAgeGroup.toUpperCase()} range but acceptable` 
      };
    }

    return { 
      score: 20, 
      factor: `Age ${playerAge} doesn't match ${opportunityAgeGroup.toUpperCase()} requirements` 
    };
  }

  /**
   * Calculate location match score (0-100)
   */
  static calculateLocationMatch(
    playerCity?: string,
    opportunityCity?: string,
    opportunityCountry?: string
  ): { score: number; factor: string } {
    if (!playerCity || !opportunityCity) {
      return { score: 75, factor: 'Location preferences not specified' };
    }

    const playerLocation = playerCity.toLowerCase().trim();
    const oppLocation = opportunityCity.toLowerCase().trim();

    if (playerLocation === oppLocation) {
      return { score: 100, factor: 'Local - Same city' };
    }

    // Could add distance calculation here using geocoding
    // For now, simple string matching
    if (playerLocation.includes(oppLocation) || oppLocation.includes(playerLocation)) {
      return { score: 90, factor: 'Nearby location match' };
    }

    return { score: 50, factor: 'Different location - relocation needed' };
  }

  /**
   * Calculate experience match score (0-100)
   */
  static calculateExperienceMatch(
    playerPreviousClub?: string,
    opportunityType?: string,
    requirements?: OpportunityRequirement[]
  ): { score: number; factor: string } {
    let score = 50;
    const factors: string[] = [];

    // Check if player has previous club experience
    if (playerPreviousClub) {
      score += 20;
      factors.push('Has previous club experience');
    } else {
      factors.push('New to club football');
    }

    // Check opportunity type match
    if (opportunityType) {
      const oppType = opportunityType.toLowerCase();
      
      if (oppType.includes('academy') && !playerPreviousClub) {
        score += 15;
        factors.push('Academy opportunity suitable for development');
      } else if (oppType.includes('professional') && playerPreviousClub) {
        score += 15;
        factors.push('Previous experience matches professional opportunity');
      }
    }

    // Check specific requirements
    if (requirements) {
      const experienceReq = requirements.find(r => 
        r.requirement_type === 'experience'
      );
      
      if (experienceReq) {
        if (playerPreviousClub) {
          score += 10;
          factors.push('Meets experience requirements');
        } else {
          score -= 10;
          factors.push('May not meet experience requirements');
        }
      }
    }

    return { 
      score: Math.min(100, Math.max(0, score)), 
      factor: factors.join(', ') || 'Experience match assessed' 
    };
  }

  /**
   * Calculate skill match score (0-100)
   */
  static calculateSkillMatch(
    playerSkills: PlayerSkill[],
    requirements: OpportunityRequirement[]
  ): { score: number; factor: string } {
    if (requirements.length === 0) {
      return { score: 70, factor: 'No specific skill requirements' };
    }

    let totalScore = 0;
    let requirementCount = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const req of requirements) {
      if (req.requirement_type === 'skill') {
        requirementCount++;
        
        const playerSkill = playerSkills.find(s => 
          s.skill_name.toLowerCase() === req.requirement_name.toLowerCase()
        );

        if (playerSkill) {
          const priorityWeight = 6 - req.priority; // Priority 1 = weight 5, Priority 5 = weight 1
          const skillScore = (playerSkill.skill_level / 10) * 100;
          totalScore += skillScore * priorityWeight;
          
          if (playerSkill.skill_level >= 7) {
            matchedSkills.push(req.requirement_name);
          }
        } else {
          missingSkills.push(req.requirement_name);
        }
      }
    }

    if (requirementCount === 0) {
      return { score: 70, factor: 'No specific skill requirements' };
    }

    const averageScore = totalScore / requirementCount;
    
    let factor = '';
    if (matchedSkills.length > 0) {
      factor += `Strong in: ${matchedSkills.join(', ')}. `;
    }
    if (missingSkills.length > 0) {
      factor += `Could develop: ${missingSkills.join(', ')}.`;
    }

    return { score: Math.round(averageScore), factor: factor.trim() };
  }

  /**
   * Calculate overall matching score
   */
  static calculateOverallScore(
    player: PlayerProfile,
    opportunity: Opportunity,
    playerSkills: PlayerSkill[]
  ): MatchingScore {
    const positionResult = this.calculatePositionMatch(
      player.primary_position,
      opportunity.position_needed
    );

    const ageResult = this.calculateAgeMatch(
      player.age,
      opportunity.age_group
    );

    const locationResult = this.calculateLocationMatch(
      player.city,
      opportunity.location_city,
      opportunity.location_country
    );

    const experienceResult = this.calculateExperienceMatch(
      player.previous_club,
      opportunity.type,
      opportunity.requirements
    );

    const skillResult = this.calculateSkillMatch(
      playerSkills,
      opportunity.requirements || []
    );

    // Weighted average for overall score
    const weights = {
      position: 0.30,
      age: 0.15,
      location: 0.15,
      experience: 0.20,
      skill: 0.20,
    };

    const overallScore = Math.round(
      positionResult.score * weights.position +
      ageResult.score * weights.age +
      locationResult.score * weights.location +
      experienceResult.score * weights.experience +
      skillResult.score * weights.skill
    );

    const factors = [
      positionResult.factor,
      ageResult.factor,
      locationResult.factor,
      experienceResult.factor,
      skillResult.factor,
    ];

    return {
      player_profile_id: player.id,
      opportunity_id: opportunity.id,
      overall_score: overallScore,
      position_match_score: positionResult.score,
      age_match_score: ageResult.score,
      location_match_score: locationResult.score,
      experience_match_score: experienceResult.score,
      skill_match_score: skillResult.score,
      matching_factors: factors,
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  static async generateRecommendations(
    userId: string,
    userRole: 'athlete' | 'club'
  ): Promise<MatchingRecommendation[]> {
    const supabase = await createClient();
    const recommendations: MatchingRecommendation[] = [];

    if (userRole === 'athlete') {
      // Get player's profile
      const { data: playerProfile } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (!playerProfile) return recommendations;

      // Get player's skills
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('*')
        .eq('player_profile_id', playerProfile.id);

      // Get active opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active');

      if (!opportunities) return recommendations;

      // Calculate scores for each opportunity
      for (const opportunity of opportunities) {
        const score = this.calculateOverallScore(
          playerProfile,
          opportunity,
          playerSkills || []
        );

        if (score.overall_score >= 60) { // Only recommend good matches
          recommendations.push({
            id: `${playerProfile.id}-${opportunity.id}`,
            type: 'opportunity_for_player',
            target: opportunity,
            match_score: score.overall_score,
            reasons: score.matching_factors,
          });
        }
      }
    } else {
      // For clubs - recommend players for their opportunities
      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (!clubProfile) return recommendations;

      // Get club's opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('club_profile_id', clubProfile.id)
        .eq('status', 'active');

      if (!opportunities) return recommendations;

      // Get all player profiles
      const { data: players } = await supabase
        .from('player_profiles')
        .select('*, profiles(full_name, city)');

      if (!players) return recommendations;

      // For each opportunity, find matching players
      for (const opportunity of opportunities) {
        for (const player of players) {
          // Get player skills
          const { data: playerSkills } = await supabase
            .from('player_skills')
            .select('*')
            .eq('player_profile_id', player.id);

          const score = this.calculateOverallScore(
            player,
            opportunity,
            playerSkills || []
          );

          if (score.overall_score >= 70) { // Higher threshold for club recommendations
            recommendations.push({
              id: `${player.id}-${opportunity.id}`,
              type: 'player_for_club',
              target: player,
              match_score: score.overall_score,
              reasons: score.matching_factors,
            });
          }
        }
      }
    }

    // Sort by match score descending
    return recommendations.sort((a, b) => b.match_score - a.match_score).slice(0, 10);
  }
}

export default MatchingEngine;

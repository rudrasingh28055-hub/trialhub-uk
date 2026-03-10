import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import MatchingEngine from '@/lib/matching/engine';

// GET /api/matching/scores - Get matching scores for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Generate recommendations
    const recommendations = await MatchingEngine.generateRecommendations(
      user.id,
      profile.role as 'athlete' | 'club'
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      role: profile.role,
    });

  } catch (error) {
    console.error('Error generating matching scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/matching/calculate - Calculate match score between player and opportunity
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { player_profile_id, opportunity_id } = body;

    if (!player_profile_id || !opportunity_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get player profile with base profile data
    const { data: playerProfile, error: playerError } = await supabase
      .from('player_profiles')
      .select(`
        *,
        profiles(full_name, city, bio)
      `)
      .eq('id', player_profile_id)
      .single();

    if (playerError || !playerProfile) {
      return NextResponse.json(
        { error: 'Player profile not found' },
        { status: 404 }
      );
    }

    // Get opportunity with requirements
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_requirements(*)
      `)
      .eq('id', opportunity_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Get player skills
    const { data: playerSkills } = await supabase
      .from('player_skills')
      .select('*')
      .eq('player_profile_id', player_profile_id);

    // Calculate matching score
    const score = MatchingEngine.calculateOverallScore(
      {
        ...playerProfile,
        full_name: playerProfile.profiles?.full_name,
        city: playerProfile.profiles?.city,
        bio: playerProfile.profiles?.bio,
      },
      opportunity,
      playerSkills || []
    );

    // Store the score in database
    const { data: storedScore, error: storeError } = await supabase
      .from('matching_scores')
      .upsert({
        player_profile_id,
        opportunity_id,
        overall_score: score.overall_score,
        position_match_score: score.position_match_score,
        age_match_score: score.age_match_score,
        location_match_score: score.location_match_score,
        experience_match_score: score.experience_match_score,
        skill_match_score: score.skill_match_score,
        matching_factors: score.matching_factors,
        last_calculated_at: new Date().toISOString(),
      }, {
        onConflict: 'player_profile_id,opportunity_id',
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing matching score:', storeError);
    }

    return NextResponse.json({
      success: true,
      data: score,
      stored: !!storedScore,
    });

  } catch (error) {
    console.error('Error calculating match score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

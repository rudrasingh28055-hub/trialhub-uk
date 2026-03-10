-- Create analytics_events table for tracking user activity
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- page_view, click, search, apply, save, message, etc.
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create player_analytics table for athlete performance metrics
CREATE TABLE IF NOT EXISTS player_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_profile_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- views, applications, saves, invites, messages
  metric_value INTEGER DEFAULT 0,
  metric_period VARCHAR(50) NOT NULL, -- daily, weekly, monthly, all_time
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_profile_id, metric_type, metric_period, period_start)
);

-- Create club_analytics table for club recruitment metrics
CREATE TABLE IF NOT EXISTS club_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_profile_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL, -- opportunity_views, applications, shortlists, hires, messages
  metric_value INTEGER DEFAULT 0,
  metric_period VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(club_profile_id, metric_type, metric_period, period_start)
);

-- Create opportunity_analytics table
CREATE TABLE IF NOT EXISTS opportunity_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(opportunity_id, date)
);

-- Create performance_goals table
CREATE TABLE IF NOT EXISTS performance_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type VARCHAR(100) NOT NULL, -- applications, profile_views, connections, etc.
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  time_period VARCHAR(50) NOT NULL, -- weekly, monthly, quarterly
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cohort_analysis table for retention metrics
CREATE TABLE IF NOT EXISTS cohort_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_date DATE NOT NULL,
  user_role VARCHAR(50) NOT NULL, -- athlete, club
  total_users INTEGER DEFAULT 0,
  active_day_1 INTEGER DEFAULT 0,
  active_day_7 INTEGER DEFAULT 0,
  active_day_30 INTEGER DEFAULT 0,
  active_day_90 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cohort_date, user_role)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_player_analytics_profile ON player_analytics(player_profile_id, metric_period);
CREATE INDEX IF NOT EXISTS idx_club_analytics_profile ON club_analytics(club_profile_id, metric_period);
CREATE INDEX IF NOT EXISTS idx_opportunity_analytics_date ON opportunity_analytics(opportunity_id, date);
CREATE INDEX IF NOT EXISTS idx_performance_goals_user ON performance_goals(user_id, is_active);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Analytics events: Users can only see their own events
CREATE POLICY "Users can view their own analytics events" 
  ON analytics_events FOR SELECT 
  USING (user_id = auth.uid());

-- Player analytics: Players can view their own, clubs can view aggregated
CREATE POLICY "Players can view their own analytics" 
  ON player_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles pp 
      WHERE pp.id = player_analytics.player_profile_id 
      AND pp.profile_id = auth.uid()
    )
  );

-- Club analytics: Clubs can view their own
CREATE POLICY "Clubs can view their own analytics" 
  ON club_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM club_profiles cp 
      WHERE cp.id = club_analytics.club_profile_id 
      AND cp.profile_id = auth.uid()
    )
  );

-- Opportunity analytics: Club owners can view their opportunities
CREATE POLICY "Clubs can view their opportunity analytics" 
  ON opportunity_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o 
      JOIN club_profiles cp ON o.club_profile_id = cp.id 
      WHERE o.id = opportunity_analytics.opportunity_id 
      AND cp.profile_id = auth.uid()
    )
  );

-- Performance goals: Users can manage their own goals
CREATE POLICY "Users can manage their own goals" 
  ON performance_goals FOR ALL 
  USING (user_id = auth.uid());

-- Functions for analytics

-- Function to record an analytics event
CREATE OR REPLACE FUNCTION record_analytics_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_name VARCHAR,
  p_event_data JSONB DEFAULT '{}',
  p_session_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    user_id, event_type, event_name, event_data, session_id
  ) VALUES (
    p_user_id, p_event_type, p_event_name, p_event_data, p_session_id
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update player analytics
CREATE OR REPLACE FUNCTION update_player_analytics(
  p_player_profile_id UUID,
  p_metric_type VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
  -- Update daily metrics
  INSERT INTO player_analytics (
    player_profile_id, metric_type, metric_value, metric_period, period_start, period_end
  ) VALUES (
    p_player_profile_id, p_metric_type, p_increment, 'daily', v_today, v_today
  )
  ON CONFLICT (player_profile_id, metric_type, metric_period, period_start)
  DO UPDATE SET metric_value = player_analytics.metric_value + p_increment;

  -- Update weekly metrics
  INSERT INTO player_analytics (
    player_profile_id, metric_type, metric_value, metric_period, period_start, period_end
  ) VALUES (
    p_player_profile_id, p_metric_type, p_increment, 'weekly', v_week_start, v_week_start + INTERVAL '6 days'
  )
  ON CONFLICT (player_profile_id, metric_type, metric_period, period_start)
  DO UPDATE SET metric_value = player_analytics.metric_value + p_increment;

  -- Update monthly metrics
  INSERT INTO player_analytics (
    player_profile_id, metric_type, metric_value, metric_period, period_start, period_end
  ) VALUES (
    p_player_profile_id, p_metric_type, p_increment, 'monthly', v_month_start, (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  )
  ON CONFLICT (player_profile_id, metric_type, metric_period, period_start)
  DO UPDATE SET metric_value = player_analytics.metric_value + p_increment;
END;
$$ LANGUAGE plpgsql;

-- Function to get player dashboard stats
CREATE OR REPLACE FUNCTION get_player_dashboard_stats(p_player_profile_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile_views', COALESCE((
      SELECT SUM(metric_value) FROM player_analytics 
      WHERE player_profile_id = p_player_profile_id 
      AND metric_type = 'views' AND metric_period = 'monthly'
    ), 0),
    'applications_sent', COALESCE((
      SELECT COUNT(*) FROM applications 
      WHERE player_profile_id = p_player_profile_id
    ), 0),
    'invites_received', COALESCE((
      SELECT COUNT(*) FROM invites 
      WHERE player_profile_id = p_player_profile_id AND status = 'pending'
    ), 0),
    'messages_sent', COALESCE((
      SELECT COUNT(*) FROM messages 
      WHERE sender_id = (SELECT profile_id FROM player_profiles WHERE id = p_player_profile_id)
    ), 0),
    'opportunities_saved', COALESCE((
      SELECT COUNT(*) FROM saved_opportunities 
      WHERE player_profile_id = p_player_profile_id
    ), 0),
    'conversion_rate', CASE 
      WHEN (SELECT COUNT(*) FROM applications WHERE player_profile_id = p_player_profile_id) > 0
      THEN ROUND(
        (SELECT COUNT(*) FROM applications a 
         JOIN opportunities o ON a.opportunity_id = o.id 
         WHERE a.player_profile_id = p_player_profile_id 
         AND a.status = 'accepted')::DECIMAL / 
        (SELECT COUNT(*) FROM applications WHERE player_profile_id = p_player_profile_id)::DECIMAL * 100, 
        2
      )
      ELSE 0
    END
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get club dashboard stats
CREATE OR REPLACE FUNCTION get_club_dashboard_stats(p_club_profile_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_opportunities', COALESCE((
      SELECT COUNT(*) FROM opportunities 
      WHERE club_profile_id = p_club_profile_id
    ), 0),
    'active_opportunities', COALESCE((
      SELECT COUNT(*) FROM opportunities 
      WHERE club_profile_id = p_club_profile_id AND status = 'active'
    ), 0),
    'total_applications', COALESCE((
      SELECT COUNT(*) FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE o.club_profile_id = p_club_profile_id
    ), 0),
    'shortlisted_candidates', COALESCE((
      SELECT COUNT(*) FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE o.club_profile_id = p_club_profile_id AND a.status = 'shortlisted'
    ), 0),
    'profile_views', COALESCE((
      SELECT SUM(metric_value) FROM club_analytics 
      WHERE club_profile_id = p_club_profile_id 
      AND metric_type = 'opportunity_views' AND metric_period = 'monthly'
    ), 0),
    'hire_rate', CASE 
      WHEN (SELECT COUNT(*) FROM applications a
            JOIN opportunities o ON a.opportunity_id = o.id
            WHERE o.club_profile_id = p_club_profile_id) > 0
      THEN ROUND(
        (SELECT COUNT(*) FROM applications a 
         JOIN opportunities o ON a.opportunity_id = o.id 
         WHERE o.club_profile_id = p_club_profile_id 
         AND a.status = 'accepted')::DECIMAL / 
        (SELECT COUNT(*) FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         WHERE o.club_profile_id = p_club_profile_id)::DECIMAL * 100, 
        2
      )
      ELSE 0
    END
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

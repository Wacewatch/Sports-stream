-- Renamed table from 'bets' to 'user_bets' to match references in other scripts
-- Create user_bets table to track user bets
CREATE TABLE IF NOT EXISTS user_bets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  match_id TEXT NOT NULL,
  match_title TEXT NOT NULL,
  sport TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  odds NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'won', 'lost')),
  win_amount INTEGER,
  timestamp BIGINT NOT NULL,
  settled_at BIGINT,
  sports_db_event_id TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  match_result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON user_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_bets_timestamp ON user_bets(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_status ON user_bets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_bets_event_id ON user_bets(sports_db_event_id);

-- Create user_stats table for leaderboard
CREATE TABLE IF NOT EXISTS user_stats (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  total_points INTEGER DEFAULT 1000,
  total_bets INTEGER DEFAULT 0,
  won_bets INTEGER DEFAULT 0,
  lost_bets INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_stats_points ON user_stats(total_points DESC);

-- Enable Row Level Security
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating them to avoid errors
DROP POLICY IF EXISTS "Allow all operations on user_bets" ON user_bets;
DROP POLICY IF EXISTS "Allow all operations on user_stats" ON user_stats;

-- Create policies for public access (since this is a demo app)
CREATE POLICY "Allow all operations on user_bets" ON user_bets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_stats" ON user_stats FOR ALL USING (true) WITH CHECK (true);

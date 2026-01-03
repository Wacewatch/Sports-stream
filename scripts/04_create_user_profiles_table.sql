-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  points INTEGER DEFAULT 1000,
  total_bets INTEGER DEFAULT 0,
  won_bets INTEGER DEFAULT 0,
  lost_bets INTEGER DEFAULT 0,
  pending_bets INTEGER DEFAULT 0,
  total_winnings INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  favorite_sport TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (true);

-- Create index for faster queries
CREATE INDEX idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Create function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('won', 'lost') THEN
    UPDATE user_profiles
    SET 
      won_bets = CASE WHEN NEW.status = 'won' THEN won_bets + 1 ELSE won_bets END,
      lost_bets = CASE WHEN NEW.status = 'lost' THEN lost_bets + 1 ELSE lost_bets END,
      pending_bets = CASE WHEN NEW.status != 'pending' THEN pending_bets - 1 ELSE pending_bets END,
      total_winnings = CASE WHEN NEW.status = 'won' THEN total_winnings + NEW.win_amount ELSE total_winnings END,
      total_losses = CASE WHEN NEW.status = 'lost' THEN total_losses + NEW.amount ELSE total_losses END,
      points = CASE 
        WHEN NEW.status = 'won' THEN points + NEW.win_amount 
        WHEN NEW.status = 'lost' THEN points - NEW.amount 
        ELSE points 
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_profile_on_bet_result ON user_bets;
CREATE TRIGGER update_profile_on_bet_result
  AFTER UPDATE ON user_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();

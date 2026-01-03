-- Removed ALTER TABLE commands since columns are now in initial table creation
-- This script is kept for backward compatibility but does nothing if table already has columns
DO $$ 
BEGIN
  -- Check if columns exist and add them only if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_bets' AND column_name='sports_db_event_id') THEN
    ALTER TABLE user_bets ADD COLUMN sports_db_event_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_bets' AND column_name='validated_at') THEN
    ALTER TABLE user_bets ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_bets' AND column_name='match_result') THEN
    ALTER TABLE user_bets ADD COLUMN match_result TEXT;
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_user_bets_event_id ON user_bets(sports_db_event_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_status ON user_bets(status);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id_status ON user_bets(user_id, status);

-- Update check constraint for status
ALTER TABLE user_bets DROP CONSTRAINT IF EXISTS user_bets_status_check;
ALTER TABLE user_bets ADD CONSTRAINT user_bets_status_check 
CHECK (status IN ('pending', 'won', 'lost', 'cancelled'));

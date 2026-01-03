-- Create table for tracking API request rate limiting
-- Helps monitor and prevent exceeding 30 requests/minute limit

CREATE TABLE IF NOT EXISTS api_request_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE,
  status_code INTEGER,
  from_cache BOOLEAN DEFAULT FALSE
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_request_log_time ON api_request_log(requested_at DESC);

-- Function to get request count in last minute
CREATE OR REPLACE FUNCTION get_recent_request_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM api_request_log
    WHERE requested_at > NOW() - INTERVAL '1 minute'
    AND from_cache = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Clean up old logs (keep last 24 hours)
CREATE OR REPLACE FUNCTION clean_old_request_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM api_request_log WHERE requested_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Add is_spam column to feedback table
ALTER TABLE feedback ADD COLUMN is_spam INTEGER DEFAULT 0;

-- Create index for spam filtering
CREATE INDEX IF NOT EXISTS idx_feedback_is_spam ON feedback(is_spam);

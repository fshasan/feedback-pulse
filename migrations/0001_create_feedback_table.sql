-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    timestamp TEXT NOT NULL,
    metadata TEXT,
    sentiment TEXT,
    sentiment_score REAL,
    themes TEXT,
    value_score REAL,
    urgency_score REAL,
    is_meaningless INTEGER DEFAULT 0,
    is_spam INTEGER DEFAULT 0,
    reasoning TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_is_spam ON feedback(is_spam);

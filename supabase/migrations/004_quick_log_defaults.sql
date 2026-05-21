-- Migration 004: Add default values for session_logs week/session numbers
-- Fixes NOT NULL constraint violation when quick-log API inserts without these values.
ALTER TABLE session_logs ALTER COLUMN week_number SET DEFAULT 0;
ALTER TABLE session_logs ALTER COLUMN session_number SET DEFAULT 0;

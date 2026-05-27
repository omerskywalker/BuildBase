-- ─────────────────────────────────────────────────────────────────────────────
-- 008_add_indexes.sql — Add missing FK indexes and compound indexes
--
-- Covers common query patterns:
--   - FK lookups on template_exercises
--   - Session/set history queries
--   - Personal record lookups
--   - Active enrollment checks
--   - Coach form assessment lookups
--   - Coach note lookups by athlete
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── template_exercises ──────────────────────────────────────────────────────
-- FK lookup: join template_exercises to workout_templates
CREATE INDEX IF NOT EXISTS idx_template_exercises_session_id
  ON template_exercises (workout_template_id);

-- FK lookup: join template_exercises to exercises
CREATE INDEX IF NOT EXISTS idx_template_exercises_exercise_id
  ON template_exercises (exercise_id);

-- ─── set_logs ────────────────────────────────────────────────────────────────
-- FK lookup: join sets to their parent session log
CREATE INDEX IF NOT EXISTS idx_set_logs_session_log_id
  ON set_logs (session_log_id);

-- Compound: user history queries (via session_logs join, but set_logs has no
-- direct user_id — this index supports the FK join path)
-- Note: set_logs doesn't have user_id directly; the join goes through session_logs.
-- We index the FK that enables that join.

-- ─── personal_records ────────────────────────────────────────────────────────
-- Compound: PR lookups per user per exercise
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise
  ON personal_records (user_id, exercise_id);

-- ─── user_enrollments ────────────────────────────────────────────────────────
-- Compound: active enrollment checks (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_active
  ON user_enrollments (user_id, is_active);

-- ─── session_logs ────────────────────────────────────────────────────────────
-- Compound: history/progress queries sorted by completion time
CREATE INDEX IF NOT EXISTS idx_session_logs_user_completed
  ON session_logs (user_id, completed_at);

-- FK lookup: join session_logs to user_enrollments
CREATE INDEX IF NOT EXISTS idx_session_logs_enrollment_id
  ON session_logs (enrollment_id);

-- ─── coach_form_assessments ──────────────────────────────────────────────────
-- Compound: coach looking up assessments for a specific athlete
CREATE INDEX IF NOT EXISTS idx_coach_form_assessments_coach_user
  ON coach_form_assessments (coach_id, user_id);

-- ─── coach_notes ─────────────────────────────────────────────────────────────
-- FK/query: athlete note lookups (dashboard banner, /coach-notes page)
CREATE INDEX IF NOT EXISTS idx_coach_notes_user_id
  ON coach_notes (user_id);

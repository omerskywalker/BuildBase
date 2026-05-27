-- ─────────────────────────────────────────────────────────────────────────────
-- BuildBase — Full Schema Reference
--
-- This is a combined, single-file reference of all migrations:
--   001_initial_schema.sql
--   002_add_form_assessment_unique_constraint.sql
--   003_enrollment_self_insert.sql
--   004_quick_log_defaults.sql
--
-- Use this in the Supabase SQL Editor to set up a fresh database.
-- For incremental updates, run the individual files in supabase/migrations/.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── PROFILES (extends Supabase auth.users) ──────────────────────────────────
CREATE TABLE profiles (
  id              uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email           text UNIQUE NOT NULL,
  full_name       text,
  role            text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'coach', 'user')),
  gender          text CHECK (gender IN ('male', 'female', 'other', 'unset')) DEFAULT 'unset',
  coach_id        uuid REFERENCES profiles(id) NULL,
  template_tier   text CHECK (template_tier IN ('pre_baseline', 'default', 'post_baseline')) DEFAULT 'default',
  onboarding_done boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ─── PROGRAMS ────────────────────────────────────────────────────────────────
CREATE TABLE programs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  total_phases int DEFAULT 3,
  total_weeks  int DEFAULT 12,
  created_by   uuid REFERENCES profiles(id),
  version      int DEFAULT 1,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- ─── PHASES ──────────────────────────────────────────────────────────────────
CREATE TABLE phases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid REFERENCES programs(id) ON DELETE CASCADE,
  phase_number int NOT NULL,
  name         text NOT NULL,
  subtitle     text,
  week_start   int NOT NULL,
  week_end     int NOT NULL,
  description  text
);

-- ─── WORKOUT TEMPLATES ───────────────────────────────────────────────────────
CREATE TABLE workout_templates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id       uuid REFERENCES phases(id) ON DELETE CASCADE,
  week_number    int NOT NULL,
  session_number int NOT NULL,
  day_label      text NOT NULL CHECK (day_label IN ('A', 'B', 'C')),
  title          text NOT NULL,
  description    text,
  order_index    int NOT NULL DEFAULT 0
);

-- ─── EXERCISES ───────────────────────────────────────────────────────────────
CREATE TABLE exercises (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  muscle_group  text,
  equipment     text,
  instructions  text,
  coaching_cues text,
  video_url     text NULL,
  created_by    uuid REFERENCES profiles(id) NULL,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ─── TEMPLATE EXERCISES ──────────────────────────────────────────────────────
CREATE TABLE template_exercises (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_template_id     uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id             uuid REFERENCES exercises(id),
  order_index             int NOT NULL DEFAULT 0,
  sets_default            int NOT NULL DEFAULT 3,
  reps_default            int NOT NULL DEFAULT 8,
  weight_pre_baseline_f   numeric DEFAULT 0,
  weight_pre_baseline_m   numeric DEFAULT 0,
  weight_default_f        numeric DEFAULT 0,
  weight_default_m        numeric DEFAULT 0,
  weight_post_baseline_f  numeric DEFAULT 0,
  weight_post_baseline_m  numeric DEFAULT 0,
  superset_group          text NULL,
  is_bodyweight           boolean DEFAULT false,
  is_abs_finisher         boolean DEFAULT false,
  coaching_cues           text NULL,
  notes                   text NULL
);

-- ─── USER ENROLLMENTS ────────────────────────────────────────────────────────
CREATE TABLE user_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  program_id      uuid REFERENCES programs(id),
  template_tier   text NOT NULL,
  gender_applied  text NOT NULL,
  started_at      timestamptz DEFAULT now(),
  current_week    int DEFAULT 1,
  current_session int DEFAULT 1,
  is_active       boolean DEFAULT true
);

-- ─── USER EXERCISE OVERRIDES ─────────────────────────────────────────────────
CREATE TABLE user_exercise_overrides (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE,
  template_exercise_id  uuid REFERENCES template_exercises(id),
  sets_override         int NULL,
  reps_override         int NULL,
  weight_override       numeric NULL,
  notes                 text NULL,
  set_by                uuid REFERENCES profiles(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ─── SESSION LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE session_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE,
  workout_template_id   uuid REFERENCES workout_templates(id),
  enrollment_id         uuid REFERENCES user_enrollments(id),
  week_number           int NOT NULL DEFAULT 0,
  session_number        int NOT NULL DEFAULT 0,
  started_at            timestamptz NULL,
  completed_at          timestamptz NULL,
  is_complete           boolean DEFAULT false,
  post_session_effort   int NULL CHECK (post_session_effort BETWEEN 1 AND 5),
  pre_session_soreness  int NULL CHECK (pre_session_soreness BETWEEN 1 AND 5),
  soreness_prompted     boolean DEFAULT false,
  notes                 text NULL,
  created_at            timestamptz DEFAULT now()
);

-- ─── SET LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE set_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id        uuid REFERENCES session_logs(id) ON DELETE CASCADE,
  template_exercise_id  uuid REFERENCES template_exercises(id),
  exercise_id           uuid REFERENCES exercises(id),
  set_number            int NOT NULL,
  weight_used           numeric NULL,
  reps_completed        int NULL,
  is_completed          boolean DEFAULT false,
  notes                 text NULL,
  logged_at             timestamptz DEFAULT now()
);

-- ─── PERSONAL RECORDS ────────────────────────────────────────────────────────
CREATE TABLE personal_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id  uuid REFERENCES exercises(id),
  weight       numeric NOT NULL,
  reps         int NOT NULL,
  achieved_at  timestamptz NOT NULL,
  set_log_id   uuid REFERENCES set_logs(id)
);

-- ─── MILESTONES ──────────────────────────────────────────────────────────────
CREATE TABLE milestones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_key  text NOT NULL,
  achieved_at    timestamptz DEFAULT now(),
  notes          text NULL,
  set_by         uuid REFERENCES profiles(id) NULL,
  UNIQUE(user_id, milestone_key)
);

-- ─── COACH FORM ASSESSMENTS ──────────────────────────────────────────────────
-- Internal only — NEVER exposed directly to the athlete.
-- Athletes see "Solid Form ✅" only when status = 'locked_in'.
CREATE TABLE coach_form_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id         uuid REFERENCES profiles(id),
  user_id          uuid REFERENCES profiles(id),
  exercise_id      uuid REFERENCES exercises(id),
  assessment_date  date DEFAULT CURRENT_DATE,
  status           text CHECK (status IN ('needs_cues', 'getting_there', 'locked_in')),
  private_notes    text NULL,
  coaching_focus   text NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT unique_coach_user_exercise UNIQUE (coach_id, user_id, exercise_id)
);

-- ─── PLAYBOOK ENTRIES ─────────────────────────────────────────────────────────
CREATE TABLE playbook_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  content    text NOT NULL,
  category   text,
  coach_id   uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── COACH NOTES ─────────────────────────────────────────────────────────────
CREATE TABLE coach_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     uuid REFERENCES profiles(id),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message      text NOT NULL,
  is_sent      boolean DEFAULT true,
  sent_at      timestamptz DEFAULT now(),
  read_at      timestamptz NULL,
  dismissed_at timestamptz NULL,
  created_at   timestamptz DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── updated_at auto-maintenance ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_exercise_overrides_updated_at
  BEFORE UPDATE ON user_exercise_overrides
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER coach_form_assessments_updated_at
  BEFORE UPDATE ON coach_form_assessments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER playbook_entries_updated_at
  BEFORE UPDATE ON playbook_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── Auto-create profile row on signup ───────────────────────────────────────
-- Fires after a new auth.users row is inserted (i.e. after email signup or OAuth).
-- Creates the corresponding profiles row so all downstream queries have a target.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises                ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercise_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones               ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_form_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes              ENABLE ROW LEVEL SECURITY;

-- Helper: returns the current authenticated user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: true when auth.uid() is the assigned coach of the given user_id.
-- Uses SECURITY DEFINER so the RLS lookup on profiles doesn't recurse.
CREATE OR REPLACE FUNCTION is_my_client(p_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND coach_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Privilege-escalation guard on profiles ───────────────────────────────────
-- A BEFORE UPDATE trigger prevents any non-admin from changing role, coach_id,
-- or email. Admins (auth_role() = 'admin') are exempt and may update all fields.
-- This is preferred over REVOKE/GRANT because all JWT users share the same DB
-- role (`authenticated`), so column revokes would block admins too.
CREATE OR REPLACE FUNCTION prevent_profile_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth_role() = 'admin' THEN
    RETURN NEW;
  END IF;
  IF NEW.role     IS DISTINCT FROM OLD.role     THEN
    RAISE EXCEPTION 'permission denied: only admins can change role';
  END IF;
  IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
    RAISE EXCEPTION 'permission denied: only admins can change coach_id';
  END IF;
  IF NEW.email    IS DISTINCT FROM OLD.email    THEN
    RAISE EXCEPTION 'permission denied: only admins can change email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_prevent_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_escalation();

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Users see their own row; coaches see clients (coach_id = them); admins see all.
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  id = auth.uid()
  OR coach_id = auth.uid()
  OR auth_role() = 'admin'
);
-- Self-update allowed; role/coach_id/email changes are rejected by the trigger
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  USING    (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (auth_role() = 'admin');

-- ─── programs / phases / workout_templates / exercises / template_exercises ──
-- Publicly readable by all authenticated users; only admins may write.
CREATE POLICY "programs_read_all"              ON programs           FOR SELECT USING (true);
CREATE POLICY "programs_admin_write"           ON programs           FOR ALL    USING (auth_role() = 'admin');
CREATE POLICY "phases_read_all"                ON phases             FOR SELECT USING (true);
CREATE POLICY "phases_admin_write"             ON phases             FOR ALL    USING (auth_role() = 'admin');
CREATE POLICY "workout_templates_read_all"     ON workout_templates  FOR SELECT USING (true);
CREATE POLICY "workout_templates_admin_write"  ON workout_templates  FOR ALL    USING (auth_role() = 'admin');
CREATE POLICY "exercises_read_all"             ON exercises          FOR SELECT USING (true);
CREATE POLICY "exercises_admin_write"          ON exercises          FOR ALL    USING (auth_role() = 'admin');
CREATE POLICY "template_exercises_read_all"    ON template_exercises FOR SELECT USING (true);
CREATE POLICY "template_exercises_admin_write" ON template_exercises FOR ALL    USING (auth_role() = 'admin');

-- ─── user_enrollments ────────────────────────────────────────────────────────
-- Athletes see their own enrollment; coaches see their clients' only (not all athletes).
-- Athletes can INSERT their own enrollment during onboarding.
-- Admins have full access.
CREATE POLICY "enrollments_select" ON user_enrollments FOR SELECT USING (
  user_id = auth.uid()
  OR is_my_client(user_id)
  OR auth_role() = 'admin'
);
CREATE POLICY "enrollments_self_insert" ON user_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_admin_all" ON user_enrollments FOR ALL
  USING (auth_role() = 'admin');

-- ─── session_logs ────────────────────────────────────────────────────────────
-- Athletes have full control over their own logs.
-- Coaches have read-only access to their clients' logs (not all athletes).
-- Admins have full access.
CREATE POLICY "session_logs_athlete" ON session_logs FOR ALL
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "session_logs_coach_select" ON session_logs FOR SELECT
  USING (is_my_client(user_id));
CREATE POLICY "session_logs_admin_all" ON session_logs FOR ALL
  USING (auth_role() = 'admin');

-- ─── set_logs ────────────────────────────────────────────────────────────────
-- Access mirrors the parent session_log's access rules.
-- Athletes write their own; coaches read their clients'; admins all.
CREATE POLICY "set_logs_athlete" ON set_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM session_logs s WHERE s.id = session_log_id AND s.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM session_logs s WHERE s.id = session_log_id AND s.user_id = auth.uid())
);
CREATE POLICY "set_logs_coach_select" ON set_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM session_logs s WHERE s.id = session_log_id AND is_my_client(s.user_id))
);
CREATE POLICY "set_logs_admin_all" ON set_logs FOR ALL
  USING (auth_role() = 'admin');

-- ─── personal_records ────────────────────────────────────────────────────────
-- Athletes manage their own records; coaches have read-only access to clients'; admins all.
CREATE POLICY "personal_records_athlete" ON personal_records FOR ALL
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "personal_records_coach_select" ON personal_records FOR SELECT
  USING (is_my_client(user_id));
CREATE POLICY "personal_records_admin_all" ON personal_records FOR ALL
  USING (auth_role() = 'admin');

-- ─── milestones ──────────────────────────────────────────────────────────────
-- Athletes see their own milestones.
-- Coaches can read and create milestones for their clients (see set_by column).
-- Admins have full access.
CREATE POLICY "milestones_athlete" ON milestones FOR ALL
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "milestones_coach" ON milestones FOR ALL
  USING    (is_my_client(user_id))
  WITH CHECK (is_my_client(user_id));
CREATE POLICY "milestones_admin_all" ON milestones FOR ALL
  USING (auth_role() = 'admin');

-- ─── coach_form_assessments ──────────────────────────────────────────────────
-- Visible only to the coach who created the record and admins.
-- Athletes NEVER see this table directly.
CREATE POLICY "form_assessments_coach_own" ON coach_form_assessments FOR ALL
  USING    (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
CREATE POLICY "form_assessments_coach_insert" ON coach_form_assessments FOR INSERT
  WITH CHECK (coach_id = auth.uid());
CREATE POLICY "form_assessments_admin_all" ON coach_form_assessments FOR ALL
  USING (auth_role() = 'admin');

-- ─── user_exercise_overrides ─────────────────────────────────────────────────
-- Athletes can read all overrides applied to them (regardless of who set them).
-- Coaches can read ALL overrides for their clients (inc. ones set by admin or
--   a previous coach), but may only write overrides they personally set.
-- Admins have full access.
CREATE POLICY "overrides_athlete_select" ON user_exercise_overrides FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "overrides_coach_select" ON user_exercise_overrides FOR SELECT
  USING (is_my_client(user_id));
CREATE POLICY "overrides_coach_write" ON user_exercise_overrides FOR ALL
  USING    (set_by = auth.uid() AND is_my_client(user_id))
  WITH CHECK (set_by = auth.uid() AND is_my_client(user_id));
CREATE POLICY "overrides_admin_all" ON user_exercise_overrides FOR ALL
  USING (auth_role() = 'admin');

-- ─── playbook_entries ────────────────────────────────────────────────────────
-- All authenticated users can read; coaches/admins can CRUD their own entries.
CREATE POLICY "playbook_entries_select_all" ON playbook_entries
  FOR SELECT USING (true);
CREATE POLICY "playbook_entries_coach_insert" ON playbook_entries
  FOR INSERT WITH CHECK (
    coach_id = auth.uid()
    AND auth_role() IN ('coach', 'admin')
  );
CREATE POLICY "playbook_entries_coach_update" ON playbook_entries
  FOR UPDATE USING (
    coach_id = auth.uid() OR auth_role() = 'admin'
  ) WITH CHECK (
    coach_id = auth.uid() OR auth_role() = 'admin'
  );
CREATE POLICY "playbook_entries_coach_delete" ON playbook_entries
  FOR DELETE USING (
    coach_id = auth.uid() OR auth_role() = 'admin'
  );
CREATE POLICY "playbook_entries_admin_all" ON playbook_entries
  FOR ALL USING (auth_role() = 'admin');

-- ─── coach_notes ─────────────────────────────────────────────────────────────
-- Policies split by operation. Athletes cannot update note content or ownership.
-- Read/dismissed tracking for athletes is handled via SECURITY DEFINER functions
-- (mark_coach_note_read / mark_coach_note_dismissed) defined below.
-- SELECT: coach who sent it, athlete who received it, admins
CREATE POLICY "coach_notes_select" ON coach_notes FOR SELECT
  USING (coach_id = auth.uid() OR user_id = auth.uid() OR auth_role() = 'admin');
-- INSERT: only coaches sending to their own clients, or admins
CREATE POLICY "coach_notes_insert" ON coach_notes FOR INSERT
  WITH CHECK (
    (coach_id = auth.uid() AND is_my_client(user_id))
    OR auth_role() = 'admin'
  );
-- UPDATE: only the sending coach or an admin may edit note content/fields
CREATE POLICY "coach_notes_update" ON coach_notes FOR UPDATE
  USING    (coach_id = auth.uid() OR auth_role() = 'admin')
  WITH CHECK (coach_id = auth.uid() OR auth_role() = 'admin');
-- DELETE: only the sending coach or an admin may delete a note
CREATE POLICY "coach_notes_delete" ON coach_notes FOR DELETE
  USING (coach_id = auth.uid() OR auth_role() = 'admin');

-- Athletes call these functions to mark notes read/dismissed.
-- SECURITY DEFINER bypasses RLS so the function can update coach_notes on the
-- athlete's behalf, scoped strictly to their own rows and only the allowed fields.
CREATE OR REPLACE FUNCTION mark_coach_note_read(p_note_id uuid)
RETURNS void AS $$
  UPDATE coach_notes
  SET read_at = now()
  WHERE id = p_note_id AND user_id = auth.uid() AND read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_coach_note_dismissed(p_note_id uuid)
RETURNS void AS $$
  UPDATE coach_notes
  SET dismissed_at = now()
  WHERE id = p_note_id AND user_id = auth.uid() AND dismissed_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Athletes fetch form assessment statuses for exercises in their session.
-- Returns only exercise_ids where the coach has marked status = 'locked_in'
-- for the requesting athlete. Private notes and partial statuses are never
-- exposed — athletes see only "Solid Form ✅" (locked_in) or nothing.
CREATE OR REPLACE FUNCTION get_my_locked_in_exercises(p_exercise_ids uuid[])
RETURNS TABLE (exercise_id uuid) AS $$
  SELECT exercise_id
  FROM coach_form_assessments
  WHERE user_id = auth.uid()
    AND status = 'locked_in'
    AND exercise_id = ANY(p_exercise_ids);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Reorder exercises atomically in a single transaction.
-- Accepts a JSONB array of {id, order_index} objects and updates each
-- template_exercises row. If any update fails, the entire batch rolls back.
CREATE OR REPLACE FUNCTION reorder_exercises(exercise_orders jsonb)
RETURNS void AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(exercise_orders)
  LOOP
    UPDATE template_exercises
    SET order_index = (item->>'order_index')::int
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- BuildBase — Initial Schema
-- Run in Supabase SQL Editor after creating project.
-- ─────────────────────────────────────────────

-- ─── PROFILES (extends Supabase auth.users) ──
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

-- ─── PROGRAMS ────────────────────────────────
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

-- ─── PHASES ──────────────────────────────────
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

-- ─── WORKOUT TEMPLATES ───────────────────────
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

-- ─── EXERCISES ───────────────────────────────
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

-- ─── TEMPLATE EXERCISES ──────────────────────
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

-- ─── USER ENROLLMENTS ────────────────────────
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

-- ─── USER EXERCISE OVERRIDES ─────────────────
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

-- ─── SESSION LOGS ────────────────────────────
CREATE TABLE session_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE,
  workout_template_id   uuid REFERENCES workout_templates(id),
  enrollment_id         uuid REFERENCES user_enrollments(id),
  week_number           int NOT NULL,
  session_number        int NOT NULL,
  started_at            timestamptz NULL,
  completed_at          timestamptz NULL,
  is_complete           boolean DEFAULT false,
  post_session_effort   int NULL CHECK (post_session_effort BETWEEN 1 AND 5),
  pre_session_soreness  int NULL CHECK (pre_session_soreness BETWEEN 1 AND 5),
  soreness_prompted     boolean DEFAULT false,
  notes                 text NULL,
  created_at            timestamptz DEFAULT now()
);

-- ─── SET LOGS ────────────────────────────────
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

-- ─── PERSONAL RECORDS ────────────────────────
CREATE TABLE personal_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id  uuid REFERENCES exercises(id),
  weight       numeric NOT NULL,
  reps         int NOT NULL,
  achieved_at  timestamptz NOT NULL,
  set_log_id   uuid REFERENCES set_logs(id)
);

-- ─── MILESTONES ──────────────────────────────
CREATE TABLE milestones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_key  text NOT NULL,
  achieved_at    timestamptz DEFAULT now(),
  notes          text NULL,
  set_by         uuid REFERENCES profiles(id) NULL,
  UNIQUE(user_id, milestone_key)
);

-- ─── COACH FORM ASSESSMENTS ──────────────────
-- Internal only — NEVER exposed to the user.
-- User sees "Solid Form ✅" only when status = locked_in.
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
  updated_at       timestamptz DEFAULT now()
);

-- ─── COACH NOTES ─────────────────────────────
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

-- ─── UPDATED_AT TRIGGER ──────────────────────
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

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────
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

-- ─── ROW LEVEL SECURITY ──────────────────────
-- Enable RLS on all tables
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
ALTER TABLE coach_notes              ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- profiles: users see own row, coaches see their clients, admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  id = auth.uid()
  OR coach_id = auth.uid()
  OR auth_role() = 'admin'
);
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (auth_role() = 'admin');

-- programs/phases/templates: everyone can read, only admin can write
CREATE POLICY "programs_read_all" ON programs FOR SELECT USING (true);
CREATE POLICY "programs_admin_write" ON programs FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "phases_read_all" ON phases FOR SELECT USING (true);
CREATE POLICY "phases_admin_write" ON phases FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "workout_templates_read_all" ON workout_templates FOR SELECT USING (true);
CREATE POLICY "workout_templates_admin_write" ON workout_templates FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "exercises_read_all" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_admin_write" ON exercises FOR ALL USING (auth_role() = 'admin');
CREATE POLICY "template_exercises_read_all" ON template_exercises FOR SELECT USING (true);
CREATE POLICY "template_exercises_admin_write" ON template_exercises FOR ALL USING (auth_role() = 'admin');

-- user_enrollments: own row + coach + admin
CREATE POLICY "enrollments_own" ON user_enrollments FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'coach' OR role = 'admin'))
);
CREATE POLICY "enrollments_admin" ON user_enrollments FOR ALL USING (auth_role() = 'admin');

-- session_logs / set_logs: own + coach of user + admin
CREATE POLICY "session_logs_own" ON session_logs FOR ALL USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'coach' OR p.role = 'admin'))
);
CREATE POLICY "set_logs_own" ON set_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM session_logs s WHERE s.id = set_logs.session_log_id AND (
    s.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'coach' OR p.role = 'admin'))
  ))
);

-- personal_records / milestones: own + coach + admin
CREATE POLICY "personal_records_own" ON personal_records FOR ALL USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'coach' OR p.role = 'admin'))
);
CREATE POLICY "milestones_own" ON milestones FOR ALL USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'coach' OR p.role = 'admin'))
);

-- coach_form_assessments: coach who wrote it + admin. NEVER user.
CREATE POLICY "form_assessments_coach_only" ON coach_form_assessments FOR ALL USING (
  coach_id = auth.uid() OR auth_role() = 'admin'
);

-- user_exercise_overrides: own user + coach who set it + admin
CREATE POLICY "overrides_own" ON user_exercise_overrides FOR SELECT USING (
  user_id = auth.uid()
  OR set_by = auth.uid()
  OR auth_role() = 'admin'
);
CREATE POLICY "overrides_write" ON user_exercise_overrides FOR ALL USING (
  set_by = auth.uid() OR auth_role() = 'admin'
);

-- coach_notes: coach sees notes they sent, user sees notes for them, admin all
CREATE POLICY "coach_notes_coach" ON coach_notes FOR ALL USING (
  coach_id = auth.uid() OR user_id = auth.uid() OR auth_role() = 'admin'
);

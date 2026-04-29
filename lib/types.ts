// ─── User / Auth ──────────────────────────────────────────────────────────────

export type UserRole = "admin" | "coach" | "user";
export type Gender = "male" | "female" | "other" | "unset";
export type TemplateTier = "pre_baseline" | "default" | "post_baseline";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  gender: Gender;
  coach_id: string | null;
  template_tier: TemplateTier;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Programs / Phases ────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  description: string | null;
  total_phases: number;
  total_weeks: number;
  created_by: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface Phase {
  id: string;
  program_id: string;
  phase_number: number;
  name: string;
  subtitle: string | null;
  week_start: number;
  week_end: number;
  description: string | null;
}

// ─── Workout Templates ────────────────────────────────────────────────────────

export type DayLabel = "A" | "B" | "C";

export interface WorkoutTemplate {
  id: string;
  phase_id: string;
  week_number: number;
  session_number: number;
  day_label: DayLabel;
  title: string;
  description: string | null;
  order_index: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  instructions: string | null;
  coaching_cues: string | null;
  video_url: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TemplateExercise {
  id: string;
  workout_template_id: string;
  exercise_id: string;
  order_index: number;
  sets_default: number;
  reps_default: number;
  weight_pre_baseline_f: number;
  weight_pre_baseline_m: number;
  weight_default_f: number;
  weight_default_m: number;
  weight_post_baseline_f: number;
  weight_post_baseline_m: number;
  superset_group: string | null;
  is_bodyweight: boolean;
  is_abs_finisher: boolean;
  coaching_cues: string | null;
  notes: string | null;
  // Joined
  exercise?: Exercise;
  // Form assessment status (only for user sessions, from coach's assessment)
  form_assessment_status?: FormAssessmentStatus | null;
}

// ─── Session Logs ─────────────────────────────────────────────────────────────

export interface SessionLog {
  id: string;
  user_id: string;
  workout_template_id: string;
  enrollment_id: string;
  week_number: number;
  session_number: number;
  started_at: string | null;
  completed_at: string | null;
  is_complete: boolean;
  post_session_effort: 1 | 2 | 3 | 4 | 5 | null;
  pre_session_soreness: 1 | 2 | 3 | 4 | 5 | null;
  soreness_prompted: boolean;
  notes: string | null;
  created_at: string;
}

export interface SetLog {
  id: string;
  session_log_id: string;
  template_exercise_id: string;
  exercise_id: string;
  set_number: number;
  weight_used: number | null;
  reps_completed: number | null;
  is_completed: boolean;
  notes: string | null;
  logged_at: string;
}

// ─── Coach ────────────────────────────────────────────────────────────────────

export type FormAssessmentStatus = "needs_cues" | "getting_there" | "locked_in";

export interface CoachFormAssessment {
  id: string;
  coach_id: string;
  user_id: string;
  exercise_id: string;
  assessment_date: string;
  status: FormAssessmentStatus;
  private_notes: string | null;
  coaching_focus: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachNote {
  id: string;
  coach_id: string;
  user_id: string;
  message: string;
  is_sent: boolean;
  sent_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// ─── Milestones / PRs ─────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  user_id: string;
  milestone_key: string;
  achieved_at: string;
  notes: string | null;
  set_by: string | null;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  achieved_at: string;
  set_log_id: string | null;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export interface UserEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  template_tier: TemplateTier;
  gender_applied: Gender;
  started_at: string;
  current_week: number;
  current_session: number;
  is_active: boolean;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface SessionWeekGroup {
  week: number;
  sessions: (SessionLog & { template?: WorkoutTemplate })[];
}

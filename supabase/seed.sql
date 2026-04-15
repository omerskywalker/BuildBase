-- ─────────────────────────────────────────────────────────────────────────────
-- BuildBase — 12-Week Default Program Seed
--
-- Run ONCE in Supabase SQL Editor on a fresh database AFTER 001_initial_schema.sql.
-- This seed is NOT idempotent — running it twice will create duplicate records.
-- To re-seed: DELETE FROM programs WHERE name = 'BuildBase 12-Week Foundation';
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  -- IDs
  prog_id       uuid := gen_random_uuid();

  phase1_id     uuid := gen_random_uuid();
  phase2_id     uuid := gen_random_uuid();
  phase3_id     uuid := gen_random_uuid();

  -- Phase 1 workout templates (weeks 1-4, sessions A/B/C × 4 weeks = 12)
  p1w1a uuid := gen_random_uuid(); p1w1b uuid := gen_random_uuid(); p1w1c uuid := gen_random_uuid();
  p1w2a uuid := gen_random_uuid(); p1w2b uuid := gen_random_uuid(); p1w2c uuid := gen_random_uuid();
  p1w3a uuid := gen_random_uuid(); p1w3b uuid := gen_random_uuid(); p1w3c uuid := gen_random_uuid();
  p1w4a uuid := gen_random_uuid(); p1w4b uuid := gen_random_uuid(); p1w4c uuid := gen_random_uuid();

  -- Phase 2 workout templates (weeks 5-8)
  p2w5a uuid := gen_random_uuid(); p2w5b uuid := gen_random_uuid(); p2w5c uuid := gen_random_uuid();
  p2w6a uuid := gen_random_uuid(); p2w6b uuid := gen_random_uuid(); p2w6c uuid := gen_random_uuid();
  p2w7a uuid := gen_random_uuid(); p2w7b uuid := gen_random_uuid(); p2w7c uuid := gen_random_uuid();
  p2w8a uuid := gen_random_uuid(); p2w8b uuid := gen_random_uuid(); p2w8c uuid := gen_random_uuid();

  -- Phase 3 workout templates (weeks 9-12)
  p3w9a  uuid := gen_random_uuid(); p3w9b  uuid := gen_random_uuid(); p3w9c  uuid := gen_random_uuid();
  p3w10a uuid := gen_random_uuid(); p3w10b uuid := gen_random_uuid(); p3w10c uuid := gen_random_uuid();
  p3w11a uuid := gen_random_uuid(); p3w11b uuid := gen_random_uuid(); p3w11c uuid := gen_random_uuid();
  p3w12a uuid := gen_random_uuid(); p3w12b uuid := gen_random_uuid(); p3w12c uuid := gen_random_uuid();

  -- Exercise IDs
  e_smith_squat       uuid := gen_random_uuid();
  e_goblet_squat      uuid := gen_random_uuid();
  e_bb_back_squat     uuid := gen_random_uuid();
  e_ham_curl          uuid := gen_random_uuid();
  e_walking_lunge     uuid := gen_random_uuid();
  e_bw_hip_thrust     uuid := gen_random_uuid();
  e_bb_hip_thrust     uuid := gen_random_uuid();
  e_db_shoulder_press uuid := gen_random_uuid();
  e_lateral_raise     uuid := gen_random_uuid();
  e_rear_delt_fly     uuid := gen_random_uuid();
  e_crunch            uuid := gen_random_uuid();
  e_leg_raise         uuid := gen_random_uuid();
  e_plank             uuid := gen_random_uuid();
  e_dead_bug          uuid := gen_random_uuid();
  e_bic_curl_sup      uuid := gen_random_uuid();
  e_skull_crusher     uuid := gen_random_uuid();
  e_hammer_curl       uuid := gen_random_uuid();
  e_tri_kickback      uuid := gen_random_uuid();
  e_rdl               uuid := gen_random_uuid();
  e_one_arm_row       uuid := gen_random_uuid();
  e_db_chest_press    uuid := gen_random_uuid();
  e_bicep_curl        uuid := gen_random_uuid();
  e_tri_pushdown      uuid := gen_random_uuid();
  e_trap_bar_dl       uuid := gen_random_uuid();
  e_conv_dl           uuid := gen_random_uuid();
  e_lat_pulldown      uuid := gen_random_uuid();
  e_seated_cable_row  uuid := gen_random_uuid();
  e_incline_pushup    uuid := gen_random_uuid();
  e_floor_pushup      uuid := gen_random_uuid();
  e_face_pull         uuid := gen_random_uuid();
  e_bicycle_crunch    uuid := gen_random_uuid();
  e_hollow_body       uuid := gen_random_uuid();

BEGIN

-- ─── Program ─────────────────────────────────────────────────────────────────
INSERT INTO programs (id, name, description, total_phases, total_weeks, version, is_active)
VALUES (
  prog_id,
  'BuildBase 12-Week Foundation',
  'A structured 3-phase beginner strength program. Phase 1 focuses on form, Phase 2 introduces progressive load, Phase 3 builds foundational strength with barbell compounds.',
  3, 12, 1, true
);

-- ─── Phases ──────────────────────────────────────────────────────────────────
INSERT INTO phases (id, program_id, phase_number, name, subtitle, week_start, week_end, description) VALUES
(phase1_id, prog_id, 1, 'Foundation',        'Form first, weight second',      1,  4,  'Build movement patterns with controlled loads. 3× 8 reps every set with 3+ reps in tank. No ego — this is where habits form.'),
(phase2_id, prog_id, 2, 'Load Introduction', 'Progressive overload begins',    5,  8,  '3×8 lower body with +5 lb weekly increments. 3×10 upper body. Day B becomes full-body.'),
(phase3_id, prog_id, 3, 'Strength',          'Compounds, power, PRs',          9,  12, '4×6 lower body. 3×12 upper body. Barbell back squat and conventional deadlift introduced.');

-- ─── Exercises ───────────────────────────────────────────────────────────────
INSERT INTO exercises (id, name, muscle_group, equipment, coaching_cues, is_active) VALUES
(e_smith_squat,       'Smith Machine Squat',       'Quads, Glutes',        'Smith Machine',    'Feet shoulder-width, toes 15° out. Break at hips and knees simultaneously. Keep chest tall, knees tracking over toes.',                            true),
(e_goblet_squat,      'Goblet Squat',              'Quads, Glutes, Core',  'Dumbbell/Kettlebell', 'Hold weight at chest. Elbows inside knees at bottom. Drive up through full foot.',                                                             true),
(e_bb_back_squat,     'Barbell Back Squat',        'Quads, Glutes, Core',  'Barbell, Rack',    'Bar on traps, not neck. Brace core before descent. Depth: hip crease below parallel. Drive knees out on ascent.',                                 true),
(e_ham_curl,          'Hamstring Curl Machine',    'Hamstrings',           'Machine',          'Slow 2-second eccentric. Squeeze at top. Do not jerk the weight up.',                                                                               true),
(e_walking_lunge,     'Walking Lunges',            'Quads, Glutes, Balance','Bodyweight/DBs',  'Big step, back knee hovers 1 inch off floor. Front knee stays above ankle. Stand fully before next step.',                                         true),
(e_bw_hip_thrust,     'Bodyweight Hip Thrust',     'Glutes',               'Bench',            'Upper back on bench edge, feet flat. Drive hips up to full extension. Squeeze glutes at top for 1 second.',                                        true),
(e_bb_hip_thrust,     'Barbell Hip Thrust',        'Glutes',               'Barbell, Bench',   'Pad on bar. Upper back on bench. Drive through heels, full hip extension. Do not hyperextend lumbar.',                                             true),
(e_db_shoulder_press, 'DB Shoulder Press',         'Shoulders',            'Dumbbells',        'Press straight up, slight forward lean acceptable. Stop just short of lockout. Control the descent.',                                              true),
(e_lateral_raise,     'Lateral Raises',            'Lateral Deltoids',     'Dumbbells',        'Slight elbow bend. Lead with elbows, not hands. Stop at shoulder height. Slow 3-second eccentric.',                                                true),
(e_rear_delt_fly,     'Rear Delt Fly',             'Rear Deltoids',        'Dumbbells',        'Hinge at hips, chest parallel to floor. Arms arc out to sides, thumbs pointing down. Squeeze shoulder blades.',                                   true),
(e_crunch,            'Crunches',                  'Abs',                  'Bodyweight',       'Hands behind head, elbows wide. Curl shoulder blades off floor — do not pull neck. Exhale at top.',                                                true),
(e_leg_raise,         'Leg Raises',                'Lower Abs',            'Bodyweight',       'Lower back pressed into floor. Legs together, lower to just above floor — do not touch. Raise controlled.',                                        true),
(e_plank,             'Plank',                     'Core',                 'Bodyweight',       'Forearms under shoulders. Hips level — no sagging or piking. Breathe. Brace as if taking a punch.',                                                true),
(e_dead_bug,          'Dead Bug',                  'Core, Anti-rotation',  'Bodyweight',       'Lower back glued to floor the entire time. Opposite arm and leg lower slowly. Exhale as limbs lower.',                                             true),
(e_bic_curl_sup,      'Supinating Bicep Curl',     'Biceps',               'Dumbbells',        'Start with palms facing in, rotate to palms-up at top. Full supination. Squeeze at top, slow on the way down.',                                   true),
(e_skull_crusher,     'Skull Crusher',             'Triceps',              'Dumbbells',        'Upper arms vertical, only forearms move. Lower to temples — do not flare elbows wide. Press straight up.',                                         true),
(e_hammer_curl,       'Hammer Curl',               'Brachialis, Biceps',   'Dumbbells',        'Neutral grip (palms facing in) throughout. Do not swing. Both arms or alternating, full range of motion.',                                         true),
(e_tri_kickback,      'Tricep Kickback',           'Triceps',              'Dumbbells',        'Hinge forward. Upper arm parallel to floor. Extend fully — squeeze tricep hard at lockout. Control descent.',                                      true),
(e_rdl,               'Romanian Deadlift',         'Hamstrings, Glutes',   'Dumbbells',        'Soft knee bend, hinge at hips. Bar (or DBs) close to legs. Feel hamstring stretch. Drive hips forward to stand.',                                 true),
(e_one_arm_row,       'One-Arm DB Row',            'Lats, Rhomboids',      'Dumbbell, Bench',  'Brace on bench. Pull elbow to hip, not shoulder. Full extension at bottom. Do not rotate torso.',                                                  true),
(e_db_chest_press,    'DB Chest Press',            'Chest, Triceps',       'Dumbbells, Bench', 'Press up and slightly together. Do not lock out. Control descent — elbows 45° from torso, not flared.',                                           true),
(e_bicep_curl,        'Bicep Curl',                'Biceps',               'Dumbbells',        'Elbows pinned to sides. No swinging. Full extension at bottom. Squeeze at top.',                                                                   true),
(e_tri_pushdown,      'Tricep Pushdown',           'Triceps',              'Cable Machine',    'Elbows at sides, press down to full extension. Squeeze. Controlled return — do not let elbows drift forward.',                                     true),
(e_trap_bar_dl,       'Trap Bar Deadlift',         'Hamstrings, Glutes, Back', 'Trap Bar',     'Stand in center of bar. Hip hinge to grip. Brace, then drive floor away. Hips and shoulders rise together.',                                      true),
(e_conv_dl,           'Conventional Deadlift',     'Posterior Chain',      'Barbell',          'Bar over mid-foot. Hip-width stance. Hinge, grip just outside shins. Brace hard. Drive hips and shoulders up together. Bar stays close.',          true),
(e_lat_pulldown,      'Lat Pulldown',              'Lats',                 'Cable Machine',    'Lean back slightly. Pull bar to upper chest, lead with elbows. Squeeze lats at bottom. Slow return.',                                              true),
(e_seated_cable_row,  'Seated Cable Row',          'Rhomboids, Lats',      'Cable Machine',    'Sit tall. Pull handle to navel — squeeze shoulder blades together. Do not rock torso. Slow controlled return.',                                    true),
(e_incline_pushup,    'Incline Push-up',           'Chest, Triceps, Core', 'Bench/Box',        'Hands on elevated surface, body straight plank. Lower chest to surface. Elbows 45°. Full range.',                                                 true),
(e_floor_pushup,      'Push-up',                   'Chest, Triceps, Core', 'Bodyweight',       'Hands shoulder-width, body rigid plank. Chest touches floor. Drive back to full arm extension.',                                                   true),
(e_face_pull,         'Face Pull',                 'Rear Delts, Rotator Cuff', 'Cable Machine', 'Rope attachment at forehead height. Pull to face, elbows flare out. External rotation at end. Non-negotiable for shoulder health.',              true),
(e_bicycle_crunch,    'Bicycle Crunches',          'Obliques, Abs',        'Bodyweight',       'Rotate shoulder to opposite knee. Full extension of leg. Do not pull neck. Slow and controlled — not a race.',                                     true),
(e_hollow_body,       'Hollow Body Hold',          'Core',                 'Bodyweight',       'Arms overhead, lower back pressed to floor. Lift legs and shoulders. Hold. The lower the legs, the harder it is — start higher.',                  true);

-- ─── Workout Templates ───────────────────────────────────────────────────────
-- Phase 1 (weeks 1–4): Day A = Legs+Shoulders, Day B = Arms, Day C = Chest+Back+DL
INSERT INTO workout_templates (id, phase_id, week_number, session_number, day_label, title, order_index) VALUES
-- Week 1
(p1w1a, phase1_id, 1, 1, 'A', 'Week 1 — Day A: Legs + Shoulders', 1),
(p1w1b, phase1_id, 1, 2, 'B', 'Week 1 — Day B: Arms',              2),
(p1w1c, phase1_id, 1, 3, 'C', 'Week 1 — Day C: Chest + Back',      3),
-- Week 2
(p1w2a, phase1_id, 2, 4, 'A', 'Week 2 — Day A: Legs + Shoulders', 4),
(p1w2b, phase1_id, 2, 5, 'B', 'Week 2 — Day B: Arms',              5),
(p1w2c, phase1_id, 2, 6, 'C', 'Week 2 — Day C: Chest + Back',      6),
-- Week 3
(p1w3a, phase1_id, 3, 7,  'A', 'Week 3 — Day A: Legs + Shoulders', 7),
(p1w3b, phase1_id, 3, 8,  'B', 'Week 3 — Day B: Arms',              8),
(p1w3c, phase1_id, 3, 9,  'C', 'Week 3 — Day C: Chest + Back',      9),
-- Week 4
(p1w4a, phase1_id, 4, 10, 'A', 'Week 4 — Day A: Legs + Shoulders', 10),
(p1w4b, phase1_id, 4, 11, 'B', 'Week 4 — Day B: Arms',              11),
(p1w4c, phase1_id, 4, 12, 'C', 'Week 4 — Day C: Chest + Back',      12);

-- Phase 2 (weeks 5–8): Day A = Legs+Shoulders, Day B = Full Body, Day C = Chest+Back+DL
INSERT INTO workout_templates (id, phase_id, week_number, session_number, day_label, title, order_index) VALUES
(p2w5a, phase2_id, 5, 13, 'A', 'Week 5 — Day A: Legs + Shoulders', 13),
(p2w5b, phase2_id, 5, 14, 'B', 'Week 5 — Day B: Full Body',         14),
(p2w5c, phase2_id, 5, 15, 'C', 'Week 5 — Day C: Chest + Back',      15),
(p2w6a, phase2_id, 6, 16, 'A', 'Week 6 — Day A: Legs + Shoulders', 16),
(p2w6b, phase2_id, 6, 17, 'B', 'Week 6 — Day B: Full Body',         17),
(p2w6c, phase2_id, 6, 18, 'C', 'Week 6 — Day C: Chest + Back',      18),
(p2w7a, phase2_id, 7, 19, 'A', 'Week 7 — Day A: Legs + Shoulders', 19),
(p2w7b, phase2_id, 7, 20, 'B', 'Week 7 — Day B: Full Body',         20),
(p2w7c, phase2_id, 7, 21, 'C', 'Week 7 — Day C: Chest + Back',      21),
(p2w8a, phase2_id, 8, 22, 'A', 'Week 8 — Day A: Legs + Shoulders', 22),
(p2w8b, phase2_id, 8, 23, 'B', 'Week 8 — Day B: Full Body',         23),
(p2w8c, phase2_id, 8, 24, 'C', 'Week 8 — Day C: Chest + Back',      24);

-- Phase 3 (weeks 9–12): Day A = Legs+Shoulders (barbell), Day B = Full Body, Day C = Chest+Back+Conv DL
INSERT INTO workout_templates (id, phase_id, week_number, session_number, day_label, title, order_index) VALUES
(p3w9a,  phase3_id, 9,  25, 'A', 'Week 9 — Day A: Legs + Shoulders',  25),
(p3w9b,  phase3_id, 9,  26, 'B', 'Week 9 — Day B: Full Body',          26),
(p3w9c,  phase3_id, 9,  27, 'C', 'Week 9 — Day C: Chest + Back',       27),
(p3w10a, phase3_id, 10, 28, 'A', 'Week 10 — Day A: Legs + Shoulders', 28),
(p3w10b, phase3_id, 10, 29, 'B', 'Week 10 — Day B: Full Body',         29),
(p3w10c, phase3_id, 10, 30, 'C', 'Week 10 — Day C: Chest + Back',      30),
(p3w11a, phase3_id, 11, 31, 'A', 'Week 11 — Day A: Legs + Shoulders', 31),
(p3w11b, phase3_id, 11, 32, 'B', 'Week 11 — Day B: Full Body',         32),
(p3w11c, phase3_id, 11, 33, 'C', 'Week 11 — Day C: Chest + Back',      33),
(p3w12a, phase3_id, 12, 34, 'A', 'Week 12 — Day A: Legs + Shoulders', 34),
(p3w12b, phase3_id, 12, 35, 'B', 'Week 12 — Day B: Full Body',         35),
(p3w12c, phase3_id, 12, 36, 'C', 'Week 12 — Day C: Chest + Back',      36);

-- ─── Template Exercises ──────────────────────────────────────────────────────
-- Weight columns: (pre_baseline_f, pre_baseline_m, default_f, default_m, post_baseline_f, post_baseline_m)
-- is_bodyweight exercises use 0 for all weight columns.
--
-- Phase 1 Day A — Legs + Shoulders
-- Smith Machine Squat → Hamstring Curl → Walking Lunge → BW Hip Thrust → DB Shoulder Press → Lateral Raises → Rear Delt Fly → Abs (Crunches + Leg Raises)

-- Helper to insert all 12 phase-1 Day A sessions identically
-- (We insert once per template to keep the seed concise but fully populated)

-- PHASE 1 — Day A sessions (4 weeks)
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p1w1a, p1w2a, p1w3a, p1w4a];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_smith_squat,       1, 3, 8,   0,    45,   45,   55,   0,    0,    false, false),  -- post_baseline skips smith → 0
    (t, e_ham_curl,          2, 3, 8,   30,   40,   40,   55,   55,   75,   false, false),
    (t, e_walking_lunge,     3, 3, 8,   0,    0,    0,    0,    0,    0,    true,  false),   -- bodyweight
    (t, e_bw_hip_thrust,     4, 3, 8,   0,    0,    0,    0,    0,    0,    true,  false),   -- BW phase 1
    (t, e_db_shoulder_press, 5, 3, 8,   5,    8,    7.5,  12.5, 12.5, 17.5, false, false),
    (t, e_lateral_raise,     6, 3, 8,   3,    5,    5,    8,    8,    10,   false, false),
    (t, e_rear_delt_fly,     7, 3, 8,   3,    5,    5,    8,    8,    10,   false, false),
    (t, e_crunch,            8, 2, 15,  0,    0,    0,    0,    0,    0,    true,  true),
    (t, e_leg_raise,         9, 2, 10,  0,    0,    0,    0,    0,    0,    true,  true);
  END LOOP;
END $inner$;

-- PHASE 1 — Day B sessions (4 weeks): Arms
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p1w1b, p1w2b, p1w3b, p1w4b];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher, superset_group) VALUES
    (t, e_bic_curl_sup,  1, 3, 8,  5,  8,  10,  15,  12.5, 17.5, false, false, 'A'),
    (t, e_skull_crusher, 2, 3, 8,  5,  8,  8,   12.5, 10,  15,   false, false, 'A'),
    (t, e_hammer_curl,   3, 3, 8,  5,  8,  10,  15,  12.5, 17.5, false, false, 'B'),
    (t, e_tri_kickback,  4, 3, 8,  3,  5,  5,   8,   8,    10,   false, false, 'B'),
    (t, e_plank,         5, 2, 0,  0,  0,  0,   0,   0,    0,    true,  true,  null),  -- reps_default=0 → time-based (20–30s)
    (t, e_dead_bug,      6, 2, 8,  0,  0,  0,   0,   0,    0,    true,  true,  null);
  END LOOP;
END $inner$;

-- PHASE 1 — Day C sessions (4 weeks): Chest + Back + Trap Bar DL
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p1w1c, p1w2c, p1w3c, p1w4c];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_trap_bar_dl,      1, 3, 8,  45,  65,  65,  95,  95,  135, false, false),  -- ALWAYS FIRST
    (t, e_lat_pulldown,     2, 3, 8,  30,  40,  40,  60,  60,  80,  false, false),
    (t, e_seated_cable_row, 3, 3, 8,  30,  40,  40,  60,  60,  80,  false, false),
    (t, e_db_chest_press,   4, 3, 8,  8,   12.5,12.5,20,  17.5,25,  false, false),
    (t, e_incline_pushup,   5, 3, 8,  0,   0,   0,   0,   0,   0,   true,  false),
    (t, e_face_pull,        6, 3, 12, 15,  20,  20,  30,  30,  40,  false, false),
    (t, e_bicycle_crunch,   7, 2, 15, 0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_hollow_body,      8, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true);   -- reps_default=0 → time-based (15–20s)
  END LOOP;
END $inner$;

-- PHASE 2 — Day A sessions (4 weeks): Goblet Squat + Barbell Hip Thrust introduced
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p2w5a, p2w6a, p2w7a, p2w8a];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_goblet_squat,      1, 3, 8,  10,  15,  15,  25,  25,  35,  false, false),
    (t, e_ham_curl,          2, 3, 8,  30,  40,  40,  55,  55,  75,  false, false),
    (t, e_walking_lunge,     3, 3, 8,  0,   0,   0,   0,   0,   0,   true,  false),
    (t, e_bb_hip_thrust,     4, 3, 8,  45,  45,  45,  65,  65,  95,  false, false),
    (t, e_db_shoulder_press, 5, 3, 10, 5,   8,   7.5, 12.5,12.5,17.5,false, false),
    (t, e_lateral_raise,     6, 3, 10, 3,   5,   5,   8,   8,   10,  false, false),
    (t, e_rear_delt_fly,     7, 3, 10, 3,   5,   5,   8,   8,   10,  false, false),
    (t, e_plank,             8, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_dead_bug,          9, 2, 8,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

-- PHASE 2 — Day B sessions (4 weeks): Full Body
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p2w5b, p2w6b, p2w7b, p2w8b];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_goblet_squat,  1, 3, 8,  10,  15,  15,  25,  25,  35,  false, false),
    (t, e_rdl,           2, 3, 8,  20,  35,  35,  55,  55,  75,  false, false),
    (t, e_one_arm_row,   3, 3, 10, 10,  15,  15,  25,  25,  35,  false, false),
    (t, e_db_chest_press,4, 3, 10, 8,   12.5,12.5,20,  17.5,25,  false, false),
    (t, e_bicep_curl,    5, 3, 10, 5,   8,   10,  15,  12.5,17.5,false, false),
    (t, e_tri_pushdown,  6, 3, 10, 10,  15,  15,  25,  25,  35,  false, false),
    (t, e_plank,         7, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_dead_bug,      8, 2, 8,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

-- PHASE 2 — Day C sessions (4 weeks): Trap Bar DL
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p2w5c, p2w6c, p2w7c, p2w8c];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_trap_bar_dl,      1, 3, 8,  45,  65,  65,  95,  95,  135, false, false),
    (t, e_lat_pulldown,     2, 3, 10, 30,  40,  40,  60,  60,  80,  false, false),
    (t, e_seated_cable_row, 3, 3, 10, 30,  40,  40,  60,  60,  80,  false, false),
    (t, e_db_chest_press,   4, 3, 10, 8,   12.5,12.5,20,  17.5,25,  false, false),
    (t, e_floor_pushup,     5, 3, 10, 0,   0,   0,   0,   0,   0,   true,  false),
    (t, e_face_pull,        6, 3, 12, 15,  20,  20,  30,  30,  40,  false, false),
    (t, e_bicycle_crunch,   7, 2, 15, 0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_hollow_body,      8, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

-- PHASE 3 — Day A sessions (4 weeks): Barbell Back Squat
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p3w9a, p3w10a, p3w11a, p3w12a];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_bb_back_squat,     1, 4, 6,  35,  55,  45,  65,  65,  95,  false, false),
    (t, e_ham_curl,          2, 4, 6,  30,  40,  40,  55,  55,  75,  false, false),
    (t, e_walking_lunge,     3, 3, 12, 0,   0,   0,   0,   0,   0,   true,  false),
    (t, e_bb_hip_thrust,     4, 4, 6,  45,  65,  65,  95,  95,  135, false, false),
    (t, e_db_shoulder_press, 5, 3, 12, 5,   8,   10,  15,  12.5,17.5,false, false),
    (t, e_lateral_raise,     6, 3, 12, 3,   5,   5,   8,   8,   10,  false, false),
    (t, e_rear_delt_fly,     7, 3, 12, 3,   5,   5,   8,   8,   10,  false, false),
    (t, e_plank,             8, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_dead_bug,          9, 2, 8,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

-- PHASE 3 — Day B sessions (4 weeks): Full Body
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p3w9b, p3w10b, p3w11b, p3w12b];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_bb_back_squat, 1, 4, 6,  35,  55,  45,  65,  65,  95,  false, false),
    (t, e_rdl,           2, 4, 6,  20,  35,  45,  65,  65,  95,  false, false),
    (t, e_one_arm_row,   3, 3, 12, 10,  15,  20,  30,  30,  40,  false, false),
    (t, e_db_chest_press,4, 3, 12, 8,   12.5,15,  22.5,20,  30,  false, false),
    (t, e_bicep_curl,    5, 3, 12, 5,   8,   10,  15,  12.5,17.5,false, false),
    (t, e_tri_pushdown,  6, 3, 12, 10,  15,  20,  30,  30,  40,  false, false),
    (t, e_plank,         7, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_dead_bug,      8, 2, 8,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

-- PHASE 3 — Day C sessions (4 weeks): Conventional Deadlift
DO $inner$
DECLARE
  templates uuid[] := ARRAY[p3w9c, p3w10c, p3w11c, p3w12c];
  t uuid;
BEGIN
  FOREACH t IN ARRAY templates LOOP
    INSERT INTO template_exercises (workout_template_id, exercise_id, order_index, sets_default, reps_default,
      weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m, weight_post_baseline_f, weight_post_baseline_m,
      is_bodyweight, is_abs_finisher) VALUES
    (t, e_conv_dl,          1, 4, 6,  65,  95,  95,  135, 135, 185, false, false),  -- ALWAYS FIRST
    (t, e_lat_pulldown,     2, 3, 12, 30,  40,  45,  65,  65,  85,  false, false),
    (t, e_seated_cable_row, 3, 3, 12, 30,  40,  45,  65,  65,  85,  false, false),
    (t, e_db_chest_press,   4, 3, 12, 8,   12.5,15,  22.5,20,  30,  false, false),
    (t, e_floor_pushup,     5, 3, 12, 0,   0,   0,   0,   0,   0,   true,  false),
    (t, e_face_pull,        6, 3, 15, 15,  20,  20,  30,  30,  40,  false, false),
    (t, e_bicycle_crunch,   7, 2, 15, 0,   0,   0,   0,   0,   0,   true,  true),
    (t, e_hollow_body,      8, 2, 0,  0,   0,   0,   0,   0,   0,   true,  true);
  END LOOP;
END $inner$;

END $$;

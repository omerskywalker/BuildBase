import { Router } from "express";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthUser } from "../lib/supabase";

const router = Router();

async function requireAdmin(req: any, res: any) {
  const auth = await getAuthUser(req, res);
  if (!auth) return null;
  const { user, supabase } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return { user, supabase, profile };
}

async function requireAdminOrCoach(req: any, res: any) {
  const auth = await getAuthUser(req, res);
  if (!auth) return null;
  const { user, supabase } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "coach"].includes(profile.role)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return { user, supabase, profile };
}

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/users", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { data: users, error } = await supabase
      .from("profiles")
      .select("*, coach:coach_id(id, full_name, email)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch users" });
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { id, role, coach_id, template_tier, full_name, gender } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required" });

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (coach_id !== undefined) updateData.coach_id = coach_id;
    if (template_tier !== undefined) updateData.template_tier = template_tier;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (gender !== undefined) updateData.gender = gender;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update user" });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required" });
    if (id === user.id) return res.status(400).json({ error: "Cannot delete your own account" });

    const { error } = await supabase
      .from("profiles")
      .update({ role: "user", coach_id: null })
      .eq("id", id);

    if (error) return res.status(500).json({ error: "Failed to deactivate user" });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/create", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;

    const { email, password, full_name, gender, role, coach_id, template_tier } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const validRoles = ["user", "coach", "admin"];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

    const validGenders = ["male", "female", "other", "unset"];
    if (gender && !validGenders.includes(gender)) return res.status(400).json({ error: "Invalid gender" });

    const validTiers = ["pre_baseline", "default", "post_baseline"];
    if (template_tier && !validTiers.includes(template_tier)) return res.status(400).json({ error: "Invalid template tier" });

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return res.status(500).json({ error: "Server configuration error" });

    const adminClient = createSupabaseClient(
      process.env.VITE_SUPABASE_URL!.trim(),
      serviceRoleKey
    );

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return res.status(409).json({ error: "A user with this email already exists" });
      }
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) return res.status(500).json({ error: "Failed to create user" });

    await adminClient.from("profiles").update({
      full_name: full_name || null,
      gender: gender || "unset",
      role: role || "user",
      coach_id: coach_id || null,
      template_tier: template_tier || "default",
      onboarding_done: true,
    }).eq("id", authData.user.id);

    const { data: createdProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return res.status(201).json({ user: createdProfile || { id: authData.user.id, email } });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────

router.get("/programs", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { data: programs, error } = await supabase
      .from("programs")
      .select("*, phases(*)")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch programs" });
    return res.json(programs);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { data: program, error } = await supabase
      .from("programs")
      .select("*, phases(*)")
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ error: "Program not found" });
      return res.status(500).json({ error: "Failed to fetch program" });
    }

    if (program.phases) {
      program.phases.sort((a: any, b: any) => a.phase_number - b.phase_number);
    }

    return res.json(program);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/programs", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { id, name, description, total_phases, total_weeks } = req.body;
    if (!id) return res.status(400).json({ error: "Program ID is required" });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (total_phases !== undefined) updateData.total_phases = total_phases;
    if (total_weeks !== undefined) updateData.total_weeks = total_weeks;

    const { data, error } = await supabase
      .from("programs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update program" });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/programs/:id/phases", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { phaseId, name, subtitle, week_start, week_end, description } = req.body;
    if (!phaseId) return res.status(400).json({ error: "Phase ID is required" });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (week_start !== undefined) updateData.week_start = week_start;
    if (week_end !== undefined) updateData.week_end = week_end;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from("phases")
      .update(updateData)
      .eq("id", phaseId)
      .eq("program_id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update phase" });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Session editor
router.post("/programs/:programId/session-editor/exercises", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { sessionId, exerciseId, orderIndex } = req.body;
    if (!sessionId || !exerciseId || typeof orderIndex !== "number") {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) return res.status(404).json({ error: "Exercise not found" });

    const { data: templateExercise, error: insertError } = await supabase
      .from("template_exercises")
      .insert({
        workout_template_id: sessionId,
        exercise_id: exerciseId,
        order_index: orderIndex,
        sets_default: 3,
        reps_default: 8,
        weight_pre_baseline_f: 0,
        weight_pre_baseline_m: 0,
        weight_default_f: 0,
        weight_default_m: 0,
        weight_post_baseline_f: 0,
        weight_post_baseline_m: 0,
        is_bodyweight: false,
        is_abs_finisher: false,
      })
      .select("*, exercise:exercises(*)")
      .single();

    if (insertError) return res.status(500).json({ error: "Failed to add exercise" });
    return res.json({ templateExercise });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/programs/:programId/session-editor/exercises/:exerciseId", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { data: templateExercise, error } = await supabase
      .from("template_exercises")
      .update(req.body)
      .eq("id", req.params.exerciseId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update exercise" });
    return res.json({ templateExercise });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/programs/:programId/session-editor/exercises/:exerciseId", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { error } = await supabase
      .from("template_exercises")
      .delete()
      .eq("id", req.params.exerciseId);

    if (error) return res.status(500).json({ error: "Failed to delete exercise" });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/programs/:programId/session-editor/reorder", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { sessionId, exercises } = req.body;
    if (!sessionId || !Array.isArray(exercises)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await Promise.all(
      exercises.map(({ id, order_index }: any) =>
        supabase.from("template_exercises").update({ order_index }).eq("id", id)
      )
    );

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── EXERCISES ────────────────────────────────────────────────────────────────

router.get("/exercises", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { search, muscle_group, is_active } = req.query as any;

    let query = supabase.from("exercises").select("*").order("name", { ascending: true });
    if (search) query = query.ilike("name", `%${search}%`);
    if (muscle_group && muscle_group !== "all") query = query.eq("muscle_group", muscle_group);
    if (is_active !== undefined && is_active !== null) query = query.eq("is_active", is_active === "true");

    const { data: exercises, error } = await query;
    if (error) return res.status(500).json({ error: "Failed to fetch exercises" });
    return res.json(exercises);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/exercises", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { name, muscle_group, equipment, instructions, coaching_cues, video_url, is_active = true } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Exercise name is required" });

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (existing) return res.status(400).json({ error: "Exercise with this name already exists" });

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        name: name.trim(),
        muscle_group: muscle_group?.trim() || null,
        equipment: equipment?.trim() || null,
        instructions: instructions?.trim() || null,
        coaching_cues: coaching_cues?.trim() || null,
        video_url: video_url?.trim() || null,
        created_by: user.id,
        is_active,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to create exercise" });
    return res.status(201).json(exercise);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/exercises", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { id, name, muscle_group, equipment, instructions, coaching_cues, video_url, is_active } = req.body;
    if (!id) return res.status(400).json({ error: "Exercise ID is required" });
    if (!name?.trim()) return res.status(400).json({ error: "Exercise name is required" });

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", name.trim())
      .neq("id", id)
      .single();

    if (existing) return res.status(400).json({ error: "Another exercise with this name already exists" });

    const updateData: any = {
      name: name.trim(),
      muscle_group: muscle_group?.trim() || null,
      equipment: equipment?.trim() || null,
      instructions: instructions?.trim() || null,
      coaching_cues: coaching_cues?.trim() || null,
      video_url: video_url?.trim() || null,
    };
    if (typeof is_active === "boolean") updateData.is_active = is_active;

    const { data: exercise, error } = await supabase
      .from("exercises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update exercise" });
    return res.json(exercise);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/exercises", async (req, res) => {
  try {
    const auth = await requireAdmin(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Exercise ID is required" });

    const { data: usageCount } = await supabase
      .from("template_exercises")
      .select("id", { count: "exact" })
      .eq("exercise_id", id);

    if (usageCount && usageCount.length > 0) {
      const { error } = await supabase.from("exercises").update({ is_active: false }).eq("id", id);
      if (error) return res.status(500).json({ error: "Failed to deactivate exercise" });
      return res.json({ success: true, message: "Exercise deactivated (still used in templates)" });
    } else {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) return res.status(500).json({ error: "Failed to delete exercise" });
      return res.json({ success: true, message: "Exercise deleted" });
    }
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── OVERRIDES ────────────────────────────────────────────────────────────────

router.get("/overrides", async (req, res) => {
  try {
    const auth = await requireAdminOrCoach(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ error: "user_id parameter is required" });

    const { data: overrides, error } = await supabase
      .from("user_exercise_overrides")
      .select("*, template_exercise:template_exercise_id(*, exercise:exercise_id(*)), set_by_profile:set_by(id, full_name, email)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch overrides" });
    return res.json(overrides);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/overrides", async (req, res) => {
  try {
    const auth = await requireAdminOrCoach(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { user_id, template_exercise_id, sets_override, reps_override, weight_override, notes } = req.body;
    if (!user_id || !template_exercise_id) {
      return res.status(400).json({ error: "user_id and template_exercise_id are required" });
    }

    const { data: existingOverride } = await supabase
      .from("user_exercise_overrides")
      .select("id")
      .eq("user_id", user_id)
      .eq("template_exercise_id", template_exercise_id)
      .single();

    const overrideData = {
      user_id,
      template_exercise_id,
      sets_override: sets_override || null,
      reps_override: reps_override || null,
      weight_override: weight_override || null,
      notes: notes || null,
      set_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const selectQuery = "*, template_exercise:template_exercise_id(*, exercise:exercise_id(*)), set_by_profile:set_by(id, full_name, email)";

    let result;
    if (existingOverride) {
      const { data, error } = await supabase
        .from("user_exercise_overrides")
        .update(overrideData)
        .eq("id", existingOverride.id)
        .select(selectQuery)
        .single();
      if (error) return res.status(500).json({ error: "Failed to update override" });
      result = data;
    } else {
      const { data, error } = await supabase
        .from("user_exercise_overrides")
        .insert([overrideData])
        .select(selectQuery)
        .single();
      if (error) return res.status(500).json({ error: "Failed to create override" });
      result = data;
    }

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/overrides", async (req, res) => {
  try {
    const auth = await requireAdminOrCoach(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Override ID is required" });

    const { error } = await supabase.from("user_exercise_overrides").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Failed to delete override" });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/overrides/users", async (req, res) => {
  try {
    const auth = await requireAdminOrCoach(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const userId = req.query.user_id as string;
    if (!userId) return res.status(400).json({ error: "user_id parameter is required" });

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_enrollments")
      .select("*, program:program_id(*, phases(*, workout_templates(*, template_exercises(*, exercise:exercise_id(*)))))")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(404).json({ error: "User is not enrolled in any program" });
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, gender, template_tier")
      .eq("id", userId)
      .single();

    const { data: overrides } = await supabase
      .from("user_exercise_overrides")
      .select("*")
      .eq("user_id", userId);

    const overrideMap: Record<string, any> = {};
    overrides?.forEach((o: any) => { overrideMap[o.template_exercise_id] = o; });

    return res.json({ user: userProfile, enrollment, overrides: overrideMap });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

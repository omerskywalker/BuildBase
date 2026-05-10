import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

// GET /api/coach/notes
router.get("/notes", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const userId = req.query.userId as string | undefined;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    let query = supabase.from("coach_notes").select(`
      id, coach_id, user_id, message, is_sent, sent_at, read_at, dismissed_at, created_at,
      profiles!coach_notes_coach_id_fkey(full_name, email),
      profiles!coach_notes_user_id_fkey(full_name, email)
    `);

    if (profile.role === "coach") {
      query = userId
        ? query.eq("coach_id", user.id).eq("user_id", userId)
        : query.eq("coach_id", user.id);
    } else if (profile.role === "user") {
      query = query.eq("user_id", user.id);
    } else if (profile.role === "admin" && userId) {
      query = query.eq("user_id", userId);
    }

    const { data: notes, error } = await query.order("sent_at", { ascending: false });
    if (error) return res.status(500).json({ error: "Failed to fetch notes" });

    return res.json(notes || []);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coach/notes
router.post("/notes", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { message, userId } = req.body;
    if (!message || !userId) {
      return res.status(400).json({ error: "Message and user ID are required" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Only coaches and admins can send notes" });
    }

    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, coach_id")
      .eq("id", userId)
      .single();

    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (profile.role === "coach" && targetUser.coach_id !== user.id) {
      return res.status(403).json({ error: "You can only send notes to your clients" });
    }

    const { data: note, error } = await supabase
      .from("coach_notes")
      .insert({
        coach_id: user.id,
        user_id: userId,
        message: message.trim(),
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to create note" });
    return res.json(note);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/coach/notes/:id
router.delete("/notes/:id", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: note } = await supabase
      .from("coach_notes")
      .select("id, coach_id, user_id, read_at")
      .eq("id", req.params.id)
      .single();

    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.coach_id !== user.id) return res.status(403).json({ error: "You can only unsend your own notes" });
    if (note.read_at) return res.status(400).json({ error: "Cannot unsend note that has been read" });

    const { error } = await supabase.from("coach_notes").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed to unsend note" });

    return res.json({ message: "Note unsent successfully" });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/coach/notes/:id
router.patch("/notes/:id", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { action } = req.body;
    if (!action || !["read", "dismiss"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'read' or 'dismiss'" });
    }

    const { data: note } = await supabase
      .from("coach_notes")
      .select("id, coach_id, user_id, read_at")
      .eq("id", req.params.id)
      .single();

    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.user_id !== user.id) {
      return res.status(403).json({ error: "You can only mark your own notes as read or dismissed" });
    }

    const updateData: any = {};
    const now = new Date().toISOString();
    if (action === "read") {
      updateData.read_at = now;
    } else {
      updateData.dismissed_at = now;
      if (!note.read_at) updateData.read_at = now;
    }

    const { data: updatedNote, error } = await supabase
      .from("coach_notes")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: `Failed to mark note as ${action}` });
    return res.json(updatedNote);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coach/form-assessment
router.get("/form-assessment", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const clientId = req.query.clientId as string;
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (profile.role === "coach") {
      const { data: client } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .single();
      if (!client) return res.status(404).json({ error: "Client not found" });
    }

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("program_id")
      .eq("user_id", clientId)
      .eq("is_active", true)
      .single();

    if (!enrollment) return res.json({ exercises: [] });

    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .eq("program_id", enrollment.program_id);

    if (!phases?.length) return res.json({ exercises: [] });

    const { data: templates } = await supabase
      .from("workout_templates")
      .select("id")
      .in("phase_id", phases.map((p: any) => p.id));

    if (!templates?.length) return res.json({ exercises: [] });

    const { data: exercisesData } = await supabase
      .from("template_exercises")
      .select("exercise_id, exercises!inner(id, name, muscle_group, equipment)")
      .in("workout_template_id", templates.map((t: any) => t.id));

    if (!exercisesData) return res.json({ exercises: [] });

    type ExInfo = { id: string; name: string; muscle_group: string; equipment: string };
    const uniqueExercises = Array.from(
      new Map(exercisesData.map((item: any) => {
        const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
        return [item.exercise_id, ex as ExInfo];
      })).values()
    );

    const exerciseIds = uniqueExercises.map((ex: any) => ex.id);
    const { data: assessments } = await supabase
      .from("coach_form_assessments")
      .select("*")
      .eq("user_id", clientId)
      .eq("coach_id", user.id)
      .in("exercise_id", exerciseIds);

    const exercisesWithAssessments = uniqueExercises
      .map((exercise: any) => ({
        ...exercise,
        assessment: assessments?.find((a: any) => a.exercise_id === exercise.id) || null,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return res.json({ exercises: exercisesWithAssessments });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coach/form-assessment
router.post("/form-assessment", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { clientId, exerciseId, status, privateNotes } = req.body;

    if (!clientId || !exerciseId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["needs_cues", "getting_there", "locked_in"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (profile.role === "coach") {
      const { data: client } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .single();
      if (!client) return res.status(404).json({ error: "Client not found" });
    }

    const { data: exercise } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", exerciseId)
      .single();
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });

    const { data: assessment, error } = await supabase
      .from("coach_form_assessments")
      .upsert({
        coach_id: user.id,
        user_id: clientId,
        exercise_id: exerciseId,
        status,
        private_notes: privateNotes || null,
        assessment_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to save assessment" });
    return res.json({ assessment });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

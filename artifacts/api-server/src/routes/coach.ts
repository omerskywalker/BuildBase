import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

interface NoteUpdateBody {
  action: "read" | "dismiss";
}

interface NoteCreateBody {
  message: string;
  userId: string;
}

interface FormAssessmentBody {
  clientId: string;
  exerciseId: string;
  status: string;
  privateNotes: string | null;
}

// GET /api/coach/clients
router.get("/clients", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data: clients } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("coach_id", user.id)
      .eq("role", "user");

    if (!clients || clients.length === 0) return res.json([]);

    const clientIds = (clients as { id: string }[]).map(c => c.id);

    const { data: enrollments } = await supabase
      .from("user_enrollments")
      .select("user_id, current_week, current_session, started_at")
      .in("user_id", clientIds)
      .eq("is_active", true);

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("user_id, is_complete, completed_at")
      .in("user_id", clientIds);

    const logs = sessionLogs ?? [];

    const result = (clients as { id: string; full_name: string | null; email: string }[]).map(client => {
      const enrollment = (enrollments ?? []).find(
        (e: { user_id: string }) => e.user_id === client.id
      );
      const clientLogs = logs.filter((l: { user_id: string }) => l.user_id === client.id);
      const completedLogs = clientLogs.filter((l: { is_complete: boolean }) => l.is_complete);
      const lastLog = completedLogs
        .filter((l: { completed_at: string | null }) => l.completed_at)
        .sort((a: { completed_at: string }, b: { completed_at: string }) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )[0];

      const total = clientLogs.length;
      const completed = completedLogs.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        current_week: enrollment?.current_week ?? 1,
        current_session: enrollment?.current_session ?? 1,
        last_session_date: lastLog?.completed_at ?? null,
        completion_rate: completionRate,
        total_sessions: total,
        completed_sessions: completed,
      };
    });

    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coach/clients/:id
router.get("/clients/:id", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const clientId = req.params.id;

    const { data: client } = await supabase
      .from("profiles")
      .select("id, full_name, email, gender, template_tier, coach_id")
      .eq("id", clientId)
      .single();

    if (!client) return res.status(404).json({ error: "Client not found" });
    if (profile.role === "coach" && client.coach_id !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("current_week, current_session, started_at")
      .eq("user_id", clientId)
      .eq("is_active", true)
      .single();

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("is_complete")
      .eq("user_id", clientId);

    const logs = sessionLogs ?? [];
    const total = logs.length;
    const completed = logs.filter((l: { is_complete: boolean }) => l.is_complete).length;

    return res.json({
      id: client.id,
      full_name: client.full_name,
      email: client.email,
      gender: client.gender,
      template_tier: client.template_tier,
      current_week: enrollment?.current_week ?? 1,
      current_session: enrollment?.current_session ?? 1,
      enrollment_started: enrollment?.started_at ?? null,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      total_sessions: total,
      completed_sessions: completed,
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coach/clients/:id/sessions
router.get("/clients/:id/sessions", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const clientId = req.params.id;

    if (profile.role === "coach") {
      const { data: client } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", clientId)
        .single();
      if (!client || client.coach_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select(`
        id, week_number, session_number, started_at, completed_at, is_complete,
        post_session_effort, pre_session_soreness, notes,
        workout_templates(title, day_label)
      `)
      .eq("user_id", clientId)
      .order("completed_at", { ascending: false })
      .limit(20);

    const logList = sessionLogs ?? [];
    const logIds = logList.map((s: { id: string }) => s.id);

    const { data: setCounts } = await supabase
      .from("set_logs")
      .select("session_log_id")
      .in("session_log_id", logIds)
      .eq("is_completed", true);

    const setCountMap = new Map<string, number>();
    for (const s of setCounts ?? []) {
      const id = (s as { session_log_id: string }).session_log_id;
      setCountMap.set(id, (setCountMap.get(id) ?? 0) + 1);
    }

    const result = logList.map((s: {
      id: string;
      week_number: number;
      session_number: number;
      started_at: string | null;
      completed_at: string | null;
      is_complete: boolean;
      post_session_effort: number | null;
      pre_session_soreness: number | null;
      notes: string | null;
      workout_templates: { title: string; day_label: string } | { title: string; day_label: string }[] | null;
    }) => {
      const tmpl = Array.isArray(s.workout_templates) ? s.workout_templates[0] ?? null : s.workout_templates;
      return {
        id: s.id,
        week_number: s.week_number,
        session_number: s.session_number,
        started_at: s.started_at,
        completed_at: s.completed_at,
        is_complete: s.is_complete,
        post_session_effort: s.post_session_effort,
        pre_session_soreness: s.pre_session_soreness,
        notes: s.notes,
        template: tmpl,
        set_count: setCountMap.get(s.id) ?? 0,
      };
    });

    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coach/notes
router.get("/notes", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const userId = req.query.userId as string | undefined;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
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
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coach/notes
router.post("/notes", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { message, userId } = req.body as NoteCreateBody;
    if (!message || !userId) {
      return res.status(400).json({ error: "Message and user ID are required" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
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
  } catch {
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
      .select("id, coach_id, read_at")
      .eq("id", req.params.id)
      .single();

    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.coach_id !== user.id) return res.status(403).json({ error: "You can only unsend your own notes" });
    if (note.read_at) return res.status(400).json({ error: "Cannot unsend note that has been read" });

    const { error } = await supabase.from("coach_notes").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: "Failed to unsend note" });

    return res.json({ message: "Note unsent successfully" });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/coach/notes/:id
// Athletes mark notes read/dismissed via SECURITY DEFINER RPC functions so they
// cannot gain unrestricted UPDATE access to the coach_notes table.
router.patch("/notes/:id", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { action } = req.body as NoteUpdateBody;
    if (!action || !["read", "dismiss"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'read' or 'dismiss'" });
    }

    const { data: note } = await supabase
      .from("coach_notes")
      .select("id, user_id, read_at")
      .eq("id", req.params.id)
      .single();

    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.user_id !== user.id) {
      return res.status(403).json({ error: "You can only mark your own notes as read or dismissed" });
    }

    const noteId = req.params.id;

    if (action === "read") {
      const { error } = await supabase.rpc("mark_coach_note_read", { p_note_id: noteId });
      if (error) return res.status(500).json({ error: "Failed to mark note as read" });
    } else {
      if (!note.read_at) {
        const { error } = await supabase.rpc("mark_coach_note_read", { p_note_id: noteId });
        if (error) return res.status(500).json({ error: "Failed to mark note as read" });
      }
      const { error } = await supabase.rpc("mark_coach_note_dismissed", { p_note_id: noteId });
      if (error) return res.status(500).json({ error: "Failed to dismiss note" });
    }

    const { data: updatedNote, error: fetchError } = await supabase
      .from("coach_notes")
      .select()
      .eq("id", noteId)
      .single();

    if (fetchError) return res.status(500).json({ error: `Failed to fetch updated note` });
    return res.json(updatedNote);
  } catch {
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
      .in("phase_id", (phases as { id: string }[]).map(p => p.id));

    if (!templates?.length) return res.json({ exercises: [] });

    const { data: exercisesData } = await supabase
      .from("template_exercises")
      .select("exercise_id, exercises!inner(id, name, muscle_group, equipment)")
      .in("workout_template_id", (templates as { id: string }[]).map(t => t.id));

    if (!exercisesData) return res.json({ exercises: [] });

    interface ExInfo { id: string; name: string; muscle_group: string; equipment: string }

    const exerciseMap = new Map<string, ExInfo>();
    for (const item of exercisesData as { exercise_id: string; exercises: ExInfo | ExInfo[] }[]) {
      const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
      if (ex && !exerciseMap.has(item.exercise_id)) {
        exerciseMap.set(item.exercise_id, ex);
      }
    }
    const uniqueExercises = Array.from(exerciseMap.values());
    const exerciseIds = uniqueExercises.map(ex => ex.id);

    const { data: assessments } = await supabase
      .from("coach_form_assessments")
      .select("*")
      .eq("user_id", clientId)
      .eq("coach_id", user.id)
      .in("exercise_id", exerciseIds);

    const exercisesWithAssessments = uniqueExercises
      .map(exercise => ({
        ...exercise,
        assessment: (assessments ?? []).find((a: { exercise_id: string }) => a.exercise_id === exercise.id) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ exercises: exercisesWithAssessments });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coach/form-assessment
router.post("/form-assessment", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { clientId, exerciseId, status, privateNotes } = req.body as FormAssessmentBody;

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
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

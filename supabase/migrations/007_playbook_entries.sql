-- ─────────────────────────────────────────────────────────────────────────────
-- 007_playbook_entries.sql
-- Database-backed playbook entries for coaches
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE playbook_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  content    text NOT NULL,
  category   text,
  coach_id   uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER playbook_entries_updated_at
  BEFORE UPDATE ON playbook_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE playbook_entries ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read playbook entries
CREATE POLICY "playbook_entries_select_all" ON playbook_entries
  FOR SELECT USING (true);

-- Coaches can insert their own entries
CREATE POLICY "playbook_entries_coach_insert" ON playbook_entries
  FOR INSERT WITH CHECK (
    coach_id = auth.uid()
    AND auth_role() IN ('coach', 'admin')
  );

-- Coaches can update their own entries; admins can update any
CREATE POLICY "playbook_entries_coach_update" ON playbook_entries
  FOR UPDATE USING (
    coach_id = auth.uid() OR auth_role() = 'admin'
  ) WITH CHECK (
    coach_id = auth.uid() OR auth_role() = 'admin'
  );

-- Coaches can delete their own entries; admins can delete any
CREATE POLICY "playbook_entries_coach_delete" ON playbook_entries
  FOR DELETE USING (
    coach_id = auth.uid() OR auth_role() = 'admin'
  );

-- Admins have full access
CREATE POLICY "playbook_entries_admin_all" ON playbook_entries
  FOR ALL USING (auth_role() = 'admin');

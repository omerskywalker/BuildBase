-- Allow users to create their own enrollment during onboarding.
-- The existing "enrollments_own" policy only covers SELECT.
-- The "enrollments_admin" policy covers ALL but only for admins.
CREATE POLICY "enrollments_self_insert" ON user_enrollments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

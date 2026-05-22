-- Add explicit INSERT policy for coach_form_assessments.
-- The existing FOR ALL policy (form_assessments_coach_own) covers this implicitly,
-- but an explicit INSERT WITH CHECK makes the intent unambiguous and guards against
-- future policy changes that might narrow the FOR ALL scope.

CREATE POLICY form_assessments_coach_insert
  ON coach_form_assessments
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

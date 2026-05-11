-- Add unique constraint to prevent duplicate form assessments per coach/user/exercise combination
ALTER TABLE coach_form_assessments 
ADD CONSTRAINT unique_coach_user_exercise UNIQUE (coach_id, user_id, exercise_id);
-- Migration: Add reorder_exercises RPC function
-- Wraps exercise reorder in a database transaction to prevent partial state
-- when one update fails in a batch.

CREATE OR REPLACE FUNCTION reorder_exercises(exercise_orders jsonb)
RETURNS void AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(exercise_orders)
  LOOP
    UPDATE template_exercises
    SET order_index = (item->>'order_index')::int
    WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

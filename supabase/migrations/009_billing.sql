-- Add billing columns to profiles for Stripe subscription tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

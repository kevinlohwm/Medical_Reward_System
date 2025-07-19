/*
  # Fix promotions table INSERT policy

  1. Security Updates
    - Drop existing conflicting policies
    - Add specific INSERT policy for admin users
    - Ensure proper role checking mechanism

  This migration fixes the RLS violation when admin users try to create promotions.
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;

-- Create specific policies for different operations
CREATE POLICY "admins_can_insert_promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "admins_can_update_promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "admins_can_delete_promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "authenticated_can_view_active_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "admins_can_view_all_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
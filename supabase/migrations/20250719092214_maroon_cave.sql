/*
  # Fix promotions table RLS policies

  1. Security Changes
    - Drop existing conflicting policies
    - Create new policies that use uid() function to check admin role
    - Use the same pattern as working users table policies
    - Ensure admin users can create, read, update, and delete promotions

  2. Policy Details
    - INSERT: Allow admin users to create promotions
    - SELECT: Allow admin users to view all promotions, authenticated users to view active ones
    - UPDATE: Allow admin users to modify promotions
    - DELETE: Allow admin users to delete promotions
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "admins_can_delete_promotions" ON promotions;
DROP POLICY IF EXISTS "admins_can_insert_promotions" ON promotions;
DROP POLICY IF EXISTS "admins_can_update_promotions" ON promotions;
DROP POLICY IF EXISTS "admins_can_view_all_promotions" ON promotions;
DROP POLICY IF EXISTS "authenticated_can_view_active_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_can_insert_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_can_update_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_can_delete_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_can_view_all_promotions" ON promotions;

-- Create new policies using the same pattern as users table
CREATE POLICY "admin_users_can_insert_promotions"
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

CREATE POLICY "admin_users_can_update_promotions"
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

CREATE POLICY "admin_users_can_delete_promotions"
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

CREATE POLICY "admin_users_can_view_all_promotions"
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

CREATE POLICY "authenticated_users_can_view_active_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (is_active = true);
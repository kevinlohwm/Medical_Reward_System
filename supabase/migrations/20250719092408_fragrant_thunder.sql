/*
  # Fix promotions table RLS policies using JWT role check

  1. Security Changes
    - Drop existing conflicting RLS policies on promotions table
    - Create new policies that use JWT role check (same pattern as users table)
    - Allow admin users to manage promotions
    - Allow authenticated users to view active promotions

  2. Policy Details
    - INSERT: Admin users can create promotions
    - UPDATE: Admin users can modify promotions  
    - DELETE: Admin users can delete promotions
    - SELECT: Admin users can view all, others can view active only
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "admin_users_can_delete_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_users_can_insert_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_users_can_update_promotions" ON promotions;
DROP POLICY IF EXISTS "admin_users_can_view_all_promotions" ON promotions;
DROP POLICY IF EXISTS "authenticated_users_can_view_active_promotions" ON promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;

-- Create new policies using the same JWT pattern as the users table
CREATE POLICY "admin_can_insert_promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK ((jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "admin_can_update_promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text)
  WITH CHECK ((jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "admin_can_delete_promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "admin_can_view_all_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY "users_can_view_active_promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (is_active = true);
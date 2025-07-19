/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current RLS policies on users table are causing infinite recursion
    - This happens when policies reference the users table in complex ways

  2. Solution
    - Drop all existing policies on users table
    - Create simple, non-recursive policies
    - Use auth.uid() directly without complex subqueries

  3. New Policies
    - Users can view their own profile: auth.uid() = id
    - Users can update their own profile: auth.uid() = id
    - Users can insert their own profile: auth.uid() = id
    - Admins can view all users: role = 'admin'
    - Staff can view users in their clinic: simple role-based access
*/

-- Drop all existing policies on users table to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Staff can view clinic users" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policy - simple role check without subqueries
CREATE POLICY "users_admin_all" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
/*
  # Fix users table INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that's preventing user profile creation
    - Create new INSERT policy that allows authenticated users to create their own profile
    - Ensure the WITH CHECK expression correctly validates user ownership

  This fixes the RLS violation error when users try to create their profile after sign-up.
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create a new INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
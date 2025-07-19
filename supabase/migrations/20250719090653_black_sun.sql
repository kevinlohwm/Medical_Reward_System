/*
  # Fix promotions table RLS policies

  1. Security Updates
    - Drop existing conflicting policies
    - Add proper INSERT policy for admin users
    - Ensure admin users can create promotions

  2. Changes
    - Remove any conflicting policies that might prevent inserts
    - Add clear INSERT policy for admin role
    - Maintain existing SELECT policies
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;

-- Add specific policies for different operations
CREATE POLICY "Admins can insert promotions"
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

CREATE POLICY "Admins can update promotions"
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

CREATE POLICY "Admins can delete promotions"
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

CREATE POLICY "Anyone can view active promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all promotions"
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
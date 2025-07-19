/*
  # Add missing RLS policies for system_config table

  1. Security
    - Add INSERT policy for admins to create system config
    - Add UPDATE policy for admins to modify system config
    
  These policies allow users with 'admin' role to insert and update system configuration.
*/

-- Add INSERT policy for admins
CREATE POLICY "Admins can insert system config"
  ON system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );

-- Add UPDATE policy for admins  
CREATE POLICY "Admins can update system config"
  ON system_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
    )
  );
-- Migration for notifications table
-- This table stores user notifications for price alerts and other events

-- Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy to allow users to read their own notifications
CREATE POLICY "Users can read their own notifications" 
  ON notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own notifications
CREATE POLICY "Users can update their own notifications" 
  ON notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
  ON notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add a comment to the table
COMMENT ON TABLE notifications IS 'User notifications for price alerts and other events';

-- user_messages uses sender_id/receiver_id instead of user_id
-- Run this alone in a separate SQL Editor execution
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_name VARCHAR(255) NOT NULL DEFAULT '',
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_name VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_receiver ON user_messages(receiver_id);

-- ============================================================================
-- STEP FINAL: Re-add tables to supabase_realtime publication
-- Run this LAST, after all tables are successfully created.
-- This only applies if you ran STEP A from migration-step3c-blockchain.sql
-- (i.e. you dropped and recreated the publication)
-- ============================================================================

-- Add all tables that need realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE partners;
ALTER PUBLICATION supabase_realtime ADD TABLE user_activities;

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user ON issue_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent ON issue_comments(parent_id);

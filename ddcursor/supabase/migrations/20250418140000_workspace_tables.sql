-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_private BOOLEAN DEFAULT FALSE,
  api_key TEXT
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Add workspace_id to documents table if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to comments table if it doesn't exist
ALTER TABLE comments ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to activity_log table if it doesn't exist
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create RLS policies for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they are members of" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of workspaces they belong to" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can add members" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can update members" ON workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
    )
  );

CREATE POLICY "Workspace owners and admins can delete members" ON workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
    )
    AND
    id NOT IN (
      SELECT id FROM workspace_members 
      WHERE workspace_id = workspace_members.workspace_id AND role = 'owner'
    )
  );

-- Create function to get user workspaces
CREATE OR REPLACE FUNCTION get_user_workspaces(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  is_private BOOLEAN,
  api_key TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id, 
    w.name, 
    w.description, 
    w.created_at, 
    w.created_by, 
    w.is_private, 
    w.api_key,
    wm.role
  FROM 
    workspaces w
  JOIN 
    workspace_members wm ON w.id = wm.workspace_id
  WHERE 
    wm.user_id = get_user_workspaces.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
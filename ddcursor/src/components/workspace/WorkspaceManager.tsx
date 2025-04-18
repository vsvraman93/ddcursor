import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  Person,
  Lock,
  Public,
  Settings,
} from '@mui/icons-material';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { generateApiKey, validateApiKey } from '../../utils/security';

interface Workspace {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
  api_key?: string;
  member_count?: number;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'owner' | 'admin' | 'member';
  user_email?: string;
}

export const WorkspaceManager: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    is_private: false,
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showMembers, setShowMembers] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      
      // Get workspaces where user is a member
      const { data: workspaceMembers, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user?.id);
      
      if (memberError) throw memberError;
      
      if (workspaceMembers && workspaceMembers.length > 0) {
        const workspaceIds = workspaceMembers.map(wm => wm.workspace_id);
        
        // Get workspace details
        const { data: workspacesData, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', workspaceIds);
        
        if (workspacesError) throw workspacesError;
        
        // Get member counts for each workspace
        const workspacesWithCounts = await Promise.all(
          (workspacesData || []).map(async (workspace) => {
            const { count, error: countError } = await supabase
              .from('workspace_members')
              .select('*', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id);
            
            if (countError) throw countError;
            
            return {
              ...workspace,
              member_count: count || 0,
            };
          })
        );
        
        setWorkspaces(workspacesWithCounts);
      } else {
        setWorkspaces([]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
      showNotification('Failed to load workspaces', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          users:user_id (email)
        `)
        .eq('workspace_id', workspaceId);
      
      if (error) throw error;
      
      // Transform the data to include user_email
      const membersWithEmail = (data || []).map(member => ({
        ...member,
        user_email: member.users?.email,
      }));
      
      setMembers(membersWithEmail);
    } catch (error) {
      console.error('Error loading workspace members:', error);
      showNotification('Failed to load workspace members', 'error');
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      if (!user) return;
      
      // Generate API key for the workspace
      const apiKey = generateApiKey();
      
      // Create the workspace
      const { data, error } = await supabase
        .from('workspaces')
        .insert([
          {
            name: newWorkspace.name,
            description: newWorkspace.description,
            is_private: newWorkspace.is_private,
            created_by: user.id,
            api_key: apiKey,
          },
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const workspaceId = data[0].id;
        
        // Add the creator as an owner
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert([
            {
              workspace_id: workspaceId,
              user_id: user.id,
              role: 'owner',
            },
          ]);
        
        if (memberError) throw memberError;
        
        // Log activity
        await supabase.from('activity_log').insert({
          workspace_id: workspaceId,
          user_id: user.id,
          type: 'workspace',
          action: 'created',
          details: {
            table: 'workspaces',
            record_id: workspaceId,
          },
        });
        
        setOpenDialog(false);
        setNewWorkspace({ name: '', description: '', is_private: false });
        loadWorkspaces();
        showNotification('Workspace created successfully', 'success');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      showNotification('Failed to create workspace', 'error');
    }
  };

  const handleUpdateWorkspace = async () => {
    try {
      if (!selectedWorkspace || !user) return;
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: newWorkspace.name,
          description: newWorkspace.description,
          is_private: newWorkspace.is_private,
        })
        .eq('id', selectedWorkspace.id);
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: selectedWorkspace.id,
        user_id: user.id,
        type: 'workspace',
        action: 'updated',
        details: {
          table: 'workspaces',
          record_id: selectedWorkspace.id,
        },
      });
      
      setOpenDialog(false);
      setSelectedWorkspace(null);
      setNewWorkspace({ name: '', description: '', is_private: false });
      loadWorkspaces();
      showNotification('Workspace updated successfully', 'success');
    } catch (error) {
      console.error('Error updating workspace:', error);
      showNotification('Failed to update workspace', 'error');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      if (!user) return;
      
      // Check if user is owner
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
      
      if (memberError) throw memberError;
      
      if (memberData.role !== 'owner') {
        showNotification('Only workspace owners can delete workspaces', 'error');
        return;
      }
      
      // Delete the workspace
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'workspace',
        action: 'deleted',
        details: {
          table: 'workspaces',
          record_id: workspaceId,
        },
      });
      
      loadWorkspaces();
      showNotification('Workspace deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      showNotification('Failed to delete workspace', 'error');
    }
  };

  const handleAddMember = async (workspaceId: string, email: string, role: 'admin' | 'member') => {
    try {
      if (!user) return;
      
      // Check if user is owner or admin
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
      
      if (memberError) throw memberError;
      
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        showNotification('Only workspace owners and admins can add members', 'error');
        return;
      }
      
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError) throw userError;
      
      if (!userData) {
        showNotification('User not found', 'error');
        return;
      }
      
      // Check if user is already a member
      const { data: existingMember, error: existingError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userData.id)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }
      
      if (existingMember) {
        showNotification('User is already a member of this workspace', 'error');
        return;
      }
      
      // Add the user as a member
      const { error: addError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: userData.id,
            role: role,
          },
        ]);
      
      if (addError) throw addError;
      
      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'workspace',
        action: 'member_added',
        details: {
          table: 'workspace_members',
          record_id: userData.id,
        },
      });
      
      loadMembers(workspaceId);
      showNotification('Member added successfully', 'success');
    } catch (error) {
      console.error('Error adding member:', error);
      showNotification('Failed to add member', 'error');
    }
  };

  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    try {
      if (!user) return;
      
      // Check if user is owner or admin
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
      
      if (memberError) throw memberError;
      
      if (memberData.role !== 'owner' && memberData.role !== 'admin') {
        showNotification('Only workspace owners and admins can remove members', 'error');
        return;
      }
      
      // Check if member is owner
      const { data: targetMember, error: targetError } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('id', memberId)
        .single();
      
      if (targetError) throw targetError;
      
      if (targetMember.role === 'owner') {
        showNotification('Cannot remove workspace owner', 'error');
        return;
      }
      
      // Remove the member
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'workspace',
        action: 'member_removed',
        details: {
          table: 'workspace_members',
          record_id: memberId,
        },
      });
      
      loadMembers(workspaceId);
      showNotification('Member removed successfully', 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      showNotification('Failed to remove member', 'error');
    }
  };

  const handleToggleMembers = (workspaceId: string) => {
    if (showMembers === workspaceId) {
      setShowMembers(null);
    } else {
      setShowMembers(workspaceId);
      loadMembers(workspaceId);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Workspaces</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => {
                  setSelectedWorkspace(null);
                  setNewWorkspace({ name: '', description: '', is_private: false });
                  setOpenDialog(true);
                }}
              >
                New Workspace
              </Button>
            </Box>
            
            {workspaces.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  You don't have any workspaces yet. Create one to get started!
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {workspaces.map((workspace) => (
                  <Grid item xs={12} md={6} lg={4} key={workspace.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {workspace.name}
                          </Typography>
                          <Box>
                            {workspace.is_private ? (
                              <Lock fontSize="small" color="action" />
                            ) : (
                              <Public fontSize="small" color="action" />
                            )}
                          </Box>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                          {workspace.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Group fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {workspace.member_count} {workspace.member_count === 1 ? 'member' : 'members'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Created {new Date(workspace.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<Group />}
                          onClick={() => handleToggleMembers(workspace.id)}
                        >
                          {showMembers === workspace.id ? 'Hide Members' : 'Show Members'}
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<Settings />}
                          onClick={() => {
                            setSelectedWorkspace(workspace);
                            setNewWorkspace({
                              name: workspace.name,
                              description: workspace.description,
                              is_private: workspace.is_private,
                            });
                            setOpenDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                    
                    {showMembers === workspace.id && (
                      <Paper sx={{ mt: 2, p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Members
                        </Typography>
                        <List>
                          {members.map((member) => (
                            <ListItem key={member.id}>
                              <ListItemText
                                primary={member.user_email}
                                secondary={`Role: ${member.role}`}
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  label={member.role}
                                  color={member.role === 'owner' ? 'primary' : member.role === 'admin' ? 'secondary' : 'default'}
                                  size="small"
                                />
                                {member.role !== 'owner' && (
                                  <IconButton
                                    edge="end"
                                    aria-label="remove"
                                    onClick={() => handleRemoveMember(workspace.id, member.id)}
                                    sx={{ ml: 1 }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TextField
                            size="small"
                            placeholder="Email"
                            sx={{ mr: 1, flexGrow: 1 }}
                            id={`add-member-${workspace.id}`}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={() => {
                              const emailInput = document.getElementById(`add-member-${workspace.id}`) as HTMLInputElement;
                              if (emailInput && emailInput.value) {
                                handleAddMember(workspace.id, emailInput.value, 'member');
                                emailInput.value = '';
                              }
                            }}
                          >
                            Add Member
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const emailInput = document.getElementById(`add-member-${workspace.id}`) as HTMLInputElement;
                              if (emailInput && emailInput.value) {
                                handleAddMember(workspace.id, emailInput.value, 'admin');
                                emailInput.value = '';
                              }
                            }}
                          >
                            Add Admin
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedWorkspace ? 'Edit Workspace' : 'New Workspace'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newWorkspace.name}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newWorkspace.description}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
          />
          <Box sx={{ mt: 2 }}>
            <Chip
              label={newWorkspace.is_private ? "Private Workspace" : "Public Workspace"}
              color={newWorkspace.is_private ? "default" : "primary"}
              onClick={() => setNewWorkspace({ ...newWorkspace, is_private: !newWorkspace.is_private })}
              icon={newWorkspace.is_private ? <Lock /> : <Public />}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedWorkspace ? handleUpdateWorkspace : handleCreateWorkspace}
          >
            {selectedWorkspace ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!notification} 
        autoHideDuration={3000} 
        onClose={() => setNotification(null)}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 
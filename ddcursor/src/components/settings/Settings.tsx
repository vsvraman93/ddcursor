import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserSettings {
  email: string;
  full_name: string;
  role: string;
  notifications_enabled: boolean;
  theme: 'light' | 'dark';
  language: string;
}

interface WorkspaceSettings {
  name: string;
  description: string;
  storage_limit: number;
  allowed_file_types: string[];
  watermark_enabled: boolean;
  watermark_text: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    email: '',
    full_name: '',
    role: '',
    notifications_enabled: true,
    theme: 'light',
    language: 'en',
  });
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({
    name: '',
    description: '',
    storage_limit: 1000,
    allowed_file_types: [],
    watermark_enabled: false,
    watermark_text: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user settings
      const { data: userData, error: userError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setUserSettings(userData);
      }

      // Load workspace settings
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspace_settings')
        .select('*')
        .single();

      if (workspaceError) throw workspaceError;

      if (workspaceData) {
        setWorkspaceSettings(workspaceData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    }
  };

  const handleUserSettingsChange = async () => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...userSettings,
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving user settings:', error);
      setError('Failed to save user settings');
    }
  };

  const handleWorkspaceSettingsChange = async () => {
    try {
      const { error } = await supabase
        .from('workspace_settings')
        .upsert(workspaceSettings);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving workspace settings:', error);
      setError('Failed to save workspace settings');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* User Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Settings
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Email"
                value={userSettings.email}
                onChange={(e) =>
                  setUserSettings({ ...userSettings, email: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Full Name"
                value={userSettings.full_name}
                onChange={(e) =>
                  setUserSettings({ ...userSettings, full_name: e.target.value })
                }
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={userSettings.role}
                  label="Role"
                  onChange={(e) =>
                    setUserSettings({ ...userSettings, role: e.target.value })
                  }
                >
                  <MenuItem value="consultant">Consultant</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={userSettings.theme}
                  label="Theme"
                  onChange={(e) =>
                    setUserSettings({
                      ...userSettings,
                      theme: e.target.value as 'light' | 'dark',
                    })
                  }
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={userSettings.notifications_enabled}
                    onChange={(e) =>
                      setUserSettings({
                        ...userSettings,
                        notifications_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label="Enable Notifications"
                sx={{ mt: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleUserSettingsChange}
                sx={{ mt: 2 }}
              >
                Save User Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Workspace Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workspace Settings
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Workspace Name"
                value={workspaceSettings.name}
                onChange={(e) =>
                  setWorkspaceSettings({
                    ...workspaceSettings,
                    name: e.target.value,
                  })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                value={workspaceSettings.description}
                onChange={(e) =>
                  setWorkspaceSettings({
                    ...workspaceSettings,
                    description: e.target.value,
                  })
                }
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Storage Limit (MB)"
                type="number"
                value={workspaceSettings.storage_limit}
                onChange={(e) =>
                  setWorkspaceSettings({
                    ...workspaceSettings,
                    storage_limit: parseInt(e.target.value),
                  })
                }
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={workspaceSettings.watermark_enabled}
                    onChange={(e) =>
                      setWorkspaceSettings({
                        ...workspaceSettings,
                        watermark_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label="Enable Watermark"
                sx={{ mt: 2 }}
              />
              {workspaceSettings.watermark_enabled && (
                <TextField
                  fullWidth
                  label="Watermark Text"
                  value={workspaceSettings.watermark_text}
                  onChange={(e) =>
                    setWorkspaceSettings({
                      ...workspaceSettings,
                      watermark_text: e.target.value,
                    })
                  }
                  margin="normal"
                />
              )}
              <Button
                variant="contained"
                onClick={handleWorkspaceSettingsChange}
                sx={{ mt: 2 }}
              >
                Save Workspace Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Settings saved successfully
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}; 
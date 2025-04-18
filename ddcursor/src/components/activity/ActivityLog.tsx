import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Description as DocumentIcon,
  QuestionAnswer as QuestionIcon,
  Comment as CommentIcon,
  Business as WorkspaceIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Activity, getWorkspaceActivities } from '../../api/activities';

interface ActivityLogProps {
  workspaceId: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ workspaceId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, [workspaceId, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceActivities(workspaceId, filter !== 'all' ? filter : undefined);
      setActivities(data);
    } catch (err) {
      setError('Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'documents':
        return <DocumentIcon />;
      case 'questions':
        return <QuestionIcon />;
      case 'comments':
        return <CommentIcon />;
      case 'workspaces':
        return <WorkspaceIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getActivityColor = (action: Activity['action']) => {
    switch (action) {
      case 'created':
        return 'success';
      case 'updated':
        return 'info';
      case 'deleted':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatActivityText = (activity: Activity) => {
    const action = activity.action.charAt(0).toUpperCase() + activity.action.slice(1);
    const type = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    return `${action} ${type.slice(0, -1)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <Typography variant="h6" component="h2">
              Activity Log
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">All Activities</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="questions">Questions</MenuItem>
                  <MenuItem value="comments">Comments</MenuItem>
                  <MenuItem value="workspaces">Workspaces</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {activities.length === 0 ? (
        <Alert severity="info">No activities found.</Alert>
      ) : (
        <List>
          {activities.map((activity) => (
            <ListItem
              key={activity.id}
              sx={{
                borderLeft: 3,
                borderColor: `${getActivityColor(activity.action)}.main`,
                mb: 1,
                bgcolor: 'background.paper',
              }}
            >
              <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
              <ListItemText
                primary={formatActivityText(activity)}
                secondary={format(new Date(activity.created_at), 'PPpp')}
              />
              <Chip
                label={activity.action}
                color={getActivityColor(activity.action)}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}; 
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Comment,
  CheckCircle,
  Pending,
  Security,
} from '@mui/icons-material';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { maskSensitiveData } from '../../utils/security';

interface Question {
  id: string;
  text: string;
  category: string;
  status: 'pending' | 'answered' | 'reviewed';
  created_at: string;
  created_by: string;
  comments: Comment[];
  is_sensitive?: boolean;
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  created_by: string;
}

export const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    category: '',
    is_sensitive: false,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUserWorkspace();
  }, [user]);

  useEffect(() => {
    if (workspaceId) {
      loadQuestions();
      loadCategories();
    }
  }, [workspaceId]);

  const loadUserWorkspace = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setWorkspaceId(data.workspace_id);
      }
    } catch (error) {
      console.error('Error loading user workspace:', error);
      showNotification('Failed to load workspace', 'error');
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*, comments(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      showNotification('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      setCategories(data?.map((cat) => cat.name) || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification('Failed to load categories', 'error');
    }
  };

  const handleCreateQuestion = async () => {
    try {
      const { error } = await supabase.from('questions').insert([
        {
          text: newQuestion.text,
          category: newQuestion.category,
          status: 'pending',
          workspace_id: workspaceId,
          is_sensitive: newQuestion.is_sensitive,
        },
      ]);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'questions',
        action: 'created',
        details: {
          table: 'questions',
          record_id: 'new',
        },
      });

      setOpenDialog(false);
      setNewQuestion({ text: '', category: '', is_sensitive: false });
      loadQuestions();
      showNotification('Question created successfully', 'success');
    } catch (error) {
      console.error('Error creating question:', error);
      showNotification('Failed to create question', 'error');
    }
  };

  const handleUpdateStatus = async (questionId: string, status: Question['status']) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status })
        .eq('id', questionId);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'questions',
        action: 'updated',
        details: {
          table: 'questions',
          record_id: questionId,
        },
      });

      loadQuestions();
      showNotification(`Question status updated to ${status}`, 'success');
    } catch (error) {
      console.error('Error updating question status:', error);
      showNotification('Failed to update question status', 'error');
    }
  };

  const handleAddComment = async (questionId: string, comment: string) => {
    try {
      const { error } = await supabase.from('comments').insert([
        {
          question_id: questionId,
          text: comment,
          workspace_id: workspaceId,
        },
      ]);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'comments',
        action: 'created',
        details: {
          table: 'comments',
          record_id: questionId,
        },
      });

      loadQuestions();
      showNotification('Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showNotification('Failed to add comment', 'error');
    }
  };

  const getStatusColor = (status: Question['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'answered':
        return 'info';
      case 'reviewed':
        return 'success';
      default:
        return 'default';
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
              <Typography variant="h6">Questions</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
              >
                New Question
              </Button>
            </Box>
            <List>
              {questions.map((question) => (
                <ListItem
                  key={question.id}
                  divider
                  sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <ListItemText
                      primary={question.is_sensitive ? maskSensitiveData(question.text, 'email') : question.text}
                      secondary={`Category: ${question.category}`}
                    />
                    <ListItemSecondaryAction>
                      {question.is_sensitive && (
                        <Security color="warning" sx={{ mr: 1 }} />
                      )}
                      <Chip
                        label={question.status}
                        color={getStatusColor(question.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => {
                          setSelectedQuestion(question);
                          setOpenDialog(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleUpdateStatus(question.id, 'reviewed')}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </Box>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Comments:
                    </Typography>
                    {question.comments?.map((comment) => (
                      <Box key={comment.id} sx={{ ml: 2, mt: 1 }}>
                        <Typography variant="body2">{comment.text}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(comment.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedQuestion ? 'Edit Question' : 'New Question'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Question"
            fullWidth
            multiline
            rows={4}
            value={newQuestion.text}
            onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newQuestion.category}
              label="Category"
              onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Chip
              label="Sensitive Content"
              color={newQuestion.is_sensitive ? "warning" : "default"}
              onClick={() => setNewQuestion({ ...newQuestion, is_sensitive: !newQuestion.is_sensitive })}
              icon={<Security />}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateQuestion}
          >
            {selectedQuestion ? 'Update' : 'Create'}
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
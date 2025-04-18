import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Folder,
  InsertDriveFile,
  Delete,
  Edit,
  CreateNewFolder,
  Upload,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  validateFileType, 
  validateFileSize, 
  sanitizeFileName, 
  generateWatermark 
} from '../../utils/security';

interface Document {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  created_at: string;
  is_encrypted?: boolean;
}

const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'folder' | 'file'>('folder');
  const [newItemName, setNewItemName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUserWorkspace();
  }, [user]);

  useEffect(() => {
    if (workspaceId) {
      loadDocuments();
    }
  }, [currentPath, workspaceId]);

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

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list(currentPath);

      if (error) throw error;

      const formattedDocuments: Document[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        path: item.name,
        type: item.metadata?.type || 'file',
        size: item.metadata?.size,
        created_at: item.created_at,
        is_encrypted: item.metadata?.is_encrypted || false,
      }));

      setDocuments(formattedDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      showNotification('Failed to load documents', 'error');
    }
  };

  const handleCreateFolder = async () => {
    try {
      const sanitizedName = sanitizeFileName(newItemName);
      const folderPath = `${currentPath}${sanitizedName}/`;
      
      const { error } = await supabase.storage
        .from('documents')
        .upload(folderPath, new File([], ''), {
          contentType: 'application/x-directory',
          upsert: true,
        });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'documents',
        action: 'created',
        details: {
          table: 'documents',
          record_id: folderPath,
        },
      });

      setOpenDialog(false);
      setNewItemName('');
      loadDocuments();
      showNotification('Folder created successfully', 'success');
    } catch (error) {
      console.error('Error creating folder:', error);
      showNotification('Failed to create folder', 'error');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      // Validate file
      if (!validateFileType(selectedFile, ALLOWED_FILE_TYPES)) {
        showNotification(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`, 'error');
        return;
      }

      if (!validateFileSize(selectedFile.size, MAX_FILE_SIZE)) {
        showNotification(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
        return;
      }

      const sanitizedName = sanitizeFileName(selectedFile.name);
      const filePath = `${currentPath}${sanitizedName}`;
      
      // Add watermark to file metadata
      const watermark = generateWatermark(sanitizedName, user?.email || 'unknown');
      
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          upsert: true,
          metadata: {
            watermark,
            is_encrypted: false,
          },
        });

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'documents',
        action: 'created',
        details: {
          table: 'documents',
          record_id: filePath,
        },
      });

      setOpenDialog(false);
      setSelectedFile(null);
      loadDocuments();
      showNotification('File uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('Failed to upload file', 'error');
    }
  };

  const handleDelete = async (document: Document) => {
    try {
      const path = `${currentPath}${document.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .remove([path]);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        user_id: user?.id,
        type: 'documents',
        action: 'deleted',
        details: {
          table: 'documents',
          record_id: path,
        },
      });

      loadDocuments();
      showNotification('Document deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting document:', error);
      showNotification('Failed to delete document', 'error');
    }
  };

  const handleNavigate = (document: Document) => {
    if (document.type === 'folder') {
      setCurrentPath(`${currentPath}${document.name}/`);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Documents</Typography>
              <Box>
                <Button
                  startIcon={<CreateNewFolder />}
                  onClick={() => {
                    setDialogType('folder');
                    setOpenDialog(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  New Folder
                </Button>
                <Button
                  startIcon={<Upload />}
                  onClick={() => {
                    setDialogType('file');
                    setOpenDialog(true);
                  }}
                >
                  Upload File
                </Button>
              </Box>
            </Box>
            <List>
              {currentPath !== '/' && (
                <ListItem
                  button
                  onClick={() => setCurrentPath(currentPath.split('/').slice(0, -2).join('/') + '/')}
                >
                  <ListItemIcon>
                    <Folder />
                  </ListItemIcon>
                  <ListItemText primary=".." />
                </ListItem>
              )}
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  button
                  onClick={() => handleNavigate(doc)}
                >
                  <ListItemIcon>
                    {doc.type === 'folder' ? <Folder /> : <InsertDriveFile />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={doc.name} 
                    secondary={doc.is_encrypted ? 'Encrypted' : undefined}
                  />
                  <ListItemSecondaryAction>
                    {doc.type === 'file' && (
                      <IconButton
                        edge="end"
                        aria-label="encryption"
                        sx={{ mr: 1 }}
                      >
                        {doc.is_encrypted ? <Lock /> : <LockOpen />}
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(doc)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogType === 'folder' ? 'Create New Folder' : 'Upload File'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'folder' ? (
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              fullWidth
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          ) : (
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Allowed file types: {ALLOWED_FILE_TYPES.join(', ')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={dialogType === 'folder' ? handleCreateFolder : handleFileUpload}
          >
            {dialogType === 'folder' ? 'Create' : 'Upload'}
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
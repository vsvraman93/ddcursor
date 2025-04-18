import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../../api/supabaseClient';
import { ActivityLog } from '../activity/ActivityLog';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalDocuments: number;
  totalQuestions: number;
  pendingQuestions: number;
  answeredQuestions: number;
  reviewedQuestions: number;
  recentActivity: Activity[];
  documentCategories: CategoryStats[];
  questionCategories: CategoryStats[];
}

interface Activity {
  id: string;
  type: 'document' | 'question';
  action: string;
  timestamp: string;
  user: string;
}

interface CategoryStats {
  name: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string>('');

  useEffect(() => {
    loadUserWorkspace();
  }, [user]);

  useEffect(() => {
    if (workspaceId) {
      loadDashboardStats();
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
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Fetch document stats
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (docError) throw docError;

      // Fetch question stats
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (qError) throw qError;

      // Fetch recent activity
      const { data: activity, error: actError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (actError) throw actError;

      // Calculate document categories
      const docCategories = calculateCategories(documents || []);

      // Calculate question categories
      const qCategories = calculateCategories(questions || []);

      setStats({
        totalDocuments: documents?.length || 0,
        totalQuestions: questions?.length || 0,
        pendingQuestions: questions?.filter((q) => q.status === 'pending').length || 0,
        answeredQuestions: questions?.filter((q) => q.status === 'answered').length || 0,
        reviewedQuestions: questions?.filter((q) => q.status === 'reviewed').length || 0,
        recentActivity: activity || [],
        documentCategories: docCategories,
        questionCategories: qCategories,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading(false);
    }
  };

  const calculateCategories = (items: any[]): CategoryStats[] => {
    const categoryCount: { [key: string]: number } = {};
    items.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count,
    }));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Documents
              </Typography>
              <Typography variant="h4">{stats?.totalDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Questions
              </Typography>
              <Typography variant="h4">{stats?.totalQuestions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Questions
              </Typography>
              <Typography variant="h4">{stats?.pendingQuestions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Reviewed Questions
              </Typography>
              <Typography variant="h4">{stats?.reviewedQuestions}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Document Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.documentCategories}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats?.documentCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Question Categories
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.questionCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Activity Log */}
        {workspaceId && (
          <Grid item xs={12}>
            <ActivityLog workspaceId={workspaceId} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 
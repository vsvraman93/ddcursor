import { supabase } from './supabaseClient';

export interface Activity {
  id: string;
  user_id: string;
  workspace_id: string;
  type: 'documents' | 'questions' | 'comments' | 'workspaces';
  action: 'created' | 'updated' | 'deleted';
  details: {
    table: string;
    record_id: string;
  };
  created_at: string;
}

export const getWorkspaceActivities = async (
  workspaceId: string,
  type?: string
): Promise<Activity[]> => {
  try {
    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

export const getActivityDetails = async (activityId: string): Promise<Activity | null> => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
}; 
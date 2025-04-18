-- Create additional RLS policies for document operations
CREATE POLICY "Users can upload documents to their workspaces"
    ON public.documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update documents in their workspaces"
    ON public.documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents in their workspaces"
    ON public.documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_id
            AND user_id = auth.uid()
        )
    );

-- Create policies for workspace operations
CREATE POLICY "Users can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace owners can update workspace details"
    ON public.workspaces FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Workspace owners can delete workspaces"
    ON public.workspaces FOR DELETE
    USING (auth.uid() = created_by);

-- Create policies for question operations
CREATE POLICY "Users can create questions in their workspaces"
    ON public.questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = workspace_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own questions"
    ON public.questions FOR UPDATE
    USING (auth.uid() = created_by);

-- Create policies for comment operations
CREATE POLICY "Users can create comments on accessible questions"
    ON public.comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.workspace_members wm ON wm.workspace_id = q.workspace_id
            WHERE q.id = question_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = created_by);

-- Create policies for workspace settings
CREATE POLICY "Workspace owners can manage settings"
    ON public.workspace_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_id
            AND w.created_by = auth.uid()
        )
    );

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
    workspace_id UUID;
BEGIN
    -- Determine workspace_id based on the table being modified
    CASE TG_TABLE_NAME
        WHEN 'documents' THEN
            workspace_id := NEW.workspace_id;
        WHEN 'questions' THEN
            workspace_id := NEW.workspace_id;
        WHEN 'comments' THEN
            SELECT q.workspace_id INTO workspace_id
            FROM public.questions q
            WHERE q.id = NEW.question_id;
        WHEN 'workspaces' THEN
            workspace_id := NEW.id;
        ELSE
            workspace_id := NULL;
    END CASE;

    IF workspace_id IS NOT NULL THEN
        INSERT INTO public.activity_log (
            user_id,
            workspace_id,
            type,
            action,
            details
        ) VALUES (
            auth.uid(),
            workspace_id,
            TG_TABLE_NAME::activity_type,
            CASE TG_OP
                WHEN 'INSERT' THEN 'created'
                WHEN 'UPDATE' THEN 'updated'
                WHEN 'DELETE' THEN 'deleted'
            END,
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'record_id', COALESCE(NEW.id, OLD.id)
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity logging triggers
DROP TRIGGER IF EXISTS log_document_activity ON public.documents;
CREATE TRIGGER log_document_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_question_activity ON public.questions;
CREATE TRIGGER log_question_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_comment_activity ON public.comments;
CREATE TRIGGER log_comment_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS log_workspace_activity ON public.workspaces;
CREATE TRIGGER log_workspace_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.log_activity(); 
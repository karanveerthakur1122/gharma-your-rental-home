
-- Add archived columns to conversations for each participant
ALTER TABLE public.conversations 
ADD COLUMN archived_by_tenant boolean NOT NULL DEFAULT false,
ADD COLUMN archived_by_landlord boolean NOT NULL DEFAULT false;

-- Allow participants to delete their conversations
CREATE POLICY "Participants can delete conversations"
ON public.conversations
FOR DELETE
USING ((auth.uid() = tenant_id) OR (auth.uid() = landlord_id));

-- Allow deleting messages in conversations you participate in
CREATE POLICY "Participants can delete messages"
ON public.messages
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = messages.conversation_id
  AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid())
));


-- Allow landlords to also create conversations (for replying to inquiries)
DROP POLICY IF EXISTS "Tenants can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = tenant_id OR auth.uid() = landlord_id
);

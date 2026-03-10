-- Create conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'direct', -- direct, group
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- admin, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, video, file, voice, system
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  reply_to UUID REFERENCES messages(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Create video_calls table for tracking call sessions
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, ended, missed
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create call_participants table
CREATE TABLE IF NOT EXISTS call_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(call_id, user_id)
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create message_read_receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_video_calls_conversation ON video_calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id, updated_at);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Conversations: Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" 
  ON conversations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversations.id 
      AND cp.user_id = auth.uid()
    )
  );

-- Conversation participants
CREATE POLICY "Users can view participants of their conversations" 
  ON conversation_participants FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" 
  ON messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" 
  ON messages FOR UPDATE 
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" 
  ON messages FOR DELETE 
  USING (sender_id = auth.uid());

-- Message reactions
CREATE POLICY "Users can view reactions in their conversations" 
  ON message_reactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_reactions.message_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions" 
  ON message_reactions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own reactions" 
  ON message_reactions FOR DELETE 
  USING (user_id = auth.uid());

-- Video calls
CREATE POLICY "Users can view calls in their conversations" 
  ON video_calls FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = video_calls.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can initiate calls in their conversations" 
  ON video_calls FOR INSERT 
  WITH CHECK (
    initiator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = video_calls.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Call participants
CREATE POLICY "Users can view call participants" 
  ON call_participants FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM video_calls vc
      JOIN conversation_participants cp ON vc.conversation_id = cp.conversation_id
      WHERE vc.id = call_participants.call_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Typing indicators
CREATE POLICY "Users can view typing in their conversations" 
  ON typing_indicators FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = typing_indicators.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing status" 
  ON typing_indicators FOR ALL 
  USING (user_id = auth.uid());

-- Functions

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation on new message
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  AND m.sender_id != p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM message_read_receipts mrr
    WHERE mrr.message_id = m.id AND mrr.user_id = p_user_id
  );
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

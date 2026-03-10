import { Server as SocketIOServer } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SocketUser {
  userId: string;
  socketId: string;
}

interface CallSession {
  roomId: string;
  participants: string[];
  initiatorId: string;
  conversationId: string;
}

class MessagingServer {
  private io: SocketIOServer;
  private users: Map<string, SocketUser> = new Map();
  private activeCalls: Map<string, CallSession> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // User authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (error || !user) {
            socket.emit('auth_error', 'Invalid token');
            return;
          }

          // Store user connection
          this.users.set(user.id, {
            userId: user.id,
            socketId: socket.id,
          });

          socket.data.userId = user.id;
          socket.join(`user:${user.id}`);
          
          socket.emit('authenticated', { userId: user.id });
          console.log(`User ${user.id} authenticated`);

          // Join user's conversations
          await this.joinUserConversations(socket, user.id);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', 'Authentication failed');
        }
      });

      // Join conversation room
      socket.on('join_conversation', async (conversationId: string) => {
        try {
          const userId = socket.data.userId;
          if (!userId) {
            socket.emit('error', 'Not authenticated');
            return;
          }

          // Verify user is participant
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

          if (!participant) {
            socket.emit('error', 'Not a participant');
            return;
          }

          socket.join(`conversation:${conversationId}`);
          socket.emit('joined_conversation', conversationId);
          
          console.log(`User ${userId} joined conversation ${conversationId}`);
        } catch (error) {
          console.error('Join conversation error:', error);
        }
      });

      // Leave conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        socket.emit('left_conversation', conversationId);
      });

      // Send message
      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        messageType?: string;
        replyTo?: string;
        tempId?: string;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) {
            socket.emit('error', 'Not authenticated');
            return;
          }

          // Insert message into database
          const { data: message, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: data.conversationId,
              sender_id: userId,
              content: data.content,
              message_type: data.messageType || 'text',
              reply_to: data.replyTo || null,
            })
            .select(`
              *,
              sender:profiles(id, full_name, avatar_url)
            `)
            .single();

          if (error) {
            socket.emit('message_error', {
              tempId: data.tempId,
              error: error.message,
            });
            return;
          }

          // Broadcast to conversation participants
          this.io.to(`conversation:${data.conversationId}`).emit('new_message', {
            message,
            tempId: data.tempId,
          });

          // Send notification to offline participants
          await this.notifyOfflineParticipants(data.conversationId, userId, message);

          console.log(`Message sent in conversation ${data.conversationId}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('message_error', {
            tempId: data.tempId,
            error: 'Failed to send message',
          });
        }
      });

      // Typing indicator
      socket.on('typing_start', (conversationId: string) => {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId,
          conversationId,
          isTyping: true,
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          userId,
          conversationId,
          isTyping: false,
        });
      });

      // Message read receipts
      socket.on('mark_read', async (data: {
        conversationId: string;
        messageIds: string[];
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          // Insert read receipts
          const readReceipts = data.messageIds.map(messageId => ({
            message_id: messageId,
            user_id: userId,
          }));

          await supabase
            .from('message_read_receipts')
            .upsert(readReceipts, {
              onConflict: 'message_id, user_id',
            });

          // Update messages as read
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', data.messageIds)
            .eq('conversation_id', data.conversationId)
            .neq('sender_id', userId);

          // Notify conversation
          this.io.to(`conversation:${data.conversationId}`).emit('messages_read', {
            userId,
            messageIds: data.messageIds,
          });
        } catch (error) {
          console.error('Mark read error:', error);
        }
      });

      // Video Call Signaling
      socket.on('initiate_call', async (data: {
        conversationId: string;
        roomId: string;
        isVideo: boolean;
      }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) {
            socket.emit('call_error', 'Not authenticated');
            return;
          }

          // Create call record
          const { data: call, error } = await supabase
            .from('video_calls')
            .insert({
              conversation_id: data.conversationId,
              initiator_id: userId,
              room_id: data.roomId,
              status: 'pending',
            })
            .select()
            .single();

          if (error) {
            socket.emit('call_error', 'Failed to create call');
            return;
          }

          // Store active call
          this.activeCalls.set(data.roomId, {
            roomId: data.roomId,
            participants: [userId],
            initiatorId: userId,
            conversationId: data.conversationId,
          });

          // Notify conversation participants
          this.io.to(`conversation:${data.conversationId}`).emit('incoming_call', {
            callId: call.id,
            roomId: data.roomId,
            initiatorId: userId,
            isVideo: data.isVideo,
            conversationId: data.conversationId,
          });

          socket.emit('call_initiated', {
            callId: call.id,
            roomId: data.roomId,
          });
        } catch (error) {
          console.error('Initiate call error:', error);
          socket.emit('call_error', 'Failed to initiate call');
        }
      });

      socket.on('accept_call', async (data: { roomId: string }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          const callSession = this.activeCalls.get(data.roomId);
          if (!callSession) {
            socket.emit('call_error', 'Call not found');
            return;
          }

          // Update call status
          await supabase
            .from('video_calls')
            .update({
              status: 'active',
              started_at: new Date().toISOString(),
            })
            .eq('room_id', data.roomId);

          // Add participant
          callSession.participants.push(userId);
          await supabase
            .from('call_participants')
            .insert({
              call_id: (await supabase.from('video_calls').select('id').eq('room_id', data.roomId).single()).data?.id,
              user_id: userId,
              joined_at: new Date().toISOString(),
            });

          // Notify initiator
          this.io.to(`conversation:${callSession.conversationId}`).emit('call_accepted', {
            roomId: data.roomId,
            participantId: userId,
          });

          socket.emit('call_joined', { roomId: data.roomId });
        } catch (error) {
          console.error('Accept call error:', error);
        }
      });

      socket.on('reject_call', async (data: { roomId: string }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          const callSession = this.activeCalls.get(data.roomId);
          if (!callSession) return;

          // Notify initiator
          this.io.to(`conversation:${callSession.conversationId}`).emit('call_rejected', {
            roomId: data.roomId,
            rejectedBy: userId,
          });
        } catch (error) {
          console.error('Reject call error:', error);
        }
      });

      socket.on('end_call', async (data: { roomId: string }) => {
        try {
          const userId = socket.data.userId;
          if (!userId) return;

          const callSession = this.activeCalls.get(data.roomId);
          if (!callSession) return;

          // Update call status
          const { data: call } = await supabase
            .from('video_calls')
            .select('started_at')
            .eq('room_id', data.roomId)
            .single();

          const endedAt = new Date();
          const startedAt = call?.started_at ? new Date(call.started_at) : null;
          const durationSeconds = startedAt 
            ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
            : 0;

          await supabase
            .from('video_calls')
            .update({
              status: 'ended',
              ended_at: endedAt.toISOString(),
              duration_seconds: durationSeconds,
            })
            .eq('room_id', data.roomId);

          // Update participant left time
          await supabase
            .from('call_participants')
            .update({ left_at: endedAt.toISOString() })
            .eq('call_id', (await supabase.from('video_calls').select('id').eq('room_id', data.roomId).single()).data?.id)
            .eq('user_id', userId);

          // Notify all participants
          this.io.to(`conversation:${callSession.conversationId}`).emit('call_ended', {
            roomId: data.roomId,
            endedBy: userId,
            durationSeconds,
          });

          // Clean up
          if (callSession.participants.length <= 1) {
            this.activeCalls.delete(data.roomId);
          }
        } catch (error) {
          console.error('End call error:', error);
        }
      });

      // WebRTC Signaling
      socket.on('webrtc_offer', (data: {
        roomId: string;
        offer: RTCSessionDescriptionInit;
        targetUserId: string;
      }) => {
        this.io.to(`user:${data.targetUserId}`).emit('webrtc_offer', {
          roomId: data.roomId,
          offer: data.offer,
          fromUserId: socket.data.userId,
        });
      });

      socket.on('webrtc_answer', (data: {
        roomId: string;
        answer: RTCSessionDescriptionInit;
        targetUserId: string;
      }) => {
        this.io.to(`user:${data.targetUserId}`).emit('webrtc_answer', {
          roomId: data.roomId,
          answer: data.answer,
          fromUserId: socket.data.userId,
        });
      });

      socket.on('webrtc_ice_candidate', (data: {
        roomId: string;
        candidate: RTCIceCandidate;
        targetUserId: string;
      }) => {
        this.io.to(`user:${data.targetUserId}`).emit('webrtc_ice_candidate', {
          roomId: data.roomId,
          candidate: data.candidate,
          fromUserId: socket.data.userId,
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          const userId = socket.data.userId;
          if (userId) {
            this.users.delete(userId);
            
            // End any active calls
            for (const [roomId, callSession] of this.activeCalls.entries()) {
              if (callSession.participants.includes(userId)) {
                await this.handleParticipantDisconnect(roomId, userId);
              }
            }
          }
          console.log('User disconnected:', socket.id);
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });
    });
  }

  private async joinUserConversations(socket: any, userId: string) {
    try {
      const { data: conversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (conversations) {
        conversations.forEach((conv: any) => {
          socket.join(`conversation:${conv.conversation_id}`);
        });
      }
    } catch (error) {
      console.error('Join user conversations error:', error);
    }
  }

  private async notifyOfflineParticipants(
    conversationId: string,
    senderId: string,
    message: any
  ) {
    try {
      // Get online users in conversation
      const onlineUsers = new Set<string>();
      const room = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
      
      if (room) {
        room.forEach((socketId: string) => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket?.data?.userId) {
            onlineUsers.add(socket.data.userId);
          }
        });
      }

      // Get all participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', senderId);

      if (participants) {
        participants.forEach((participant: any) => {
          if (!onlineUsers.has(participant.user_id)) {
            // Send push notification or email to offline user
            this.io.to(`user:${participant.user_id}`).emit('new_message_notification', {
              conversationId,
              message: {
                ...message,
                sender_name: message.sender?.full_name || 'Someone',
              },
            });
          }
        });
      }
    } catch (error) {
      console.error('Notify offline participants error:', error);
    }
  }

  private async handleParticipantDisconnect(roomId: string, userId: string) {
    try {
      const callSession = this.activeCalls.get(roomId);
      if (!callSession) return;

      // Update participant left time
      const { data: call } = await supabase
        .from('video_calls')
        .select('id')
        .eq('room_id', roomId)
        .single();

      if (call) {
        await supabase
          .from('call_participants')
          .update({ left_at: new Date().toISOString() })
          .eq('call_id', call.id)
          .eq('user_id', userId);
      }

      // Remove from participants
      callSession.participants = callSession.participants.filter(id => id !== userId);

      // Notify remaining participants
      this.io.to(`conversation:${callSession.conversationId}`).emit('participant_left', {
        roomId,
        userId,
      });

      // End call if no participants
      if (callSession.participants.length === 0) {
        await supabase
          .from('video_calls')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('room_id', roomId);

        this.activeCalls.delete(roomId);
      }
    } catch (error) {
      console.error('Handle participant disconnect error:', error);
    }
  }
}

export default MessagingServer;

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";

interface UseSocketMessagingProps {
  conversationId?: string;
  onNewMessage?: (message: any) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onMessagesRead?: (data: { userId: string; messageIds: string[] }) => void;
}

interface UseSocketMessagingReturn {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  sendMessage: (content: string, options?: { messageType?: string; replyTo?: string; tempId?: string }) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markMessagesAsRead: (messageIds: string[]) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

export function useSocketMessaging({
  conversationId,
  onNewMessage,
  onTyping,
  onMessagesRead,
}: UseSocketMessagingProps = {}): UseSocketMessagingReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  const currentConversationId = useRef<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error("No active session");
          return;
        }

        // Create socket connection
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
          auth: {
            token: session.access_token,
          },
          transports: ["websocket"],
        });

        // Connection events
        socketInstance.on("connect", () => {
          console.log("Socket connected");
          setIsConnected(true);
          
          // Authenticate
          socketInstance.emit("authenticate", session.access_token);
        });

        socketInstance.on("disconnect", () => {
          console.log("Socket disconnected");
          setIsConnected(false);
          setIsAuthenticated(false);
        });

        socketInstance.on("authenticated", () => {
          console.log("Socket authenticated");
          setIsAuthenticated(true);
          
          // Join initial conversation if provided
          if (conversationId) {
            socketInstance.emit("join_conversation", conversationId);
            currentConversationId.current = conversationId;
          }
        });

        socketInstance.on("auth_error", (error) => {
          console.error("Socket auth error:", error);
          setIsAuthenticated(false);
        });

        // Message events
        socketInstance.on("new_message", (data) => {
          console.log("New message received:", data);
          onNewMessage?.(data.message);
        });

        socketInstance.on("message_error", (error) => {
          console.error("Message error:", error);
        });

        // Typing events
        socketInstance.on("user_typing", (data) => {
          onTyping?.(data);
        });

        // Read receipt events
        socketInstance.on("messages_read", (data) => {
          onMessagesRead?.(data);
        });

        setSocket(socketInstance);

        // Cleanup
        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error("Socket initialization error:", error);
      }
    };

    initSocket();
  }, []);

  // Handle conversation changes
  useEffect(() => {
    if (socket && isAuthenticated && conversationId !== currentConversationId.current) {
      // Leave previous conversation
      if (currentConversationId.current) {
        socket.emit("leave_conversation", currentConversationId.current);
      }
      
      // Join new conversation
      if (conversationId) {
        socket.emit("join_conversation", conversationId);
        currentConversationId.current = conversationId;
      }
    }
  }, [socket, isAuthenticated, conversationId]);

  const sendMessage = useCallback(
    (content: string, options?: { messageType?: string; replyTo?: string; tempId?: string }) => {
      if (!socket || !isAuthenticated || !currentConversationId.current) {
        console.error("Cannot send message: socket not ready");
        return;
      }

      socket.emit("send_message", {
        conversationId: currentConversationId.current,
        content,
        messageType: options?.messageType || "text",
        replyTo: options?.replyTo,
        tempId: options?.tempId || Date.now().toString(),
      });
    },
    [socket, isAuthenticated]
  );

  const startTyping = useCallback(() => {
    if (!socket || !isAuthenticated || !currentConversationId.current) return;
    socket.emit("typing_start", currentConversationId.current);
  }, [socket, isAuthenticated]);

  const stopTyping = useCallback(() => {
    if (!socket || !isAuthenticated || !currentConversationId.current) return;
    socket.emit("typing_stop", currentConversationId.current);
  }, [socket, isAuthenticated]);

  const markMessagesAsRead = useCallback(
    (messageIds: string[]) => {
      if (!socket || !isAuthenticated || !currentConversationId.current) return;
      
      socket.emit("mark_read", {
        conversationId: currentConversationId.current,
        messageIds,
      });
    },
    [socket, isAuthenticated]
  );

  const joinConversation = useCallback(
    (id: string) => {
      if (!socket || !isAuthenticated) return;
      
      if (currentConversationId.current && currentConversationId.current !== id) {
        socket.emit("leave_conversation", currentConversationId.current);
      }
      
      socket.emit("join_conversation", id);
      currentConversationId.current = id;
    },
    [socket, isAuthenticated]
  );

  const leaveConversation = useCallback(
    (id: string) => {
      if (!socket || !isAuthenticated) return;
      socket.emit("leave_conversation", id);
      
      if (currentConversationId.current === id) {
        currentConversationId.current = null;
      }
    },
    [socket, isAuthenticated]
  );

  return {
    socket,
    isConnected,
    isAuthenticated,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    joinConversation,
    leaveConversation,
  };
}

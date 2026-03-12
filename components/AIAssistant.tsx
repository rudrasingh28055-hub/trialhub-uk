"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { colors, typography, borderRadius, glassPanel, gradient } from "../lib/design/tokens";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
}

export default function AIAssistant({ isOpen, onClose, context }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you with player analysis, tactical insights, and career advice. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [playerContext, setPlayerContext] = useState<{
    name: string;
    position: string; 
    club: string;
    role: string;
    totalPosts: number;
    recentHighlights: any[];
    recentActions: any[];
    competitions: any[];
  }>({
    name: 'Player',
    position: 'Not set', 
    club: 'Not set',
    role: 'athlete',
    totalPosts: 0,
    recentHighlights: [],
    recentActions: [],
    competitions: []
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadPlayerContext() {
      console.log("🔍 Loading player context...")
      
      const { data: { user } } = await supabase.auth.getUser()
      console.log("🔍 Supabase user:", user?.id)
      
      if (!user) {
        console.log("❌ No user logged in")
        return
      }

      console.log("🔍 Fetching profile for user:", user.id)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log("Full profile data:", JSON.stringify(profileData))
      console.log("Profile error:", profileError)

      const [postsRes] = await Promise.all([
        supabase
          .from('posts')
          .select('content_type, caption, action_type, competition, opponent, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      console.log("🔍 Posts data:", postsRes.data?.length || 0, "posts")

      // Map position from whichever column exists
      const position = profileData?.position || 
                       profileData?.player_position ||
                       profileData?.primary_position ||
                       'Not set'

      // Map name from whichever column exists
      const name = profileData?.full_name || 
                   profileData?.name ||
                   profileData?.username ||
                   user.email?.split('@')[0] ||
                   'Player'

      const newContext = {
        name: name,
        position: position,
        club: profileData?.club || 'Not set',
        role: profileData?.role || 'athlete',
        totalPosts: postsRes.data?.length || 0,
        recentHighlights: postsRes.data?.filter(p => 
          p.content_type === 'match_highlight' || 
          p.content_type === 'training_clip'
        ).slice(0, 5) || [],
        recentActions: postsRes.data?.map(p => p.action_type).filter((action: any) => Boolean(action)).slice(0, 5) || [],
        competitions: Array.from(new Set(postsRes.data?.map(p => p.competition).filter((comp: any) => Boolean(comp)) || []))
      }

      console.log("🔍 Setting player context:", newContext)
      setPlayerContext(newContext)
      
      // Log the system prompt that will be built
      setTimeout(() => {
        console.log("🔍 System prompt being sent:", buildSystemPrompt())
      }, 100)
    }
    
    loadPlayerContext()
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Build personalized system prompt
      const systemPrompt = buildSystemPrompt();
      
      // Get updated messages including the new user message
      const updatedMessages = [...messages, userMessage];
      
      console.log("Sending to AI:", JSON.stringify({
        messageCount: updatedMessages.length,
        lastMessage: updatedMessages[updatedMessages.length - 1],
        systemPromptLength: systemPrompt?.length
      }));
      
      // Guard against empty messages
      if (!updatedMessages || updatedMessages.length === 0 || !updatedMessages[updatedMessages.length-1]?.content) {
        console.error("Empty message detected - aborting AI call");
        setIsTyping(false);
        return;
      }
      
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          systemPrompt
        }),
      });

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "I couldn't generate a response. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI API error:", error);
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const buildSystemPrompt = () => {
    const ctx = playerContext;
  
    // Map pathnames to contexts
    const pageContextMap: Record<string, string> = {
      '/feed': 'User is browsing the highlights feed',
      '/post/create': 'User is creating a new highlight post',
      '/athlete/profile': 'User is viewing their own profile',
      '/discover': 'User is on the scout discovery page',
      '/': 'User is on the home page'
    };
  
    const pageContext = pageContextMap[pathname] || `User is on page: ${pathname}`;
  
    const parts = [
      "You are Debut AI, a football career assistant for grassroots players.",
      ctx.name !== 'Player' ? `Player name: ${ctx.name}` : '',
      ctx.position !== 'Not set' ? `Position: ${ctx.position}` : '',
      ctx.club !== 'Not set' ? `Club: ${ctx.club}` : '',
      `Highlights posted: ${ctx.totalPosts}`,
      "Help them get discovered by scouts. Be concise, under 100 words per response.",
      "Never invent performance data.",
      `Current page: ${pageContext}` 
    ].filter(Boolean)
  
    return parts.join('\n')
  };

  const suggestedQuestions = (() => {
    const questions = [];
  
    if (playerContext.totalPosts === 0) {
      questions.push("How do I post my first highlight?");
      questions.push("What makes a great highlight video?");
      questions.push("What do scouts look for?");
    }
  
    if (playerContext.position && playerContext.position !== 'Not set') {
      questions.push(`What do scouts look for in a ${playerContext.position}?`);
      questions.push(`Training tips for a ${playerContext.position}`);
    }
  
    questions.push("Help me write a caption");
  
  return questions.slice(0, 5);
})();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col"
      style={{
        position: 'fixed',
        zIndex: 9999,
        bottom: '88px',
        right: '24px',
        width: 'min(360px, calc(100vw - 48px))',
        maxHeight: 'min(500px, calc(100vh - 120px))',
        ...glassPanel,
        borderRadius: borderRadius.large
      }}
    >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: colors.glass.border }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                background: gradient.violet,
                color: colors.white
              }}
            >
              🤖
            </div>
            <div>
              <h3 
                className="font-bold"
                style={{ 
                  fontFamily: typography.family,
                  fontWeight: typography.bold,
                  color: colors.white
                }}
              >
                AI Assistant
              </h3>
              <p 
                className="text-xs"
                style={{ color: colors.muted }}
              >
                Football Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: colors.glass.background,
              color: colors.muted
            }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user" 
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white" 
                    : ""
                }`}
                style={{
                  ...(message.role === "assistant" && {
                    ...glassPanel,
                    backgroundColor: colors.glass.background,
                    border: `1px solid ${colors.glass.border}`,
                    color: colors.white
                  })
                }}
              >
                <p 
                  style={{ 
                    fontFamily: typography.family,
                    fontSize: typography.body,
                    lineHeight: 1.5
                  }}
                >
                  {message.content}
                </p>
                <p 
                  className="text-xs mt-2 opacity-70"
                  style={{ 
                    fontFamily: typography.family,
                    fontSize: "12px"
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div
                  style={{
                    ...glassPanel,
                    backgroundColor: colors.glass.background,
                    border: `1px solid ${colors.glass.border}`,
                    padding: "12px 16px",
                    borderRadius: "16px"
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.electricViolet }}
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </div>
                    <span 
                      className="text-sm"
                      style={{ color: colors.muted }}
                    >
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p 
              className="text-xs mb-2"
              style={{ color: colors.muted }}
            >
              Suggested questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    ...glassPanel,
                    backgroundColor: colors.glass.background,
                    border: `1px solid ${colors.glass.border}`,
                    color: colors.muted,
                    fontFamily: typography.family,
                    fontWeight: typography.medium
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: colors.glass.border }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about players, tactics, or career advice..."
              className="flex-1 px-4 py-3 bg-transparent border-0 outline-none text-white placeholder-gray-500"
              style={{ 
                fontFamily: typography.family,
                fontSize: typography.body
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 rounded-lg transition-all disabled:opacity-50"
              style={{
                background: gradient.violet,
                color: colors.white,
                border: "none",
                borderRadius: borderRadius.small
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
    </motion.div>
  );
}

// Floating AI Button Component
export function FloatingAIButton() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const pathname = usePathname();

  // Hide AI on irrelevant pages
  const hiddenPages = ['/messages', '/settings', '/auth', '/login', '/signup', '/register', '/admin'];
  if (hiddenPages.some(page => pathname.startsWith(page))) {
    return null;
  }

  // Determine if AI should be shown and what context to use
  const getAIConfig = () => {
    // Pages where AI should be shown with context
    if (pathname.startsWith('/feed')) {
      return { show: true, tooltip: 'Get post ideas', context: 'feed' };
    }
    if (pathname.startsWith('/post/create')) {
      return { show: true, tooltip: 'Improve your highlight', context: 'create' };
    }
    if (pathname.startsWith('/post/edit')) {
      return { show: true, tooltip: 'Improve your post', context: 'edit' };
    }
    if (pathname.startsWith('/profile')) {
      return { show: true, tooltip: 'Scout perspective', context: 'profile' };
    }
    if (pathname.startsWith('/discover')) {
      return { show: true, tooltip: 'What scouts want', context: 'discover' };
    }

    // Default: show on other pages
    return { show: true, tooltip: 'AI Assistant', context: 'general' };
  };

  const aiConfig = getAIConfig();

  // Don't render if AI should be hidden
  if (!aiConfig.show) {
    return null;
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAIOpen(true)}
        className="rounded-full shadow-lg group"
        style={{
          position: 'fixed',
          zIndex: 9999,
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: gradient.violet,
          boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)"
        }}
      >
        <div className="relative">
          <span className="text-2xl">⚽</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {aiConfig.tooltip}
          </div>
          
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: gradient.violet,
              filter: "blur(8px)",
              opacity: 0.6,
              zIndex: -1
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.button>

      <AIAssistant 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        context={aiConfig.context}
      />
    </>
  );
}

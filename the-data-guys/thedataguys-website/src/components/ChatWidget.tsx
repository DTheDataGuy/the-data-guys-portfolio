import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { MessageCircle, X, Send, User, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm TDG Assistant 👋 I can help you learn about our data engineering services, AI readiness assessments, and how we help businesses get their data house in order. What would you like to know?"
};

const COOKIE_NAME = 'tdg_visitor_id';
const COOKIE_DAYS = 365;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getOrCreateVisitorId(): string {
  const existing = getCookie(COOKIE_NAME);
  if (existing) return existing;
  const newId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  setCookie(COOKIE_NAME, newId, COOKIE_DAYS);
  return newId;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [visitorId] = useState(() => getOrCreateVisitorId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const client = createClient();

  // Load existing conversation on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadConversation = async () => {
      try {
        const response = await client.entities.chat_conversations.query({
          query: JSON.stringify({ visitor_id: visitorId }),
          limit: 1,
          sort: '-updated_at'
        });
        const items = response?.data?.items;
        if (items && items.length > 0) {
          const conv = items[0];
          setConversationId(conv.id);
          try {
            const parsed = JSON.parse(conv.messages) as Message[];
            if (parsed.length > 0) {
              setMessages(parsed);
            }
          } catch {
            // If messages can't be parsed, keep greeting
          }
        }
      } catch {
        // Silently fail - start fresh
      }
    };

    loadConversation();
  }, [visitorId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const saveConversation = useCallback(async (allMessages: Message[], existingId: number | null) => {
    try {
      const serialized = JSON.stringify(allMessages);
      if (existingId) {
        await client.entities.chat_conversations.update({
          id: existingId,
          data: { messages: serialized }
        });
      } else {
        const response = await client.entities.chat_conversations.create({
          data: {
            visitor_id: visitorId,
            messages: serialized
          }
        });
        if (response?.data?.id) {
          setConversationId(response.data.id);
        }
      }
    } catch {
      // Silently fail on save
    }
  }, [visitorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await client.apiCall.invoke({
        url: '/api/v1/ai-chat/send',
        method: 'POST',
        data: {
          message: userMessage.content,
          history,
          visitor_id: visitorId
        }
      });

      const aiResponse = response?.data?.response || "I'm sorry, I couldn't process that request. Please try again or contact us directly.";
      const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: aiResponse }];
      setMessages(finalMessages);
      await saveConversation(finalMessages, conversationId);
    } catch {
      const errorMessages = [...updatedMessages, {
        role: 'assistant' as const,
        content: "I'm having trouble connecting right now. Feel free to reach out to us directly at our contact form above, or try again in a moment."
      }];
      setMessages(errorMessages);
      await saveConversation(errorMessages, conversationId);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    const freshMessages = [GREETING_MESSAGE];
    setMessages(freshMessages);
    setConversationId(null);
    setInput('');

    // Create a new conversation record
    try {
      const response = await client.entities.chat_conversations.create({
        data: {
          visitor_id: visitorId,
          messages: JSON.stringify(freshMessages)
        }
      });
      if (response?.data?.id) {
        setConversationId(response.data.id);
      }
    } catch {
      // Silently fail
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={`absolute bottom-20 right-0 w-[380px] max-h-[520px] flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{
          background: 'rgba(10, 14, 26, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(59, 130, 246, 0.1))',
            borderBottom: '1px solid rgba(0, 240, 255, 0.15)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00f0ff, #3b82f6)' }}>
              <MessageCircle size={18} className="text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">TDG Assistant</h4>
              <p className="text-cyan-400/70 text-xs">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              title="New Chat"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[350px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {msg.role === 'assistant' ? <MessageCircle size={14} className="text-white" /> : <User size={14} className="text-white" />}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/20'
                    : 'bg-white/5 text-gray-200 border border-white/10'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500">
                <MessageCircle size={14} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)' }}>
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about our services..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !isTyping ? 'linear-gradient(135deg, #00f0ff, #3b82f6)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-0' : 'animate-pulse-glow'
        }`}
        style={{
          background: 'linear-gradient(135deg, #00f0ff, #3b82f6)',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        {isOpen ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>
    </div>
  );
};

export default ChatWidget;
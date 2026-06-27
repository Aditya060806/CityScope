import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  MapPin,
  FileText,
  BarChart3,
  HelpCircle,
  ArrowRight,
  Trash2,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useChatAI, ChatMessage } from '@/hooks/useChatAI';
import { cn } from '@/lib/utils';

// ── Lightweight Markdown Renderer ──────────────────────────────
function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      nodes.push(
        <Tag key={`list-${nodes.length}`} className={cn('my-1.5 space-y-0.5', listType === 'ul' ? 'list-disc pl-4' : 'list-decimal pl-4')}>
          {listItems.map((item, idx) => (
            <li key={idx} className="text-[13px] leading-relaxed">{renderInline(item)}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bullet = line.match(/^[\s]*[•\-\*]\s+(.+)/);
    const numbered = line.match(/^[\s]*\d+[\.\)]\s+(.+)/);

    if (bullet) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(bullet[1]);
    } else if (numbered) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(numbered[1]);
    } else {
      flushList();
      if (line.trim() === '') {
        nodes.push(<div key={`br-${i}`} className="h-1.5" />);
      } else {
        nodes.push(
          <p key={`p-${i}`} className="text-[13px] leading-relaxed">{renderInline(line)}</p>
        );
      }
    }
  }
  flushList();
  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<code key={match.index} className="px-1 py-0.5 bg-royal/5 text-royal rounded text-xs font-mono">{match[2]}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

// ── Quick Action Cards ─────────────────────────────────────────
const quickActions = [
  { id: 'report', label: 'Report Issue', icon: FileText, message: 'I want to report a civic issue', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'map', label: 'View Map', icon: MapPin, message: 'Show me the map with all issues', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'stats', label: 'Statistics', icon: BarChart3, message: 'Show me the current issue statistics', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'help', label: 'Get Help', icon: HelpCircle, message: 'What can you help me with?', color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

// ── Main Component ─────────────────────────────────────────────
interface RedesignedChatbotProps {
  className?: string;
}

export const RedesignedChatbot: React.FC<RedesignedChatbotProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, isProcessing, sendMessage, clearChat, lastProvider } = useChatAI();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Close cleanup
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen, isListening]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg || isProcessing) return;
    setInputValue('');
    await sendMessage(msg);
  }, [inputValue, isProcessing, sendMessage]);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ''));
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Auto-speak bot messages
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        speakText(last.content);
      }
    }
  }, [messages, voiceEnabled, speakText]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleClear = () => {
    clearChat();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    toast({ title: 'Chat cleared', description: 'Conversation history has been reset.' });
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={cn('fixed bottom-20 right-4 md:bottom-5 md:right-5 z-40 md:z-50', className)}>
      {/* ── FAB Button ──────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-royal hover:shadow-sleek-xl transition-shadow duration-300 flex items-center justify-center"
            >
              <img src="/chatbot.png" alt="CityScope AI" className="h-full w-full object-cover" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Window ─────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-[calc(100vw-32px)] sm:w-[400px] h-[calc(100dvh-140px)] sm:h-[600px] bg-white rounded-2xl shadow-sleek-2xl overflow-hidden flex flex-col border border-gray-100/80"
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="bg-gradient-to-r from-royal via-royal-700 to-blue-600 px-5 py-4 flex items-center gap-3 relative flex-shrink-0">
              <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0">
                <img src="/chatbot.png" alt="CityScope AI" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight">CityScope AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-white/75 font-medium">Online</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ── Messages ────────────────────────────── */}
            <ScrollArea className="flex-1 bg-bone-50">
              <div className="px-4 py-4 space-y-3">
                {/* Welcome + Quick Actions when empty */}
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Welcome */}
                    <div className="text-center py-4">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-royal">
                        <img src="/chatbot.png" alt="CityScope AI" className="h-full w-full object-cover" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Hey{user ? `, ${user.name || user.email?.split('@')[0]}` : ''}! 👋
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                        I'm your CityScope AI assistant. Ask me anything about civic issues, navigate the app, or get live stats.
                      </p>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-2 px-1">
                      {quickActions.map((action, i) => (
                        <motion.button
                          key={action.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          onClick={() => handleSend(action.message)}
                          disabled={isProcessing}
                          className={cn(
                            'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200',
                            'hover:shadow-soft hover:-translate-y-0.5 active:scale-[0.98]',
                            'disabled:opacity-50 disabled:pointer-events-none',
                            action.color
                          )}
                        >
                          <action.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-semibold">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Message Bubbles */}
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    index={index}
                    onSuggestionClick={handleSend}
                    isProcessing={isProcessing}
                  />
                ))}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-6 w-6 rounded-lg overflow-hidden flex-shrink-0 mt-0.5">
                        <img src="/chatbot.png" alt="AI" className="h-full w-full object-cover" />
                      </div>
                      <div className="bg-white rounded-xl rounded-tl-sm px-3.5 py-2.5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-royal/60 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-royal/60 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-royal/60 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-[11px] text-gray-400 ml-1">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* ── Input Bar ───────────────────────────── */}
            <div className="px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Voice */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                    isListening
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  )}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </motion.button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={isListening ? 'Listening...' : 'Ask me anything...'}
                    disabled={isProcessing || isListening}
                    className={cn(
                      'w-full h-9 px-3.5 text-[13px] rounded-xl border bg-gray-50/80 transition-all duration-200',
                      'placeholder:text-gray-400 focus:bg-white focus:border-royal/30 focus:ring-2 focus:ring-royal/10 focus:outline-none',
                      'disabled:opacity-50',
                      isListening && 'border-red-300 bg-red-50/50'
                    )}
                  />
                  {isListening && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Send */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isProcessing}
                  className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                    inputValue.trim() && !isProcessing
                      ? 'bg-royal text-white shadow-md hover:bg-royal-700'
                      : 'bg-gray-100 text-gray-400'
                  )}
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-royal/40" />
                  <span className="text-[10px] text-gray-400 font-medium">
                    Powered by AI
                  </span>
                </div>
                {isSpeaking && (
                  <button
                    onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
                    className="text-[10px] text-royal/60 hover:text-royal font-medium"
                  >
                    Stop speaking
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Message Bubble Component ───────────────────────────────────
const MessageBubble: React.FC<{
  message: ChatMessage;
  index: number;
  onSuggestionClick: (text: string) => void;
  isProcessing: boolean;
}> = React.memo(({ message, index, onSuggestionClick, isProcessing }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.15) }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="h-6 w-6 rounded-lg overflow-hidden flex-shrink-0 mr-2 mt-0.5">
          <img src="/chatbot.png" alt="AI" className="h-full w-full object-cover" />
        </div>
      )}

      <div className={cn('max-w-[82%] space-y-1.5', isUser && 'order-first')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5',
            isUser
              ? 'bg-gradient-to-br from-royal to-blue-600 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm',
            isSystem && 'bg-amber-50 border-amber-200 text-amber-800'
          )}
        >
          <div className={cn(isUser && 'text-white/95')}>
            {isUser ? (
              <p className="text-[13px] leading-relaxed">{message.content}</p>
            ) : (
              formatMarkdown(message.content)
            )}
          </div>

          {/* Timestamp */}
          <div className={cn(
            'text-[10px] mt-1.5',
            isUser ? 'text-white/50' : 'text-gray-400'
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.navigateTo && (
              <span className="ml-2 text-emerald-500 font-medium">
                <ArrowRight className="h-2.5 w-2.5 inline mr-0.5" />
                Navigating...
              </span>
            )}
          </div>
        </div>

        {/* Report Card */}
        {message.reportCard && (
          <div className={cn(
            'rounded-xl p-3 border text-left',
            message.reportCard.status === 'submitted'
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200/60'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {message.reportCard.status === 'submitted' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span className={cn('text-xs font-bold', message.reportCard.status === 'submitted' ? 'text-emerald-700' : 'text-red-700')}>
                {message.reportCard.status === 'submitted' ? 'Report Filed Successfully' : 'Submission Failed'}
              </span>
            </div>
            <div className="text-[11px] text-gray-600 space-y-0.5">
              <p>📋 <strong>{message.reportCard.category.charAt(0).toUpperCase() + message.reportCard.category.slice(1)}</strong></p>
              <p className="truncate">📌 {message.reportCard.title}</p>
              <p className="truncate">📍 {message.reportCard.location}</p>
              {message.reportCard.issueId && (
                <p className="text-[10px] text-gray-400 mt-1">ID: {message.reportCard.issueId.slice(0, 8)}</p>
              )}
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-0.5">
            {message.suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isProcessing}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200',
                  'bg-white text-royal border-royal/15 hover:bg-royal/5 hover:border-royal/30',
                  'active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default RedesignedChatbot;

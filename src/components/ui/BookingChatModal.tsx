import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { listenToBookingMessages, sendBookingMessage, DBBookingMessage } from '../../services/db_services';

interface BookingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle: string;
  currentUser: {
    uid: string;
    displayName?: string;
    email?: string;
  };
  currentRole: 'customer' | 'vendor' | 'admin';
}

export const BookingChatModal: React.FC<BookingChatModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingTitle,
  currentUser,
  currentRole,
}) => {
  const [messages, setMessages] = useState<DBBookingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    setIsLoading(true);
    // Setup real-time listener
    const unsubscribe = listenToBookingMessages(bookingId, (fetchedMessages) => {
      setMessages(fetchedMessages);
      setIsLoading(false);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, bookingId]);

  // Scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !bookingId) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await sendBookingMessage({
        bookingId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        senderRole: currentRole,
        text: messageText,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="booking-chat-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#06050A]/85 backdrop-blur-sm"
      />

      {/* Main chat box container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg h-[550px] bg-[#12111A] text-[#F5F5F4] rounded-[24px] shadow-2xl flex flex-col z-10 border border-white/[0.04] overflow-hidden"
      >
        {/* Chat Header */}
        <div className="p-5 border-b border-white/[0.04] bg-[#171624] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#6C4CF1]/10 rounded-xl flex items-center justify-center text-[#B4A2FF]">
              <MessageSquare className="w-5 h-5 text-[#B4A2FF]" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm sm:text-base text-[#F5F5F4] tracking-tight truncate max-w-[250px]">
                {bookingTitle}
              </h3>
              <p className="text-[10px] text-[#A8A29E] font-medium tracking-wide uppercase font-mono flex items-center gap-1.5 mt-0.5">
                <span>Secure Workspace Channel</span>
                <span className="text-[#B4A2FF] bg-[#6C4CF1]/10 px-1 py-0.2 rounded font-bold uppercase">
                  {currentRole}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#A8A29E] hover:text-[#F5F5F4] transition-colors p-1.5 rounded-full hover:bg-white/[0.04] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body section */}
        <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-[#0E0D14]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-6 h-6 text-[#6C4CF1] animate-spin" />
              <p className="text-xs text-neutral-400 font-light font-mono">Connecting to live ledger...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-[#A8A29E] border border-white/[0.02]">
                <Sparkles className="w-5 h-5 text-[#A8A29E]/60 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-300">No messages yet</p>
                <p className="text-xs text-neutral-500 max-w-xs font-light">
                  Type a message below to connect with your coordinator or service provider instantly.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.uid;
              return (
                <div
                  key={msg.id || msg.timestamp}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {msg.senderName} ({msg.senderRole.toUpperCase()})
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-xs font-sans leading-relaxed ${
                      isMe
                        ? 'bg-[#6C4CF1] text-white rounded-tr-none'
                        : 'bg-[#1C1A2D] text-[#F5F5F4] rounded-tl-none border border-white/[0.02]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-white/[0.04] bg-[#12111A] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your secure message..."
            className="flex-grow bg-[#171624] text-[#F5F5F4] text-xs px-4 py-3 rounded-xl border border-white/[0.04] focus:outline-none focus:border-[#6C4CF1]/40 focus:ring-1 focus:ring-[#6C4CF1]/40"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-[#6C4CF1] hover:bg-[#5B3ED6]/90 disabled:opacity-50 disabled:hover:bg-[#6C4CF1] text-white rounded-xl transition-all shadow-md shrink-0 cursor-pointer flex items-center justify-center hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

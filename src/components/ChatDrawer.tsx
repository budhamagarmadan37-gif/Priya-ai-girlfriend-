import { useEffect, useState, FormEvent } from "react";
import { ChatMessage, subscribeToChatMessages, saveChatMessage } from "../lib/firebase";
import { MessageSquare, Send, X, Database, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSendTextMessage?: (text: string) => void;
  isConnected: boolean;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  sessionId,
  onSendTextMessage,
  isConnected
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  // Subscribe to real-time updates from Firebase Firestore
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToChatMessages(sessionId, (liveMessages) => {
      setMessages(liveMessages);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    // Save to Firebase Firestore real-time database storage
    await saveChatMessage(text, "user", sessionId);

    // Also trigger WebSocket send if connected
    if (onSendTextMessage && isConnected) {
      onSendTextMessage(text);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 w-full sm:w-96 h-full bg-slate-900/95 border-l border-white/10 shadow-2xl flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Realtime Firebase Log
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Synced with Cloud Firestore
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 opacity-40 animate-bounce" />
                  <p className="text-xs font-medium">No real-time logs stored yet</p>
                  <p className="text-[10px] text-slate-600 max-w-xs">
                    Start talking or typing with Priya to sync chat logs directly to Firebase Firestore.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.sender === "user"
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed border shadow-md ${
                        msg.sender === "user"
                          ? "bg-cyan-950/60 border-cyan-500/20 text-cyan-100 rounded-tr-none"
                          : "bg-slate-800/80 border-white/10 text-slate-100 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <span className="block mt-1 text-[9px] opacity-40 font-mono text-right">
                        {msg.timestamp
                          ? new Date(
                              msg.timestamp?.seconds
                                ? msg.timestamp.seconds * 1000
                                : Date.now()
                            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now"}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-slate-950/60 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type and sync to Firebase..."
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white disabled:opacity-40 hover:opacity-90 transition cursor-pointer shrink-0 shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

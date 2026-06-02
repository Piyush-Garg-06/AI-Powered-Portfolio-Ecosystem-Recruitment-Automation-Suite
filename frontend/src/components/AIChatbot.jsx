import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AIChatbot = ({ username, ownerName, isInline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = ownerName || username || "Developer";
  const [messages, setMessages] = useState([
    { text: `Hi! I am ${displayName}'s AI Assistant. Ask me about their technical skills, projects, or background! 🚀`, isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick suggestion prompts for recruiters
  const suggestions = [
    "What is their tech stack? 💻",
    "Tell me about their top projects. 🌟",
    "Are they open to relocation or remote? 🌎",
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || !username) return;

    // Add user message
    const userMessage = { text: text, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ 
          username: username, 
          targetUsername: username, 
          message: text 
        })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.reply || "No direct reply received from server.", isUser: false }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Backend server connection error!", isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  if (isInline) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950/20 overflow-hidden font-sans">
        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-950/30 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'ml-auto justify-end' : 'justify-start'}`}
            >
              {!msg.isUser && (
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                </div>
              )}
              
              <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm text-left ${
                msg.isUser 
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-tr-none border border-slate-800 dark:border-zinc-205' 
                  : 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-2 max-w-[80%] items-center text-slate-400 dark:text-zinc-500 justify-start">
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 border border-indigo-500 dark:border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
              <span className="text-[10px] italic">AI is writing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Recruiter Suggestions */}
        {messages.length === 1 && (
          <div className="p-3 bg-slate-100/50 dark:bg-zinc-900/20 border-t border-slate-200 dark:border-zinc-900/60 space-y-1.5 text-left">
            <span className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold tracking-widest uppercase px-1">Suggested Prompts</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-[9px] bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Bar */}
        <div className="p-3 bg-slate-50/80 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-900 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me something about their profile..." 
            className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-150 disabled:opacity-40 disabled:hover:bg-slate-900 text-white dark:text-zinc-950 transition flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold border border-slate-800 dark:border-zinc-300 shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 group cursor-pointer"
      >
        {isOpen ? (
          <>
            <X className="w-5 h-5" />
            <span>Close Chat</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            <span>Ask My AI</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </>
        )}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] md:w-[380px] h-[500px] bg-white dark:bg-zinc-950/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 dark:bg-zinc-900 text-white flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 dark:bg-zinc-800 border border-white/20 dark:border-zinc-700 rounded-xl">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold leading-none text-white dark:text-zinc-100">AI Agent</h3>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Assistant of {displayName}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 dark:hover:bg-zinc-800 rounded-lg text-white/80 dark:text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-950/30 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-2 max-w-[85%] ${msg.isUser ? 'ml-auto justify-end' : 'justify-start'}`}
              >
                {!msg.isUser && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm text-left ${
                  msg.isUser 
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-none border border-slate-800 dark:border-zinc-200' 
                    : 'bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2 max-w-[80%] items-center text-slate-400 dark:text-zinc-500 justify-start">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 border border-indigo-500 dark:border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
                </div>
                <span className="text-[10px] italic">AI is writing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recruiter Suggestions */}
            {messages.length === 1 && (
              <div className="p-3 bg-slate-100/50 dark:bg-zinc-900/20 border-t border-slate-200 dark:border-zinc-900/60 space-y-1.5 text-left">
                <span className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold tracking-wider uppercase px-1">Suggested Prompts</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-[9px] bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Message Input Bar */}
          <div className="p-3 bg-slate-50/80 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-900 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me something about their profile..." 
              className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-150 disabled:opacity-40 disabled:hover:bg-slate-900 text-white dark:text-zinc-950 transition flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default AIChatbot;
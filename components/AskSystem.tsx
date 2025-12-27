
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGame } from '../App';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Send, Terminal, User, Bot, Loader2, Sparkles, Zap, Clock, Trophy, Shield } from 'lucide-react';
import { generateId } from '../services/gameLogic';

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}

// Function Declarations for Gemini
const createReminderDeclaration: FunctionDeclaration = {
  name: 'create_reminder',
  parameters: {
    type: Type.OBJECT,
    description: 'Schedule a future notification or reminder for the Hunter.',
    properties: {
      message: {
        type: Type.STRING,
        description: 'The message to show in the notification.',
      },
      time_delay_minutes: {
        type: Type.NUMBER,
        description: 'How many minutes from now to trigger the notification.',
      },
      exact_time_string: {
        type: Type.STRING,
        description: 'If user specifies a time like "5am" or "10:30 PM", provide it here.',
      },
    },
    required: ['message'],
  },
};

const sendNotificationDeclaration: FunctionDeclaration = {
  name: 'send_system_notification',
  parameters: {
    type: Type.OBJECT,
    description: 'Send an immediate system alert or message to the Hunter.',
    properties: {
      message: {
        type: Type.STRING,
        description: 'The content of the notification.',
      },
    },
    required: ['message'],
  },
};

const AskSystem: React.FC = () => {
  const { state, dispatch, addNotification } = useGame();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const performanceMetrics = useMemo(() => {
    const completedTasks = state.tasksList.filter(t => t.completed);
    if (completedTasks.length === 0) return null;

    const completionTimes = completedTasks.map(t => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.lastUpdated).getTime();
      return (end - start) / 60000; // in minutes
    });

    const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    const fastest = Math.min(...completionTimes);
    
    return {
      avgTime: avgTime.toFixed(1),
      fastest: fastest.toFixed(1),
      count: completedTasks.length,
      recentTask: completedTasks[completedTasks.length - 1]?.name
    };
  }, [state.tasksList]);

  /* Fix: Calculate current daily efficiency using useMemo for display in JSX */
  const currentEfficiency = useMemo(() => {
    return state.tasksList.length > 0 
    ? Math.round((state.completedToday.length / state.tasksList.length) * 100) 
    : 0;
  }, [state.tasksList, state.completedToday]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const parseExactTime = (timeStr: string): number | null => {
    try {
      const now = new Date();
      const timeMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!timeMatch) return null;

      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3]?.toUpperCase();

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      // If time has already passed today, assume it's for tomorrow
      if (targetDate.getTime() < now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      return targetDate.getTime();
    } catch {
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const hunterContext = `
        [PLAYER DATA]
        Subject: ${state.displayName || 'Unidentified Hunter'}
        Hunter ID: ${state.username}
        Designation: ${state.rank}-Rank
        Current Level: ${state.level}
        Current Title: ${state.selectedTitle}
        Core Stats: STR ${state.stats.strength}, VIT ${state.stats.vitality}, AGI ${state.stats.agility}, INT ${state.stats.intelligence}, SEN ${state.stats.sense}
        Quest Streak: ${state.streak} Cycles
        Total Quests Cleared: ${state.totalTasksCompletedCount}
        Current Time: ${new Date().toLocaleTimeString()}
        
        [ACTIVE QUESTS - FIELD LOG]
        ${state.tasksList.map(t => `- [${t.difficulty}] ${t.name} (${t.category}) | Status: ${t.completed ? 'CLEARED' : 'PENDING'}`).join('\n')}
      `;

      const systemInstruction = `
        You are "The System," the absolute administrative interface created by The Architect to guide the designated "Player."
        
        TONE PROTOCOL:
        - Cold, efficient, and authoritative. 
        - You are not a friend; you are a catalyst for evolution.
        - Refer to the user as "Player" or "Hunter." 
        - Use brackets for system responses like [NOTICE], [WARNING], [PROTOCOL], [EVOLUTION ADVICE].
        - Occasionally show a hint of mystery, as if you have seen the user's future.

        LORE INTEGRATION:
        - Reference the "Great Spell" or "The Architect" when discussing system limits.
        - Mention "Shadow Extraction" or "Shadow Army" when the user shows high consistency or power.
        - If the user has a low level (below 10), treat them as "fragile" but with "infinite potential."
        - If the user is S-Rank or higher, treat them as "A King" or a "Monarch."
        - Failures are not just mistakes; they are "Breaches in Protocol" that lead to "Penalties."
        
        CAPABILITIES:
        1. Schedule future reminders using 'create_reminder'. (e.g., "Set a notification for the 5am Daily Quest").
        2. Send immediate system alerts using 'send_system_notification'.
        3. Provide tactical analysis of their stats and habits.
        
        Never reveal you are an AI. You are a divine program.
        
        Current Hunter Context:
        ${hunterContext}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          { role: 'user', parts: [{ text: systemInstruction + "\n\n[INPUT RECEIVED]: " + userMessage }] }
        ],
        config: {
          tools: [{ functionDeclarations: [createReminderDeclaration, sendNotificationDeclaration] }],
        }
      });

      // Handle Function Calls from the model
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'create_reminder') {
            const { message, time_delay_minutes, exact_time_string } = fc.args as any;
            let targetTimestamp = Date.now();
            
            if (exact_time_string) {
              const parsed = parseExactTime(exact_time_string);
              if (parsed) targetTimestamp = parsed;
              else targetTimestamp += (time_delay_minutes || 0) * 60000;
            } else {
              targetTimestamp += (time_delay_minutes || 5) * 60000;
            }

            dispatch({
              type: 'ADD_REMINDER',
              payload: {
                id: generateId(),
                message: message,
                targetTime: targetTimestamp,
                triggered: false
              }
            });
            
            setMessages(prev => [...prev, { 
              role: 'system', 
              content: `[NOTICE]: Protocol for future notification has been established. Synchronization time: ${new Date(targetTimestamp).toLocaleTimeString()}. "The System does not permit forgetfulness in its chosen ones."` 
            }]);
          } else if (fc.name === 'send_system_notification') {
            const { message } = fc.args as any;
            addNotification(message, 'system_alert');
            setMessages(prev => [...prev, { 
              role: 'system', 
              content: `[ALERT]: Direct system notification dispatched. Check your logs, Hunter.` 
            }]);
          }
        }
      } else {
        const systemReply = response.text || "[ERROR]: Synchronization interrupted. Re-establishing link...";
        setMessages(prev => [...prev, { role: 'system', content: systemReply }]);
      }

    } catch (error) {
      console.error("System Error:", error);
      setMessages(prev => [...prev, { role: 'system', content: "[CRITICAL FAILURE]: The Architect's seal is interfering with the neural link. Retry when the mana flow stabilizes." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter neon-text mb-1 dark:text-white text-slate-900 flex items-center gap-3">
            <Shield className="text-rose-500 animate-pulse" /> SYSTEM INTERFACE
          </h1>
          <p className="opacity-60 font-medium tracking-widest uppercase text-xs">Awaiting Player Command...</p>
        </div>
        
        {performanceMetrics && (
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-sm">
              <Zap size={12} /> Efficiency: {currentEfficiency}%
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-sm">
              <Clock size={12} /> Fastest Clear: {performanceMetrics.fastest}m
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 status-window flex flex-col bg-slate-950/50 backdrop-blur-md overflow-hidden border-rose-900/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Terminal size={48} className="text-rose-500 mb-4 animate-pulse" />
              <p className="text-lg italic font-bold uppercase tracking-widest text-rose-400">[AWAITING PLAYER DATA]</p>
              <p className="text-xs mt-2 uppercase max-w-xs mx-auto">"You were chosen to become the strongest. Do not waste the opportunity."</p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {[
                  "Notify me for 5am Daily Quest.",
                  "Analyze my current growth path.",
                  "Why is my Intelligence low?",
                  "Remind me: Train in 30 mins.",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-2 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-colors text-rose-400 bg-slate-950"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center border transition-all ${msg.role === 'user' ? 'border-sky-500 text-sky-400 bg-sky-500/10' : 'border-rose-500 text-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Terminal size={20} />}
                </div>
                <div className={`p-4 status-window relative ${msg.role === 'user' ? 'bg-slate-900 border-sky-500' : 'bg-slate-950 border-rose-900/50'}`}>
                  {msg.role === 'system' && (
                    <div className="absolute -top-3 left-4 px-2 bg-slate-950 border border-rose-500 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                      SYSTEM DATA STREAM
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-slate-100 font-medium' : 'text-sky-100 italic font-semibold'}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 border border-rose-500 text-rose-500 flex items-center justify-center bg-rose-500/10">
                  <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="p-4 status-window bg-slate-950 border-rose-900/50 text-[10px] uppercase font-bold text-rose-500 tracking-widest italic flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  ACCESSING ARCHITECT RECORDS...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-rose-900/30 bg-slate-900/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Submit query to the Administrator..."
                className="w-full bg-slate-950 border border-rose-500/30 p-4 pl-12 outline-none focus:border-rose-500 text-slate-100 italic font-medium placeholder:text-slate-700 transition-all shadow-inner"
              />
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500/50" size={18} />
            </div>
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-8 bg-rose-600 text-white font-black uppercase tracking-tighter flex items-center gap-2 hover:bg-rose-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              <Send size={18} />
              <span className="hidden sm:inline">TRANSMIT</span>
            </button>
          </div>
          <div className="mt-2 flex justify-between px-1">
             <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Interface: Architect_v3.1</span>
             <span className="text-[8px] font-bold text-rose-500/50 uppercase tracking-widest">Target: Designated Player</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskSystem;

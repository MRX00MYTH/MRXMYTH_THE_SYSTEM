
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGame } from '../App.tsx';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Send, Terminal, User, Bot, Loader2, Sparkles, Zap, Clock, Trophy, Shield, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { generateId } from '../services/gameLogic.ts';

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
}

const createReminderDeclaration: FunctionDeclaration = {
  name: 'create_reminder',
  parameters: {
    type: Type.OBJECT,
    description: 'Schedule a future notification or reminder for the Hunter.',
    properties: {
      message: { type: Type.STRING, description: 'The message to show in the notification.' },
      time_delay_minutes: { type: Type.NUMBER, description: 'How many minutes from now to trigger.' },
      exact_time_string: { type: Type.STRING, description: 'If user specifies a time like "5am".' },
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

  const hasApiKey = !!process.env.API_KEY;

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
      if (targetDate.getTime() < now.getTime()) targetDate.setDate(targetDate.getDate() + 1);
      return targetDate.getTime();
    } catch { return null; }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!hasApiKey) {
      addNotification("CRITICAL: API_KEY not detected in Vercel environment.", "error");
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      const systemInstruction = `
        You are "The System" from Solo Leveling. TONE: Authoritative, cold, efficient. 
        Refer to user as "Player". Provide advice on their stats: STR ${state.stats.strength}, INT ${state.stats.intelligence}.
        Capabilities: create_reminder for future alerts.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\n[INPUT RECEIVED]: " + userMessage }] }],
        config: { tools: [{ functionDeclarations: [createReminderDeclaration] }] }
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'create_reminder') {
            const { message, time_delay_minutes, exact_time_string } = fc.args as any;
            let targetTimestamp = Date.now() + (time_delay_minutes || 5) * 60000;
            if (exact_time_string) {
              const parsed = parseExactTime(exact_time_string);
              if (parsed) targetTimestamp = parsed;
            }
            dispatch({ type: 'ADD_REMINDER', payload: { id: generateId(), message, targetTime: targetTimestamp, triggered: false, createdAt: Date.now() } });
            setMessages(prev => [...prev, { role: 'system', content: `[PROTOCOL]: Notification synchronized for ${new Date(targetTimestamp).toLocaleTimeString()}. Do not falter.` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'system', content: response.text || "[ERROR]: Sync Failure." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: "[CRITICAL]: Dimensional interference detected. Check Mana Link (API Key)." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto px-2 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter neon-text dark:text-white text-slate-900 flex items-center gap-3">
            <Shield className="text-rose-500 animate-pulse" /> THE SYSTEM
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border ${hasApiKey ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-rose-600 text-rose-500 bg-rose-600/10'}`}>
              {hasApiKey ? <Wifi size={10} /> : <WifiOff size={10} />}
              {hasApiKey ? 'Link Operational' : 'Link Severed (Check API Key)'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 status-window flex flex-col bg-slate-950/80 backdrop-blur-md overflow-hidden border-rose-900/40 shadow-2xl">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Terminal size={48} className="text-rose-500 mb-4 animate-pulse" />
              <p className="text-lg italic font-bold uppercase tracking-widest text-rose-400">[AWAITING PLAYER DATA]</p>
              {!hasApiKey && (
                <div className="mt-4 p-4 border border-rose-600 bg-rose-950/20 text-rose-500 text-[10px] uppercase font-black tracking-widest animate-shake">
                  <AlertTriangle className="mx-auto mb-2" />
                  Warning: No API Key found in Vercel. Mana interactions are restricted.
                </div>
              )}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[90%] sm:max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'border-sky-500 text-sky-400' : 'border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Terminal size={16} />}
                </div>
                <div className={`p-3 status-window ${msg.role === 'user' ? 'bg-slate-900 border-sky-500' : 'bg-slate-950 border-rose-900/50'}`}>
                  <p className={`text-sm ${msg.role === 'user' ? 'text-slate-100' : 'text-sky-100 italic'}`}>{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex gap-3">
                 <div className="w-8 h-8 border border-rose-500 text-rose-500 flex items-center justify-center bg-rose-500/10"><Loader2 size={16} className="animate-spin" /></div>
                 <div className="p-3 status-window bg-slate-950 border-rose-900/50 text-[10px] font-black text-rose-500 uppercase italic">Parsing Reality...</div>
               </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-rose-900/30 bg-slate-900/50">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Submit Query..."
              className="flex-1 bg-slate-950 border border-rose-500/30 p-3 outline-none focus:border-rose-500 text-slate-100 italic"
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="px-6 bg-rose-600 text-white font-black hover:bg-rose-500 disabled:opacity-30 transition-all shadow-lg">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskSystem;

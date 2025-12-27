
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../App.tsx';
import { getInitialState, RANK_THRESHOLDS } from '../constants.ts';
import { calculateRank, getLevelThreshold } from '../services/gameLogic.ts';
import { systemAudio } from '../services/audioService.ts';
import { 
  Save, Moon, Sun, 
  AlertTriangle, Monitor,
  DatabaseZap, AlertOctagon,
  ShieldAlert, Ghost, Clock, RotateCcw,
  Camera, ImageIcon, LinkIcon, Volume2, VolumeX,
  Bell, BellOff, Smartphone, Check, Send, Activity,
  ShieldCheck
} from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { state, dispatch, addNotification, triggerSequence, requestPurge, requestReset } = useGame();
  
  // Local states for inputs that need debouncing
  const [localDisplayName, setLocalDisplayName] = useState(state.displayName);
  const [localResetTime, setLocalResetTime] = useState(state.dailyResetTime || "00:00");
  const [isPhotoUrlMode, setIsPhotoUrlMode] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Debounce timers
  const nameTimer = useRef<number | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    // Keep local inputs in sync with global state if it changes externally
    setLocalDisplayName(state.displayName);
    setLocalResetTime(state.dailyResetTime || "00:00");
    if ("Notification" in window) {
      setNotifPermission(window.Notification.permission);
    }
  }, [state.displayName, state.dailyResetTime]);

  const updateProfile = (payload: any) => {
    dispatch({ type: 'UPDATE_PROFILE', payload });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({ selectedTitle: e.target.value });
    systemAudio.play('click');
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalDisplayName(val);
    if (nameTimer.current) window.clearTimeout(nameTimer.current);
    nameTimer.current = window.setTimeout(() => {
      updateProfile({ displayName: val });
    }, 500);
  };

  const handleResetTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalResetTime(val);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      updateProfile({ dailyResetTime: val });
    }, 500);
  };

  const handleToggleAnimations = () => {
    updateProfile({ animationsEnabled: !state.animationsEnabled });
    systemAudio.play('click');
  };

  const handleToggleDeviceNotifs = async () => {
    if (!("Notification" in window)) {
      addNotification("Device does not support Neural Link notifications.", "error");
      return;
    }
    
    if (window.Notification.permission === "denied") {
      addNotification("Hardware block detected. Manually reset browser permissions.", "error");
      return;
    }

    if (window.Notification.permission === "default") {
      const permission = await window.Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        updateProfile({ deviceNotificationsEnabled: true });
        addNotification("Neural Link established. System alerts authorized.", "success");
        new window.Notification("[THE SYSTEM]", { 
          body: "Synchronization complete. Welcome, Hunter.",
          icon: state.profilePic || undefined
        });
      } else {
        addNotification("Neural Link rejected. System restricted to internal logs.", "warning");
      }
    } else {
      const newState = !state.deviceNotificationsEnabled;
      updateProfile({ deviceNotificationsEnabled: newState });
      addNotification(newState ? "Neural Link re-established." : "Neural Link decoupled.", "info");
      systemAudio.play('click');
    }
  };

  const handleTestNotification = () => {
    if (!state.deviceNotificationsEnabled || window.Notification.permission !== "granted") {
      addNotification("ERROR: Neural Link is offline.", "error");
      return;
    }

    addNotification("Sending test pulse to device panel...", "info");
    try {
      new window.Notification("[NEURAL LINK TEST]", {
        body: `Hunter ${state.displayName}, this is a test pulse from the interface. Data integrity verified.`,
        icon: state.profilePic || undefined,
        tag: 'system-test'
      });
      systemAudio.play('sync');
    } catch (e) {
      addNotification("Protocol Failure: Device rejected external pulse.", "error");
    }
  };

  const handleChangeSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateProfile({ animationSpeed: val });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    systemAudio.setVolume(val);
    updateProfile({ soundVolume: val });
    systemAudio.play('click');
  };

  const handlePhotoUpdate = (data: string) => {
    updateProfile({ profilePic: data });
    addNotification("Profile imagery updated.", "info");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handlePhotoUpdate(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = () => {
    triggerSequence('backup', () => {
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `hunter_backup_${state.username || 'player'}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      addNotification('Mana Core Backup generated.', 'success');
    });
  };

  const handleCheated = () => {
    triggerSequence('PENALTY_DETECTED', () => {
      const penalties = ['SUB_LVL_1', 'SUB_LVL_2', 'SUB_EXP_200', 'SUB_RANK_1', 'STREAK_0'];
      const penalty = penalties[Math.floor(Math.random() * penalties.length)];
      let updatedState = { ...state };
      let notificationMsg = "";
      const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S', 'SS'];
      switch (penalty) {
        case 'SUB_LVL_1': updatedState.level = Math.max(1, state.level - 1); notificationMsg = "[PENALTY]: Level reduced by 1."; break;
        case 'SUB_LVL_2': updatedState.level = Math.max(1, state.level - 2); notificationMsg = "[PENALTY]: Level reduced by 2."; break;
        case 'SUB_EXP_200': updatedState.cumulativeEXP = Math.max(0, state.cumulativeEXP - 200); updatedState.totalEXP = Math.max(0, state.totalEXP - 200); notificationMsg = "[PENALTY]: 200 EXP lost."; break;
        case 'SUB_RANK_1': {
          const newIdx = Math.max(0, rankOrder.indexOf(state.rank) - 1);
          updatedState.rank = rankOrder[newIdx] as any;
          notificationMsg = "[PENALTY]: Rank demoted.";
          break;
        }
        case 'STREAK_0': updatedState.streak = 0; notificationMsg = "[PENALTY]: Streak reset."; break;
      }
      updatedState.rank = calculateRank(updatedState.cumulativeEXP);
      dispatch({ type: 'IMPORT_DATA', payload: updatedState });
      addNotification(notificationMsg, 'error');
    });
  };

  const updateTheme = (newTheme: 'light' | 'dark') => {
    updateProfile({ theme: newTheme });
    systemAudio.play('click');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-8 pb-24 mobile-centered animate-fade-in">
      {/* Identity Node */}
      <div className={`status-window p-4 sm:p-8 transition-colors ${state.theme === 'dark' ? 'bg-slate-900/80 border-sky-500' : 'bg-white border-sky-600 shadow-sm'}`}>
        <div className="flex justify-between items-start mb-8 border-b border-sky-500/30 pb-4">
          <h1 className={`text-2xl sm:text-4xl font-black italic uppercase tracking-tighter neon-text ${state.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Identity Node</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
            <Check size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest italic">Live Sync</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 border-2 border-sky-500 relative group overflow-hidden bg-slate-800">
              {state.profilePic ? <img src={state.profilePic} alt="Avatar" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-700 w-full h-full p-6" />}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <label className="cursor-pointer p-2 text-white hover:text-sky-400">
                  <Camera size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
            <button onClick={() => setIsPhotoUrlMode(!isPhotoUrlMode)} className="text-[10px] uppercase font-bold text-sky-500 hover:text-sky-400 transition-colors flex items-center gap-1"><LinkIcon size={12} /> {isPhotoUrlMode ? "Hide URL Input" : "Use Image URL"}</button>
            {isPhotoUrlMode && <input type="text" value={state.profilePic} onChange={e => handlePhotoUpdate(e.target.value)} placeholder="https://..." className={`w-full border border-sky-500/30 p-2 text-[10px] outline-none font-bold tracking-widest ${state.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`} />}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2"><ShieldAlert size={12} /> Hunter ID <span className="text-[8px] opacity-60">(Immutable)</span></label><input type="text" readOnly value={state.username} className={`border border-sky-500/30 p-2 sm:p-3 outline-none font-bold tracking-widest transition-colors text-sm sm:text-base opacity-40 cursor-not-allowed ${state.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`} /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-bold text-sky-500 tracking-widest">Hunter Name</label><input type="text" value={localDisplayName} onChange={handleDisplayNameChange} className={`border border-sky-500/30 p-2 sm:p-3 outline-none font-bold tracking-widest transition-colors text-sm sm:text-base ${state.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`} /></div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-bold text-sky-500 tracking-widest">Hunter Title</label><select value={state.selectedTitle} onChange={handleTitleChange} className={`border border-sky-500/30 p-2 sm:p-3 outline-none uppercase font-bold tracking-widest text-[10px] sm:text-sm transition-colors ${state.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}>{state.titlesUnlocked.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] uppercase font-bold text-sky-500 tracking-widest flex items-center gap-2"><Clock size={12} /> Cycle Reset Protocol</label><div className="flex items-center gap-3 bg-slate-800/20 p-2 border border-sky-500/30"><input type="time" value={localResetTime} onChange={handleResetTimeChange} className={`flex-1 bg-transparent border-none outline-none font-black italic text-sky-400`} /></div></div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-1"><label className="text-[10px] uppercase font-bold text-sky-500 tracking-widest">Interface Polarity</label><div className="flex gap-2"><button onClick={() => updateTheme('dark')} className={`flex-1 py-3 flex items-center justify-center gap-2 border-2 transition-all uppercase font-black text-[10px] ${state.theme === 'dark' ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'border-slate-300 text-slate-400'}`}>Night</button><button onClick={() => updateTheme('light')} className={`flex-1 py-3 flex items-center justify-center gap-2 border-2 transition-all uppercase font-black text-[10px] ${state.theme === 'light' ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'border-slate-300 text-slate-400'}`}>Day</button></div></div>
      </div>

      {/* Neural Link */}
      <div className={`status-window p-4 sm:p-8 transition-colors ${state.theme === 'dark' ? 'bg-slate-900/80 border-sky-500' : 'bg-white border-sky-600 shadow-sm'}`}>
        <h2 className={`text-xl sm:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 mb-4 sm:mb-8 ${state.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><Smartphone className="text-sky-400" size={20} /> Neural Link synchronization</h2>
        <div className="p-6 bg-sky-500/5 border border-sky-500/20 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`p-2 rounded-sm transition-all ${state.deviceNotificationsEnabled ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                  {state.deviceNotificationsEnabled ? <Activity className="animate-pulse" size={18} /> : <BellOff size={18} />}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Device Notification Protocol</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold italic leading-relaxed">
                {notifPermission === 'denied' 
                  ? "DEVICE PROTOCOL REJECTED: Internal link blocked by hardware settings. Reset browser permissions." 
                  : "Bridge system alerts directly to your device's notification panel."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {state.deviceNotificationsEnabled && (
                <button 
                  onClick={handleTestNotification}
                  className="px-6 py-3 font-black uppercase tracking-widest text-[10px] transition-all border-2 border-sky-500/50 text-sky-400 hover:bg-sky-500 hover:text-slate-950 flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Test Pulse
                </button>
              )}
              <button 
                onClick={handleToggleDeviceNotifs} 
                className={`px-8 py-3 font-black uppercase tracking-widest text-xs transition-all border-2 ${state.deviceNotificationsEnabled ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-sky-500 text-sky-500 hover:bg-sky-500/10'}`}
              >
                {notifPermission === 'default' ? "Request Link" : state.deviceNotificationsEnabled ? "Link Active" : "Link Decoupled"}
              </button>
            </div>
          </div>
          
          <div className="border-t border-sky-500/10 pt-4">
            <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase italic">
              <ShieldCheck size={12} className="text-emerald-500" /> 
              Status: {state.deviceNotificationsEnabled ? "Synchronized with hardware tray." : "Restricted to interface logs."}
            </div>
          </div>
        </div>
      </div>

      {/* Acoustic Resonance */}
      <div className={`status-window p-4 sm:p-8 transition-colors ${state.theme === 'dark' ? 'bg-slate-900/80 border-sky-500' : 'bg-white border-sky-600 shadow-sm'}`}>
        <h2 className={`text-xl sm:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 mb-4 sm:mb-8 ${state.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><Volume2 className="text-sky-400" size={20} /> Acoustic Resonance</h2>
        <div className="p-6 bg-sky-500/5 border border-sky-500/20 flex flex-col gap-4">
          <div className="flex justify-between items-center"><span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">System Feedback Volume</span><div className="flex items-center gap-2">{state.soundVolume === 0 ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-sky-500" />}<span className="text-xs font-black italic text-sky-400">{Math.round(state.soundVolume * 100)}%</span></div></div>
          <input type="range" min="0" max="1" step="0.01" value={state.soundVolume} onChange={handleVolumeChange} className="w-full accent-sky-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          <p className="text-[8px] uppercase font-bold text-slate-500 italic">Mana-synchronized audio logs provide real-time field validation.</p>
        </div>
      </div>

      {/* Engine Settings */}
      <div className={`status-window p-4 sm:p-8 transition-colors ${state.theme === 'dark' ? 'bg-slate-900/80 border-sky-500' : 'bg-white border-sky-600 shadow-sm'}`}>
        <h2 className={`text-xl sm:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 mb-4 sm:mb-8 ${state.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><Monitor className="text-sky-400" size={20} /> Engine Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-sky-500/5 border border-sky-500/20">
            <div className="flex flex-col"><span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Cinematic Effects</span><span className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium mt-1">Global animations</span></div>
            <button onClick={handleToggleAnimations} className={`w-12 sm:w-14 h-6 sm:h-8 flex items-center p-1 transition-all rounded-full ${state.animationsEnabled ? 'bg-sky-500' : 'bg-slate-400'}`}><div className={`w-4 sm:w-6 h-4 sm:h-6 bg-white rounded-full shadow-md transition-transform ${state.animationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} /></button>
          </div>
          <div className="flex flex-col gap-1 p-3 sm:p-4 bg-sky-500/5 border border-sky-500/20"><div className="flex justify-between items-center mb-1"><span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">UI Speed</span><span className="text-xs sm:text-xl font-black italic text-sky-600 dark:text-sky-400">{state.animationSpeed.toFixed(1)}x</span></div><input type="range" min="0.5" max="2.0" step="0.1" value={state.animationSpeed} onChange={handleChangeSpeed} className="flex-1 accent-sky-500 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" /></div>
        </div>
      </div>

      {/* Admin Protocols */}
      <div className={`status-window p-4 sm:p-8 transition-colors ${state.theme === 'dark' ? 'bg-slate-900/80 border-sky-500' : 'bg-white border-sky-600 shadow-sm'}`}>
        <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 mb-4 sm:mb-8 dark:text-white text-slate-900"><DatabaseZap className="text-emerald-500" size={20} /> Admin Protocols</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-slate-500/5 border border-sky-500/20 flex flex-col gap-2"><div className="text-sky-600 font-bold uppercase text-[10px] tracking-widest">Dimensional Backup</div><p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium">Export local Mana state.</p><button onClick={handleBackup} className="mt-2 py-2 bg-sky-600 text-white font-black uppercase text-[10px] hover:bg-sky-500 transition-all tracking-widest">Export JSON</button></div>
          <div className="p-4 sm:p-6 bg-slate-500/5 border border-sky-500/20 flex flex-col gap-2"><div className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">Manual Cycle Reset</div><p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium">Force current day termination.</p><button onClick={requestReset} className="mt-2 py-2 bg-emerald-600 text-white font-black uppercase text-[10px] hover:bg-emerald-500 transition-all tracking-widest flex items-center justify-center gap-2"><RotateCcw size={12} /> Force New Cycle</button></div>
        </div>
      </div>

      {/* Forbidden Zone */}
      <div className="status-window p-4 sm:p-8 border-rose-600/60 bg-rose-600/5 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
        <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-rose-600 flex items-center gap-3 mb-4 sm:mb-8"><ShieldAlert size={20} /> Forbidden Zone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-slate-950/20 border border-rose-500/20 flex flex-col gap-2 group"><div className="text-rose-600 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><Ghost size={12} className="group-hover:animate-bounce" /> Breach Protocol</div><p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium">Attempt forbidden growth injection.</p><button onClick={handleCheated} className="mt-2 py-2 bg-rose-600/20 border border-rose-600 text-rose-600 font-black uppercase text-[10px] hover:bg-rose-600 hover:text-white transition-all tracking-[0.2em] shadow-inner">I Cheated</button></div>
          <div className="p-4 sm:p-6 bg-slate-950/20 border border-rose-500/20 flex flex-col gap-2"><div className="text-rose-600 font-bold uppercase text-[10px] tracking-widest">System Termination</div><p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium">Erase dimensional footprint.</p><button onClick={requestPurge} className="mt-2 py-2 bg-rose-600 border border-rose-600 text-white font-black uppercase text-[10px] hover:bg-rose-700 transition-all tracking-widest">Purge System</button></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

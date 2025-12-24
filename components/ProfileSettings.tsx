
import React, { useState } from 'react';
import { useGame } from '../App';
import { TITLES } from '../constants';
import { Download, Upload, Trash2, Save, Moon, Sun, AlertTriangle, Clock } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { state, dispatch, addNotification } = useGame();
  
  const [username, setUsername] = useState(state.username);
  const [title, setTitle] = useState(state.selectedTitle);
  const [theme, setTheme] = useState(state.theme);
  const [profilePic, setProfilePic] = useState(state.profilePic);
  const [resetTime, setResetTime] = useState(state.resetTime);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: { 
        username, 
        selectedTitle: title, 
        theme, 
        profilePic,
        resetTime 
      }
    });
    addNotification('Profile data synchronized with The System.', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.username && !data.level) throw new Error('Invalid format');
        
        if (confirm('Overwrite existing system data? This cannot be undone.')) {
          dispatch({ type: 'IMPORT_DATA', payload: data });
          addNotification('External data integrated successfully.', 'success');
        }
      } catch (err) {
        addNotification('System error: Incompatible data format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `system_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addNotification('System backup generated.', 'success');
  };

  const handleTerminate = () => {
    if (confirm('Are you sure you want to terminate your account? A 60-second countdown will begin.')) {
      handleExport();
      dispatch({ type: 'START_TERMINATION' });
      addNotification('Termination sequence initiated. Backup exported.', 'warning');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="status-window p-8 bg-slate-900/80">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white neon-text mb-8 border-b border-sky-500/30 pb-4">
          Hunter Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-sky-400">Codename (Username)</label>
              <input 
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-slate-800 border border-sky-500/30 p-3 text-white focus:border-sky-400 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-sky-400">Hunter Title</label>
              <select 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-800 border border-sky-500/30 p-3 text-white focus:border-sky-400 outline-none uppercase font-bold tracking-widest text-sm"
              >
                {state.titlesUnlocked.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-sky-400 flex items-center gap-2">
                <Clock size={12} /> System Reset Time
              </label>
              <input 
                type="time"
                value={resetTime}
                onChange={e => setResetTime(e.target.value)}
                className="bg-slate-800 border border-sky-500/30 p-3 text-white focus:border-sky-400 outline-none uppercase font-bold"
              />
              <p className="text-[10px] text-slate-500 uppercase italic">Determines when daily snapshots are taken and EXP penalties applied.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-sky-400">Profile Image</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-800 border-2 border-sky-400 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {profilePic ? <img src={profilePic} alt="Pic" className="w-full h-full object-cover" /> : <Upload className="text-slate-600" />}
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    id="img-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  <label 
                    htmlFor="img-upload"
                    className="px-4 py-2 border border-sky-500 text-sky-400 uppercase font-bold text-xs cursor-pointer hover:bg-sky-500 hover:text-slate-900 transition-all text-center"
                  >
                    Select File
                  </label>
                  <button 
                    onClick={() => setProfilePic('')}
                    className="text-[10px] uppercase font-bold text-red-500 hover:underline"
                  >
                    Remove Current
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase font-bold text-sky-400">System Theme</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 border ${theme === 'dark' ? 'bg-sky-500 text-slate-900 border-sky-500' : 'border-sky-500/30 text-sky-400'} uppercase font-black text-xs`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 border ${theme === 'light' ? 'bg-sky-500 text-slate-900 border-sky-500' : 'border-sky-500/30 text-sky-400'} uppercase font-black text-xs`}
                >
                  <Sun size={16} /> Light
                </button>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-4 bg-sky-500 text-slate-950 font-black uppercase tracking-widest hover:bg-sky-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
            >
              <Save size={20} /> Synchronize System
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="status-window p-6 bg-slate-900/50 flex flex-col items-center text-center gap-4 hover:border-emerald-500 transition-all">
          <Download size={32} className="text-emerald-400" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Backup Data</h3>
          <p className="text-[10px] text-slate-500 uppercase">Export your progress as a secure JSON archive.</p>
          <button onClick={handleExport} className="w-full py-2 bg-emerald-500/10 border border-emerald-500 text-emerald-500 font-bold uppercase text-xs hover:bg-emerald-500 hover:text-slate-900 transition-all">
            Export JSON
          </button>
        </div>

        <div className="status-window p-6 bg-slate-900/50 flex flex-col items-center text-center gap-4 hover:border-sky-500 transition-all">
          <Upload size={32} className="text-sky-400" />
          <h3 className="font-bold uppercase tracking-widest text-sm">Integrate Data</h3>
          <p className="text-[10px] text-slate-500 uppercase">Load existing Hunter progress from an external file.</p>
          <input type="file" id="import-data" className="hidden" accept=".json" onChange={handleFileImport} />
          <label htmlFor="import-data" className="w-full py-2 bg-sky-500/10 border border-sky-500 text-sky-400 font-bold uppercase text-xs hover:bg-sky-500 hover:text-slate-900 transition-all cursor-pointer text-center">
            Import JSON
          </label>
        </div>

        <div className="status-window p-6 bg-red-900/10 border-red-900/50 flex flex-col items-center text-center gap-4 hover:border-red-500 transition-all">
          <Trash2 size={32} className="text-red-500" />
          <h3 className="font-bold uppercase tracking-widest text-sm text-red-500">Terminate Account</h3>
          <p className="text-[10px] text-slate-500 uppercase">Permanently erase all system records and logs.</p>
          <button onClick={handleTerminate} className="w-full py-2 bg-red-500/10 border border-red-500 text-red-500 font-bold uppercase text-xs hover:bg-red-500 hover:text-slate-900 transition-all">
            Terminate
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

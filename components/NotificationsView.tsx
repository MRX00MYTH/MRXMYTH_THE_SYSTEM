
import React, { useEffect } from 'react';
import { useGame } from '../App';
import { Bell, Check, Info, AlertTriangle, Zap, Shield } from 'lucide-react';

const NotificationsView: React.FC = () => {
  const { state, markNotificationsRead } = useGame();

  useEffect(() => {
    markNotificationsRead();
  }, [markNotificationsRead]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="text-emerald-500" />;
      case 'error': return <AlertTriangle className="text-red-500" />;
      case 'level': return <Zap className="text-amber-500" />;
      case 'rank': return <Shield className="text-sky-500" />;
      default: return <Info className="text-sky-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter neon-text mb-1 dark:text-white text-slate-900">System Messages</h1>
        <p className="opacity-60 font-medium tracking-widest uppercase text-xs">System logs and field reports</p>
      </div>

      <div className="flex flex-col gap-4">
        {state.notifications.length === 0 ? (
          <div className="status-window p-12 text-center opacity-50">
            <Bell size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold uppercase italic">No records found</h2>
          </div>
        ) : (
          state.notifications.map(n => (
            <div key={n.id} className="status-window p-6 dark:bg-slate-900/80 bg-white/80 border-l-4 flex items-center gap-6 transition-all border-sky-500/30">
              <div className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-sky-900 rounded-sm">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <p className="font-bold uppercase tracking-tight italic dark:text-white text-slate-900">{n.message}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1">
                  {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsView;

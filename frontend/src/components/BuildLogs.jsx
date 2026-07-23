import { useEffect, useState } from 'react';
import socket from '../socket';

function BuildLogs({ socketRoom }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!socketRoom) return;

    setLogs([]);
    socket.emit('join-room', socketRoom);

    const handleLog = (data) => {
      if (data.message) {
        setLogs((prev) => [...prev, data.message]);
      }
    };

    socket.on('build-log', handleLog);

    return () => {
      socket.off('build-log', handleLog);
    };
  }, [socketRoom]);

  if (!socketRoom) return null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-700/70 bg-slate-950 text-slate-100 shadow-[0_20px_50px_rgba(2,6,23,0.3)]">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold">Build output</span>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Live stream</span>
      </div>

      <div className="max-h-[320px] overflow-y-auto px-4 py-3 font-mono text-sm leading-6">
        {logs.length === 0 ? (
          <div className="text-slate-400">Waiting for logs...</div>
        ) : (
          logs.map((log, i) => <div key={i} className="whitespace-pre-wrap text-slate-300">{log}</div>)
        )}
      </div>
    </div>
  );
}

export default BuildLogs;
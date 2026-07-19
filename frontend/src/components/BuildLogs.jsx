import { useEffect, useState } from 'react';
import socket from '../socket';

function BuildLogs({ socketRoom }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    console.log('BuildLogs useEffect fired. socketRoom =', socketRoom);
    if (!socketRoom) return;

    setLogs([]);
    console.log('Emitting join-room for:', socketRoom);
    socket.emit('join-room', socketRoom);

    const handleLog = (data) => {
      console.log('RECEIVED LOG:', data);
      if (data.message) {
        setLogs((prev) => [...prev, data.message]);
      }
    };

    socket.on('build-log', handleLog);

socket.onAny((eventName, ...args) => {
  console.log('ANY EVENT RECEIVED:', eventName, args);
});

    return () => {
      console.log('Cleaning up build-log listener for:', socketRoom);
      socket.off('build-log', handleLog);
    };
  }, [socketRoom]);

  if (!socketRoom) return null;

  return (
    <div style={{
      background: '#1e1e1e',
      color: '#0f0',
      fontFamily: 'monospace',
      padding: '1rem',
      marginBottom: '2rem',
      maxHeight: '300px',
      overflowY: 'auto',
      borderRadius: '4px'
    }}>
      <div style={{ color: '#aaa', marginBottom: '0.5rem' }}>Build Logs:</div>
      {logs.length === 0 ? (
        <div>Waiting for logs...</div>
      ) : (
        logs.map((log, i) => <div key={i}>{log}</div>)
      )}
    </div>
  );
}

export default BuildLogs;
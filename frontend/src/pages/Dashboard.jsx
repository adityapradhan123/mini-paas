import { useEffect, useState } from 'react';
import { getDeployments } from '../api';
import { useAuth } from '../AuthContext';
import DeployForm from '../components/DeployForm';
import DeploymentList from '../components/DeploymentList';
import BuildLogs from '../components/BuildLogs';
import socket from '../socket';

function Dashboard() {
  const { user, logoutUser } = useAuth();
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSocketRoom, setActiveSocketRoom] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchDeployments = () => {
    getDeployments()
      .then((res) => setDeployments(res.data))
      .catch((err) => console.error('Failed to fetch deployments:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    const handleBuildLog = (data) => {
      const msg = data.message || '';
      if (msg.startsWith('Deployment live at port') || msg.startsWith('Deployment failed')) {
        fetchDeployments();
        setTimeout(() => {
          setActiveSocketRoom(null);
        }, 2000);
      }
    };
    socket.on('build-log', handleBuildLog);
    return () => socket.off('build-log', handleBuildLog);
  }, []);

  useEffect(() => {
    const handleDeploymentsChanged = () => {
      fetchDeployments();
    };
    socket.on('deployments-changed', handleDeploymentsChanged);
    return () => socket.off('deployments-changed', handleDeploymentsChanged);
  }, []);

  useEffect(() => {
    const handleChecked = (data) => {
      setLastChecked(new Date(data.timestamp));
    };
    socket.on('reconcile-checked', handleChecked);
    return () => socket.off('reconcile-checked', handleChecked);
  }, []);

  const handleDeployStarted = (socketRoom) => {
    setActiveSocketRoom(socketRoom);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mini PaaS Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>{user?.email}</span>
          <button
            onClick={logoutUser}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      <DeployForm onDeployStarted={handleDeployStarted} />
      <BuildLogs socketRoom={activeSocketRoom} />

      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem' }}>
        {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : ''}
      </div>

      <DeploymentList deployments={deployments} />
    </div>
  );
}

export default Dashboard;
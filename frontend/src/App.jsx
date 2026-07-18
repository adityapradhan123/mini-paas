import { useEffect, useState } from 'react';
import { getDeployments } from './api';
import DeployForm from './components/DeployForm';
import DeploymentList from './components/DeploymentList';
import './App.css';

function App() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = () => {
    getDeployments()
      .then((res) => setDeployments(res.data))
      .catch((err) => console.error('Failed to fetch deployments:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const handleDeployed = () => {
    fetchDeployments();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Mini PaaS Dashboard</h1>
      <DeployForm onDeployed={handleDeployed} />
      <DeploymentList deployments={deployments} />
    </div>
  );
}

export default App;
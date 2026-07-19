import { useState } from 'react';
import { deployApp } from '../api';

function DeployForm({ onDeployStarted }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await deployApp(repoUrl, appName);
      onDeployStarted(res.data.socketRoom); // pass the room up to App.jsx
      setRepoUrl('');
      setAppName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <h2>Deploy New App</h2>
      <div>
        <input
          type="text"
          placeholder="GitHub repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
          style={{ width: '300px', marginRight: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="App name"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          required
          style={{ marginRight: '0.5rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Starting...' : 'Deploy'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default DeployForm;


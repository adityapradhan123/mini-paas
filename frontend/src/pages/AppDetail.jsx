import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

function AppDetail() {
  const { id } = useParams();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/deployments')
      .then((res) => {
        const found = res.data.find((d) => d._id === id);
        setDeployment(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;
  if (!deployment) return <p style={{ padding: '2rem' }}>Deployment not found.</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← Back to Dashboard</Link>

      <h1 style={{ marginTop: '1rem' }}>{deployment.appName}</h1>
      <p style={{ color: '#666' }}>Status: <strong>{deployment.status}</strong></p>

      <div style={{ marginTop: '1.5rem', lineHeight: '1.8' }}>
        <div><strong>Image:</strong> {deployment.imageName}</div>
        <div><strong>Container:</strong> {deployment.containerName}</div>
        <div><strong>Port:</strong> {deployment.hostPort}</div>
        <div><strong>Created:</strong> {new Date(deployment.createdAt).toLocaleString()}</div>
        {deployment.errorMessage && (
          <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>
            <strong>Error:</strong> {deployment.errorMessage}
          </div>
        )}
      </div>

      {deployment.status === 'live' && (
        <a
          href={'http://localhost:' + deployment.hostPort}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Visit Live App →
        </a>
      )}
    </div>
  );
}

export default AppDetail;
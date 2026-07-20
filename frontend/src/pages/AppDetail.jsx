import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, deleteDeployment } from '../api';

function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/deployments')
      .then((res) => {
        const found = res.data.find((d) => d._id === id);
        setDeployment(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${deployment.appName}"? This will stop and remove the container permanently.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteDeployment(id);
      navigate('/');
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
      setDeleting(false);
    }
  };

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

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        {deployment.status === 'live' && (
          <a
            href={'http://localhost:' + deployment.hostPort}
            target="_blank"
            rel="noreferrer"
            style={{
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

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: deleting ? 'not-allowed' : 'pointer',
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Deployment'}
        </button>
      </div>
    </div>
  );
}

export default AppDetail;
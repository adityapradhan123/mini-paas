import { Link } from 'react-router-dom';

const statusColors = {
  live: '#22c55e',
  building: '#eab308',
  deploying: '#eab308',
  queued: '#94a3b8',
  failed: '#ef4444',
  stopped: '#64748b',
  deleted: '#334155',
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        backgroundColor: statusColors[status] || '#94a3b8',
        color: 'white',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      {status}
    </span>
  );
}

function DeploymentList({ deployments }) {
  if (deployments.length === 0) {
    return <p style={{ color: '#666' }}>No deployments yet. Deploy your first app above.</p>;
  }

  return (
    <div>
      <h2>Deployments</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {deployments.map((d) => (
          <Link
            to={'/apps/' + d._id}
            key={d._id}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{d.appName}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {new Date(d.createdAt).toLocaleString()}
                </div>
                {d.errorMessage && (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    {d.errorMessage}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <StatusBadge status={d.status} />
                {d.status === 'live' && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('http://localhost:' + d.hostPort, '_blank');
                    }}
                    style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    Visit →
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default DeploymentList;
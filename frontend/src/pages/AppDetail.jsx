import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, deleteDeployment, redeployDeployment } from '../api';
import socket from '../socket';

function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [redeploying, setRedeploying] = useState(false);

  const fetchDeployment = () => {
    api.get('/deployments')
      .then((res) => {
        const found = res.data.find((d) => d._id === id);
        setDeployment(found);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeployment();
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

  const handleRedeploy = async () => {
    const confirmed = window.confirm(`Redeploy "${deployment.appName}" with the latest code from its repo?`);
    if (!confirmed) return;

    setRedeploying(true);
    try {
      const res = await redeployDeployment(id);
      const socketRoom = res.data.socketRoom;

      socket.emit('join-room', socketRoom);

      const handleBuildLog = (data) => {
        const msg = data.message || '';
        if (msg.startsWith('Deployment live at port') || msg.startsWith('Deployment failed')) {
          socket.off('build-log', handleBuildLog);
          setRedeploying(false);
          // The old deployment id gets marked "deleted" after redeploy,
          // so send the user back to the dashboard to find the new one.
          navigate('/');
        }
      };

      socket.on('build-log', handleBuildLog);
    } catch (err) {
      alert('Failed to redeploy: ' + (err.response?.data?.error || err.message));
      setRedeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%)] p-6">
        <div className="rounded-[24px] border border-border/70 bg-bg-secondary/80 px-8 py-6 text-text-secondary shadow-2xl">
          Loading deployment...
        </div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%)] p-6">
        <div className="rounded-[24px] border border-border/70 bg-bg-secondary/80 px-8 py-6 text-text-secondary shadow-2xl">
          Deployment not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%)] p-6 text-text-primary">
      <div className="mx-auto max-w-3xl rounded-[30px] border border-border/70 bg-bg-secondary/80 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:opacity-80">
          ← Back to dashboard
        </Link>

        <div className="mt-5 rounded-[24px] border border-border/70 bg-bg-primary/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Deployment detail</p>
              <h1 className="mt-1 text-3xl font-bold">{deployment.appName}</h1>
              <p className="mt-2 text-sm text-text-secondary">Status: <span className="font-semibold text-text-primary">{deployment.status}</span></p>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
              {deployment.status}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-bg-secondary/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-secondary">Image</div>
              <div className="mt-1 font-medium text-text-primary">{deployment.imageName}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-bg-secondary/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-secondary">Container</div>
              <div className="mt-1 font-medium text-text-primary">{deployment.containerName}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-bg-secondary/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-secondary">Port</div>
              <div className="mt-1 font-medium text-text-primary">{deployment.hostPort}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-bg-secondary/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-secondary">Created</div>
              <div className="mt-1 font-medium text-text-primary">{new Date(deployment.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {deployment.errorMessage && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              <strong>Error:</strong> {deployment.errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {deployment.status === 'live' && (
              <a
                href={'http://localhost:' + deployment.hostPort}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:opacity-90"
              >
                Visit live app →
              </a>
            )}

            {deployment.repoUrl && (
              <button
                onClick={handleRedeploy}
                disabled={redeploying || deleting}
                className="rounded-2xl border border-border/70 bg-bg-secondary/70 px-4 py-2.5 text-sm font-semibold text-text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {redeploying ? 'Redeploying...' : 'Redeploy'}
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting || redeploying}
              className="rounded-2xl border border-rose-300 bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deleting ? 'Deleting...' : 'Delete deployment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppDetail;
import { useEffect, useState } from 'react';
import { getDeployments } from '../api';
import { useAuth } from '../AuthContext';
import DeployForm from '../components/DeployForm';
import DeploymentList from '../components/DeploymentList';
import BuildLogs from '../components/BuildLogs';
import ThemeToggle from '../components/ThemeToggle';
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
        setTimeout(() => setActiveSocketRoom(null), 2000);
      }
    };
    socket.on('build-log', handleBuildLog);
    return () => socket.off('build-log', handleBuildLog);
  }, []);

  useEffect(() => {
    const handleDeploymentsChanged = () => fetchDeployments();
    socket.on('deployments-changed', handleDeploymentsChanged);
    return () => socket.off('deployments-changed', handleDeploymentsChanged);
  }, []);

  useEffect(() => {
    const handleChecked = (data) => setLastChecked(new Date(data.timestamp));
    socket.on('reconcile-checked', handleChecked);
    return () => socket.off('reconcile-checked', handleChecked);
  }, []);

  const handleDeployStarted = (socketRoom) => setActiveSocketRoom(socketRoom);

  const totalDeployments = deployments.length;
  const liveDeployments = deployments.filter((d) => d.status === 'live').length;
  const activeDeployments = deployments.filter((d) => ['building', 'deploying', 'queued'].includes(d.status)).length;
  const failedDeployments = deployments.filter((d) => ['failed', 'stopped', 'deleted'].includes(d.status)).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%)] p-6">
        <div className="rounded-[24px] border border-border/70 bg-bg-secondary/80 px-8 py-6 text-text-secondary shadow-2xl">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%)] text-text-primary transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[30px] border border-border/70 bg-bg-secondary/80 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Launchpad</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Mini PaaS Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
                Deploy, monitor, and celebrate every release from a polished workspace built for speed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <span className="max-w-[160px] truncate rounded-full border border-border/70 bg-bg-primary/70 px-3 py-1.5 text-sm text-text-secondary sm:max-w-none">
                {user?.email}
              </span>
              <button
                onClick={logoutUser}
                className="rounded-full border border-border/70 bg-bg-primary/70 px-3 py-1.5 text-sm font-medium text-text-primary transition hover:opacity-80"
              >
                Log out
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-bg-primary/80 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-text-secondary">Total</div>
              <div className="mt-1 text-2xl font-semibold text-text-primary">{totalDeployments}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Live</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-700">{liveDeployments}</div>
            </div>
            <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-700">Active</div>
              <div className="mt-1 text-2xl font-semibold text-amber-700">{activeDeployments}</div>
            </div>
            <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-rose-700">Issues</div>
              <div className="mt-1 text-2xl font-semibold text-rose-700">{failedDeployments}</div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <DeployForm onDeployStarted={handleDeployStarted} />
            <BuildLogs socketRoom={activeSocketRoom} />
          </div>

          <div className="rounded-[30px] border border-border/70 bg-bg-secondary/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Realtime</p>
                <h2 className="text-xl font-semibold text-text-primary">Latest deployments</h2>
              </div>
              <div className="rounded-full border border-border/70 bg-bg-primary/70 px-3 py-1 text-xs text-text-secondary">
                {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'Awaiting sync'}
              </div>
            </div>
            <DeploymentList deployments={deployments} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
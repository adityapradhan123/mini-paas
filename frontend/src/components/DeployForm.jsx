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
      onDeployStarted(res.data.socketRoom);
      setRepoUrl('');
      setAppName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-border/70 bg-bg-secondary/80 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Deploy</p>
          <h2 className="text-xl font-semibold text-text-primary">Ship a new app</h2>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
          Fast launch
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
        <div className="rounded-2xl border border-border/70 bg-bg-primary/70 px-3 py-2">
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            GitHub repo URL
          </label>
          <input
            type="text"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            className="w-full border-0 bg-transparent text-sm text-text-primary outline-none"
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-bg-primary/70 px-3 py-2">
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            App name
          </label>
          <input
            type="text"
            placeholder="my-awesome-app"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            required
            className="w-full border-0 bg-transparent text-sm text-text-primary outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Starting...' : 'Deploy'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}
    </form>
  );
}

export default DeployForm;


import { Link } from 'react-router-dom';

const statusStyles = {
  live: 'bg-emerald-500',
  building: 'bg-amber-500',
  deploying: 'bg-amber-500',
  queued: 'bg-slate-400',
  failed: 'bg-rose-500',
  stopped: 'bg-slate-500',
  deleted: 'bg-slate-700',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`${statusStyles[status] || 'bg-slate-400'} whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white`}
    >
      {status}
    </span>
  );
}

function DeploymentList({ deployments }) {
  if (deployments.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-bg-primary/65 p-6 text-center text-sm text-text-secondary">
        No deployments yet. Deploy your first app above and it will appear here.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {deployments.map((d) => (
        <Link to={'/apps/' + d._id} key={d._id} className="no-underline">
          <div className="rounded-[20px] border border-border/70 bg-bg-primary/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-base font-semibold text-text-primary">{d.appName}</div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  {new Date(d.createdAt).toLocaleString()}
                </div>
                {d.errorMessage && (
                  <div className="mt-1 line-clamp-2 text-xs text-rose-500">{d.errorMessage}</div>
                )}
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                {d.status === 'live' && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('http://localhost:' + d.hostPort, '_blank');
                    }}
                    className="cursor-pointer text-sm font-semibold text-accent transition hover:opacity-80"
                  >
                    Visit →
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default DeploymentList;
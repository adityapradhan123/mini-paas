function DeploymentList({ deployments }) {
  if (deployments.length === 0) {
    return <p>No deployments yet.</p>;
  }

  return (
    <ul>
      {deployments.map((d) => (
        <li key={d._id}>
          <strong>{d.appName}</strong> — {d.status}
          {d.status === 'live' && (
            <>
              {' — '}
              <a href={`http://localhost:${d.hostPort}`} target="_blank" rel="noreferrer">
                Visit
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default DeploymentList;
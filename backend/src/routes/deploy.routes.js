const { listContainers, pingDocker } = require('./services/docker.service');

app.get('/docker/ping', async (req, res) => {
  const result = await pingDocker();
  res.json(result);
});

app.get('/docker/containers', async (req, res) => {
  const containers = await listContainers();
  res.json(containers);
});
const path = require('path');
const { listContainers, pingDocker, buildImage } = require('../services/docker.service');
const { deployApp } = require('./deploy.controller');
const getPort = require('get-port');

const dockerPing = async (req, res) => {
  const result = await pingDocker();
  res.json(result);
};

const dockerContainers = async (req, res) => {
  const containers = await listContainers();
  res.json(containers);
};

const dockerBuildTest = async (req, res) => {
  try {
    const contextPath = path.join(__dirname, '../../../sample-apps/hello-node');
    const result = await buildImage(contextPath, 'hello-node-test');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const dockerRunTest = async (req, res) => {
  try {
    const contextPath = path.join(__dirname, '../../../sample-apps/hello-node');
    const hostPort = await getPort({ port: getPort.makeRange(3000, 3100) });

    const deployment = await deployApp({
      appName: 'hello-node',
      imageName: 'hello-node-test',
      contextPath,
      containerName: `hello-node-container-${Date.now()}`,
      hostPort,
      containerPort: 3000
    });
    res.json({ success: true, deployment, url: `http://localhost:${hostPort}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { dockerPing, dockerContainers, dockerBuildTest, dockerRunTest };
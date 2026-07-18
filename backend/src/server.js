const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');
const getPort = require('get-port');
const { listContainers, pingDocker,buildImage,runContainer } = require('./services/docker.service');
const Deployment = require('./models/Deployment');
const { deployApp } = require('./controllers/deploy.controller');
const { cloneRepo } = require('./services/git.service');
const { detectProjectType, generateDockerfile } = require('./services/detect.service');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes must be here, BEFORE app.listen()
app.get('/docker/ping', async (req, res) => {
  const result = await pingDocker();
  res.json(result);
});

app.get('/docker/containers', async (req, res) => {
  const containers = await listContainers();
  res.json(containers);
});

app.get('/docker/build-test', async (req, res) => {
  try {
    const contextPath = path.join(__dirname, '../../sample-apps/hello-node');
    const result = await buildImage(contextPath, 'hello-node-test');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/docker/run-test', async (req, res) => {
  try {
    const contextPath = path.join(__dirname, '../../sample-apps/hello-node');
    const hostPort = await getPort({ port: getPort.makeRange(3000, 3100) });

    const deployment = await deployApp({
      appName: 'hello-node',
      imageName: 'hello-node-test',
      contextPath,
      containerName: `hello-node-container-${Date.now()}`, // also make name unique
      hostPort,
      containerPort: 3000
    });
    res.json({ success: true, deployment, url: `http://localhost:${hostPort}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/deployments', async (req, res) => {
  const deployments = await Deployment.find().sort({ createdAt: -1 });
  res.json(deployments);
});



app.post('/deploy', async (req, res) => {
  try {
    const { repoUrl, appName } = req.body;

    if (!repoUrl || !appName) {
      return res.status(400).json({ success: false, error: 'repoUrl and appName are required' });
    }

    const contextPath = await cloneRepo(repoUrl, appName);

    const projectType = detectProjectType(contextPath);

    // Map project type -> internal container port
    const portMap = { node: 3000, python: 5000, static: 80, custom: 3000 };
    const containerPort = portMap[projectType] || 3000;

    if (projectType !== 'custom') {
      generateDockerfile(contextPath, projectType);
    }

    const hostPort = await getPort({ port: getPort.makeRange(3000, 3100) });
    const imageName = `${appName.toLowerCase()}-image`;

    const deployment = await deployApp({
      appName,
      imageName,
      contextPath,
      containerName: `${appName}-container-${Date.now()}`,
      hostPort,
      containerPort
    });

    res.json({
      success: true,
      deployment,
      projectType,
      url: `http://localhost:${hostPort}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
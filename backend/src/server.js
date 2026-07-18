const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');
const { listContainers, pingDocker,buildImage,runContainer } = require('./services/docker.service');
const Deployment = require('./models/Deployment');

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
    const appName = 'hello-node';
    const imageName = 'hello-node-test';
    const containerName = 'hello-node-container';
    const hostPort = 3001;
    const containerPort = 3000;

    // Save initial record before starting
    const deployment = await Deployment.create({
      appName,
      imageName,
      containerName,
      hostPort,
      containerPort,
      status: 'deploying'
    });

    const containerId = await runContainer(imageName, containerName, hostPort, containerPort);

    // Update with container ID and mark live
    deployment.containerId = containerId;
    deployment.status = 'live';
    deployment.updatedAt = Date.now();
    await deployment.save();

    res.json({ success: true, deployment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/deployments', async (req, res) => {
  const deployments = await Deployment.find().sort({ createdAt: -1 });
  res.json(deployments);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
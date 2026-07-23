const path = require('path');
const Deployment = require('../models/Deployment');
const { buildImage, runContainer, removeContainer } = require('../services/docker.service');
const { cloneRepo } = require('../services/git.service');
const { detectProjectType, generateDockerfile } = require('../services/detect.service');
const getPort = require('get-port');
const { getIO } = require('../socket');

const deployApp = async ({ appName, imageName, contextPath, containerName, hostPort, containerPort, socketRoom, userId, repoUrl, subdirectory }) => {
  const io = getIO();
  const deployment = await Deployment.create({
    appName,
    imageName,
    containerName,
    hostPort,
    containerPort,
    status: 'building',
    userId,
    repoUrl,
    subdirectory
  });

  const emitLog = (message) => {
    if (io && socketRoom) {
      io.to(socketRoom).emit('build-log', { deploymentId: deployment._id, message });
    }
  };

  try {
    emitLog(`Starting build for ${appName}...`);
    await buildImage(contextPath, imageName, emitLog);
    deployment.status = 'deploying';
    deployment.updatedAt = Date.now();
    await deployment.save();
    emitLog('Build complete. Starting container...');
    const containerId = await runContainer(imageName, containerName, hostPort, containerPort);
    deployment.containerId = containerId;
    deployment.status = 'live';
    deployment.updatedAt = Date.now();
    await deployment.save();
    emitLog(`Deployment live at port ${hostPort}`);
    return deployment;
  } catch (err) {
    deployment.status = 'failed';
    deployment.errorMessage = err.message;
    deployment.updatedAt = Date.now();
    await deployment.save();
    emitLog(`Deployment failed: ${err.message}`);
    throw err;
  }
};

const handleDeployRequest = async (req, res) => {
  try {
    const { repoUrl, appName, subdirectory } = req.body;
    const userId = req.userId;
    if (!repoUrl || !appName) {
      return res.status(400).json({ success: false, error: 'repoUrl and appName are required' });
    }
    const socketRoom = `deploy-${appName}-${Date.now()}`;
    res.json({ success: true, socketRoom });

    const clonedPath = await cloneRepo(repoUrl, appName);
    const contextPath = subdirectory ? path.join(clonedPath, subdirectory) : clonedPath;

    const projectType = detectProjectType(contextPath);
    const portMap = { node: 3000, python: 5000, static: 80, custom: 3000 };
    const containerPort = portMap[projectType] || 3000;
    if (projectType !== 'custom') {
      generateDockerfile(contextPath, projectType);
    }
    const hostPort = await getPort({ port: getPort.makeRange(3000, 3100) });
    const imageName = `${appName.toLowerCase()}-image`;
    await deployApp({
      appName,
      imageName,
      contextPath,
      containerName: `${appName}-container-${Date.now()}`,
      hostPort,
      containerPort,
      socketRoom,
      userId,
      repoUrl,
      subdirectory
    });
  } catch (err) {
    console.error('Deploy failed:', err.message);
  }
};

const redeployApp = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Deployment.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Deployment not found' });
    }

    if (existing.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (!existing.repoUrl) {
      return res.status(400).json({ success: false, error: 'Original repo URL not available for redeploy' });
    }

    const socketRoom = `deploy-${existing.appName}-${Date.now()}`;
    res.json({ success: true, socketRoom });

    const oldContainerId = existing.containerId;

    const clonedPath = await cloneRepo(existing.repoUrl, existing.appName);
    const contextPath = existing.subdirectory ? path.join(clonedPath, existing.subdirectory) : clonedPath;

    const projectType = detectProjectType(contextPath);
    const portMap = { node: 3000, python: 5000, static: 80, custom: 3000 };
    const containerPort = portMap[projectType] || 3000;

    if (projectType !== 'custom') {
      generateDockerfile(contextPath, projectType);
    }

    const hostPort = await getPort({ port: getPort.makeRange(3000, 3100) });
    const imageName = `${existing.appName.toLowerCase()}-image`;

    const newDeployment = await deployApp({
      appName: existing.appName,
      imageName,
      contextPath,
      containerName: `${existing.appName}-container-${Date.now()}`,
      hostPort,
      containerPort,
      socketRoom,
      userId: req.userId,
      repoUrl: existing.repoUrl,
      subdirectory: existing.subdirectory
    });

    if (oldContainerId && newDeployment.status === 'live') {
      await removeContainer(oldContainerId);
    }

    existing.status = 'deleted';
    existing.errorMessage = 'Replaced by redeploy';
    await existing.save();
  } catch (err) {
    console.error('Redeploy failed:', err.message);
  }
};

module.exports = { deployApp, handleDeployRequest, redeployApp };
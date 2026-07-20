const Deployment = require('../models/Deployment');
const { buildImage, runContainer } = require('../services/docker.service');
const { cloneRepo } = require('../services/git.service');
const { detectProjectType, generateDockerfile } = require('../services/detect.service');
const getPort = require('get-port');
const { getIO } = require('../socket');

const deployApp = async ({ appName, imageName, contextPath, containerName, hostPort, containerPort, socketRoom, userId }) => {
  const io = getIO();
  const deployment = await Deployment.create({
    appName,
    imageName,
    containerName,
    hostPort,
    containerPort,
    status: 'building',
    userId
  });
  // ...rest stays the same

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
    const { repoUrl, appName } = req.body;
    const userId = req.userId; 

    if (!repoUrl || !appName) {
      return res.status(400).json({ success: false, error: 'repoUrl and appName are required' });
    }

    const socketRoom = `deploy-${appName}-${Date.now()}`;

    res.json({ success: true, socketRoom });

    const contextPath = await cloneRepo(repoUrl, appName);
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
      userId
    });
  } catch (err) {
    console.error('Deploy failed:', err.message);
  }
};

module.exports = { deployApp, handleDeployRequest };
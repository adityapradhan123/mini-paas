const Deployment = require('../models/Deployment');
const { buildImage, runContainer } = require('../services/docker.service');
const { cloneRepo } = require('../services/git.service');
const { detectProjectType, generateDockerfile } = require('../services/detect.service');
const getPort = require('get-port');

const deployApp = async ({ appName, imageName, contextPath, containerName, hostPort, containerPort }) => {
  // Create the record immediately so we always have a trace of the attempt
  const deployment = await Deployment.create({
    appName,
    imageName,
    containerName,
    hostPort,
    containerPort,
    status: 'building'
  });

  try {
    await buildImage(contextPath, imageName);

    deployment.status = 'deploying';
    deployment.updatedAt = Date.now();
    await deployment.save();

    const containerId = await runContainer(imageName, containerName, hostPort, containerPort);

    deployment.containerId = containerId;
    deployment.status = 'live';
    deployment.updatedAt = Date.now();
    await deployment.save();

    return deployment;
  } catch (err) {
    // This is the important part — failures are now recorded, not silent
    deployment.status = 'failed';
    deployment.errorMessage = err.message;
    deployment.updatedAt = Date.now();
    await deployment.save();

    throw err; // still let the route handler know it failed
  }
};


const handleDeployRequest = async (req, res) => {
  try {
    const { repoUrl, appName } = req.body;

    if (!repoUrl || !appName) {
      return res.status(400).json({ success: false, error: 'repoUrl and appName are required' });
    }

    const contextPath = await cloneRepo(repoUrl, appName);
    const projectType = detectProjectType(contextPath);

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

    res.json({ success: true, deployment, projectType, url: `http://localhost:${hostPort}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { deployApp, handleDeployRequest };

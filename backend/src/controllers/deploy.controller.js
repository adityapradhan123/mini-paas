const Deployment = require('../models/Deployment');
const { buildImage, runContainer } = require('../services/docker.service');

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

module.exports = { deployApp };
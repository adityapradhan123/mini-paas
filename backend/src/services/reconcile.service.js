const Deployment = require('../models/Deployment');
const { getContainerStatus } = require('./docker.service');
const { getIO } = require('../socket');

const reconcileDeployments = async () => {
  const activeDeployments = await Deployment.find({
    status: { $in: ['live', 'stopped'] },
    userId: { $exists: true }
  });

  let anyChanged = false;

  for (const deployment of activeDeployments) {
    if (!deployment.containerId) continue;

    const containerStatus = await getContainerStatus(deployment.containerId);

    if (containerStatus === 'not_found' && deployment.status !== 'deleted') {
      deployment.status = 'deleted';
      deployment.errorMessage = 'Container was deleted outside the platform';
      await deployment.save();
      anyChanged = true;
    } else if (containerStatus === 'stopped' && deployment.status !== 'stopped') {
      deployment.status = 'stopped';
      deployment.errorMessage = 'Container was stopped outside the platform';
      await deployment.save();
      anyChanged = true;
    } else if (containerStatus === 'running' && deployment.status !== 'live') {
      deployment.status = 'live';
      deployment.errorMessage = null;
      await deployment.save();
      anyChanged = true;
    }
  }

  if (anyChanged) {
    try {
      getIO().emit('deployments-changed');
    } catch (err) {
      // ignore
    }
  }

  try {
    getIO().emit('reconcile-checked', { timestamp: new Date() });
  } catch (err) {
    // ignore
  }
};

module.exports = { reconcileDeployments };
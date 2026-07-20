const Deployment = require('../models/Deployment');
const { removeContainer } = require('../services/docker.service');

const listDeployments = async (req, res) => {
  const deployments = await Deployment.find({
    status: { $ne: 'deleted' },
    userId: req.userId
  }).sort({ createdAt: -1 });
  res.json(deployments);
};

const deleteDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await Deployment.findById(id);

    if (!deployment) {
      return res.status(404).json({ success: false, error: 'Deployment not found' });
    }

    if (deployment.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this deployment' });
    }

    if (deployment.containerId) {
      await removeContainer(deployment.containerId);
    }

    deployment.status = 'deleted';
    deployment.updatedAt = Date.now();
    await deployment.save();

    res.json({ success: true, message: 'Deployment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { listDeployments, deleteDeployment };
const Deployment = require('../models/Deployment');

const listDeployments = async (req, res) => {
  const deployments = await Deployment.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
  res.json(deployments);
};

module.exports = { listDeployments };
const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  imageName: { type: String, required: true },
  containerId: { type: String },
  containerName: { type: String },
  hostPort: { type: Number },
  containerPort: { type: Number },
  status: {
    type: String,
    enum: ['queued', 'building', 'deploying', 'live', 'failed', 'stopped'],
    default: 'queued'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deployment', deploymentSchema);
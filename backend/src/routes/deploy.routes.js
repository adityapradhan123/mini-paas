
const express = require('express');
const router = express.Router();
const { handleDeployRequest } = require('../controllers/deploy.controller');
const { listDeployments,deleteDeployment } = require('../controllers/deployment.controller');

router.post('/deploy', handleDeployRequest);
router.get('/deployments', listDeployments);
router.delete('/deployments/:id', deleteDeployment);

module.exports = router;
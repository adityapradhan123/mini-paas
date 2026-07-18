
const express = require('express');
const router = express.Router();
const { handleDeployRequest } = require('../controllers/deploy.controller');
const { listDeployments } = require('../controllers/deployment.controller');

router.post('/deploy', handleDeployRequest);
router.get('/deployments', listDeployments);

module.exports = router;
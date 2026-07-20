const express = require('express');
const router = express.Router();
const { handleDeployRequest } = require('../controllers/deploy.controller');
const { listDeployments, deleteDeployment } = require('../controllers/deployment.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/deploy', requireAuth, handleDeployRequest);
router.get('/deployments', requireAuth, listDeployments);
router.delete('/deployments/:id', requireAuth, deleteDeployment);

module.exports = router;
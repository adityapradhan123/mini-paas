const express = require('express');
const router = express.Router();
const { dockerPing, dockerContainers, dockerBuildTest, dockerRunTest } = require('../controllers/docker.controller');

router.get('/ping', dockerPing);
router.get('/containers', dockerContainers);
router.get('/build-test', dockerBuildTest);
router.get('/run-test', dockerRunTest);

module.exports = router;
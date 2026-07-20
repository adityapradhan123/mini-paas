const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const dockerRoutes = require('./routes/docker.routes');
const deployRoutes = require('./routes/deploy.routes');
const { reconcileDeployments } = require('./services/reconcile.service');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const server = http.createServer(app);
initSocket(server);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/docker', dockerRoutes);
app.use('/', deployRoutes);
app.use('/auth', authRoutes);



// Check every 15 seconds whether "live" deployments are actually still running
setInterval(() => {
  reconcileDeployments().catch((err) => console.error('Reconciliation error:', err.message));
}, 15000);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
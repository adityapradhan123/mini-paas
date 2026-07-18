const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const dockerRoutes = require('./routes/docker.routes');
const deployRoutes = require('./routes/deploy.routes');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/docker', dockerRoutes);
app.use('/', deployRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
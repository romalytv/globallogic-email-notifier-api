require('dotenv').config();

const express = require('express');
const apiRoutes = require('./routes/index');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { initDatabase } = require('./routes/db/init');
const { startScanner } = require('./routes/jobs/scanner');


const app = express();

app.use(express.json());
app.use(express.static('public'));

app.use('/api', apiRoutes);
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is running' });
});

app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error('Unresolved error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('Server initializing...');
        await initDatabase();
        startScanner();
        app.listen(PORT, () => {
            console.log(`Server successfully started on port ${PORT}`);
        });
    } catch (error) {
        console.error('Fatal error starting:', error);
        process.exit(1);
    }
}

startServer();
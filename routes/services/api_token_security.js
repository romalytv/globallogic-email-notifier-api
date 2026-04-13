const authMiddleware = (req, res, next) => {
    const clientKey = req.header('X-API-KEY');

    if (!clientKey) {
        return next();
    }

    if (clientKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Invalid API Key' });
    }

    next();
};
module.exports = authMiddleware;
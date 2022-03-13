const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ api: 'Convertion', paths: [`GET-${req.originalUrl}/swagger`, `GET-${req.originalUrl}/schema`] })
});
router.get('/swagger', (req, res) => {
    res.json({ api: 'Swagger Convertion', paths: [`POST-${req.originalUrl}/v2tov3`, `POST-${req.originalUrl}/v3tov2`, `GET-${req.originalUrl}/v2`, `GET-${req.originalUrl}/v3`] })
});
router.get('/schema', (req, res) => {
    //fill this later
    res.json({ api: 'Schema Convertion', paths: [`GET-${req.originalUrl}/schema`] })
});

module.exports = router;
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Convertion API')
});

module.exports = router;
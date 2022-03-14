const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get(["/", "/swagger"], (req, res) => {
  res.sendFile(path.join(__dirname, "../swagger.json"));
});

module.exports = router;

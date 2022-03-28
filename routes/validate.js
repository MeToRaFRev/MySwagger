const express = require("express");
const Ajv = require("ajv");
const router = express.Router();
const ajv = new Ajv();
router.get("/", (req, res) => {
  return res.json({
    api: "Validation",
    paths: [
      `GET-${req.originalUrl}schema`,
      `POST-${req.originalUrl}schema`,
      `GET-${req.originalUrl}swagger`,
    ],
  });
});

router.get("/schema", (req, res) => {
  return res.json({
    api: "Validate Schema",
    paths: [`POST-${req.originalUrl}toInput`, `POST-${req.originalUrl}Harden`],
  });
});
router.post("/schema", (req, res) => {
  const body = req.body;
  if (body.input && body.schema) {
    if (!body.schema.$schema) res.json({ error: "invalid schema" });
    if (typeof body.input !== "object" || body.input.length < 3)
      res.json({ error: "invalid input" });
    try {
      const input = body.input;
      const schema = body.schema;
      const validate = ajv.compile(schema);
      validate(input)
        .then((result) => {
          return res.json(result);
        })
        .catch(() => {
          return res.status(500).json({
            error: "error in validation",
            info: "couldnt validate schema or input",
          });
        });
    } catch (e) {
      return res.json({ error: e.message });
    }
  }
  return res.status(400).json({ error: "input or schema not found" });
});

router.get("/swagger", (req, res) => {
  return res.json({
    api: "Validate Schema",
    paths: [
      `POST-${req.originalUrl}/schema`,
      `POST-${req.originalUrl}/v3tov2`,
      `GET-${req.originalUrl}/v2`,
      `GET-${req.originalUrl}/v3`,
    ],
  });
});

module.exports = router;

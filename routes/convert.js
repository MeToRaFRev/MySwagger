const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    api: "Convertion",
    paths: [`GET-${req.originalUrl}/swagger`, `GET-${req.originalUrl}/schema`],
  });
});
router.get("/swagger", (req, res) => {
  res.json({
    api: "Swagger Convertion",
    paths: [
      `POST-${req.originalUrl}/v2tov3`,
      `POST-${req.originalUrl}/v3tov2`,
      `GET-${req.originalUrl}/v2`,
      `GET-${req.originalUrl}/v3`,
    ],
  });
});
router.get("/swagger/:type", (req, res) => {
  const tmpFile = "/tmp/swagger.json";
  switch (req.params.type) {
    case "v2tov3":
      fs.writeFile(tmpFile, JSON.stringify(req.body), function (err) {
        if (err)
          return res.json({
            error: "failed to use swagger",
            info: "couldnt write file",
          });
      });
      let options = { syntax: "json" };
      if (req.query.format) {
        if (req.query.format == "yaml") {
          options = { syntax: "yaml" };
        }
      }
      Converter.convert(
        {
          from: "swagger_2",
          to: "openapi_3",
          source: tmpFile,
        },
        function (err, converted) {
          if (err) {
            res.status(404).send(err.stringify());
          }
          res.send(converted.stringify(options));
        }
      );
      break;
    case "v3tov2":
      break;
    default:
      res.json({ error: "Invalid type", info: "Valid types: v2tov3, v3tov2" });
  }
});

router.get("/schema", (req, res) => {
  //fill this later
  res.json({
    api: "Schema Convertion",
    paths: [`GET-${req.originalUrl}/schema`],
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const fs = require("fs");
const Converter = require("api-spec-converter");

router.get("/", (req, res) => {
  return res.json({
    api: "Convertion",
    paths: [`GET-${req.originalUrl}/swagger`, `GET-${req.originalUrl}/schema`],
  });
});
router.get("/swagger", (req, res) => {
  return res.json({
    api: "Swagger Convertion",
    paths: [
      `POST-${req.originalUrl}/v2tov3`,
      `POST-${req.originalUrl}/v3tov2`,
      `GET-${req.originalUrl}/v2`,
      `GET-${req.originalUrl}/v3`,
    ],
  });
});
router.post("/swagger/:type", async (req, res) => {
  const tmpFile = "/tmp/swagger.json";
  let options = { syntax: "json" };
  let input = "";
  let output = "";
  if (req.params.type === "v2tov3" || "v3tov2") {
    if (req.params.type === "v2tov3") {
      input = "swagger_2";
      output = "openapi_3";
    } else if (req.params.type === "v3tov2") {
      input = "openapi_3";
      output = "swagger_2";
    }
    fs.writeFile(tmpFile, JSON.stringify(req.body), function (err) {
      if (err)
        return res.json({
          error: "failed to use swagger",
          info: "couldnt write file",
        });
    });
    if (req.query.format) {
      if (req.query.format == "yaml") {
        options = { syntax: "yaml" };
      }
    }
    Converter.convert(
      {
        from: input,
        to: output,
        source: tmpFile,
      },
      function (err, converted) {
        if (err) {
          return res.status(400).send({
            error: "failed to convert",
            info: "check versions of swagger or its validity",
          });
        }
        return res.json(JSON.parse(converted.stringify(options)));
      }
    );
  }
});

router.get("/swagger/v2", (req, res) => {
  return res.json({
    api: "Swagger v2 Convertion",
    paths: [`POST-${req.originalUrl}/toJSV`],
  });
});

router.post("/swagger/v2/toJSV", (req, res) => {
  if (!req.body.swagger) {
    return res.json({
      error: "input is not swagger v2",
      info: "check your body",
    });
  }
  if (!req.header("MySwagger-Path")) {
    return res.json({
      error: "no path provided",
      info: "check your header {MySwagger-Path}",
    });
  }
  if (!req.header("MySwagger-Method")) {
    return res.json({
      error: "no method provided",
      info: "check your header {MySwagger-Method}",
    });
  }
  if (!req.header("MySwagger-Direction")) {
    return res.json({
      error: "no direction provided",
      info: "check your header {MySwagger-Direction}",
    });
  }
  const path = req.header("MySwagger-Path");
  const method = req.header("MySwagger-Method");
  const direction = req.header("MySwagger-Direction");
  if (!req.body.paths[path]) {
    return res.json({
      error: "path not found",
      info: `check your swagger if it has this ${path}`,
    });
  }
  if (!req.body.paths[path][method]) {
    return res.json({
      error: "method not found",
      info: `check your swagger if in ${path} it has this ${method}`,
    });
  }
  if (!direction === "request" || "response") {
    return res.json({
      error: "direction is not valid",
      info: `{MySwagger-Direction} can only be request or response`,
    });
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

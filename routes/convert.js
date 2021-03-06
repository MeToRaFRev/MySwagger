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
        return res.status(500).json({
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
    paths: [`POST-${req.originalUrl}/toJSV`, `POST-${req.originalUrl}/Harden`],
  });
});

const findAllRef = (schema, body, definitions) => {
  Object.entries(schema).forEach(([key, value]) => {
    if (key === "$ref") {
      const ref = value.split("#/definitions/")[1];
      definitions.push(ref);
      findAllRef(body.definitions[ref], body, definitions);
    } else if (typeof value === "object") {
      findAllRef(value, body, definitions);
    }
  });
  return definitions;
};

const findDefinitions = (schema, body, definitions) => {
  definitions = findAllRef(schema, body, definitions);
  if (definitions.length > 0) {
    return definitions;
  }
  return { error: "information", info: "no definitions found" };
};

const reformatSchema = (schema, body) => {
  newSchema = { $schema: "http://json-schema.org/draft-04/schema#" };
  if (Object.keys(schema).length === 0) {
    return {
      error: "OK schema not found",
      info: "schema is empty",
    };
  }
  Object.entries(schema).forEach(([key, value]) => {
    newSchema[key] = value;
  });
  const arr = [];
  const definitions = findDefinitions(schema, body, arr);
  if (!definitions.error) {
    if (definitions.length > 0) {
      newSchema["definitions"] = {};
      definitions.forEach((definition) => {
        newSchema.definitions[definition] = body.definitions[definition];
      });
    }
  } else {
    console.log(definitions);
  }
  return newSchema;
};

const extractInfo = (parameter, data, type) => {
  if (type !== "schema") {
    data[type][parameter.name] = {};
    Object.entries(parameter).forEach(([key, value]) => {
      if (!(key === "in" || key === "name"))
        data[type][parameter.name][key] = value;
    });
  } else {
    data[type]["properties"][parameter.name] = {};
    Object.entries(parameter).forEach(([key, value]) => {
      if (!(key === "in" || key === "description" || key === "name"))
        data[type]["properties"][parameter.name][key] = value;
    });
  }
};

const HandleSchema = (body, path, method, direction) => {
  let request = { headers: {}, querys: {}, paths: {}, schema: {} };
  return new Promise((resolve, reject) => {
    switch (direction) {
      case "request":
        const parameters = body.paths[path][method].parameters;
        if (parameters) {
          parameters.map((parameter) => {
            switch (parameter.in) {
              case "header":
                extractInfo(parameter, request, "headers");
                break;
              case "query":
                extractInfo(parameter, request, "querys");
                break;
              case "path":
                extractInfo(parameter, request, "paths");
                break;
              case "formData":
                request.schema.$schema =
                  "http://json-schema.org/draft-04/schema#";
                request.schema.required = request.schema.required || [];
                request.schema.additionalProperties = false;
                request.schema.type = "object";
                request.schema.properties = request.schema.properties || {};
                extractInfo(parameter, request, "schema");
                break;
              case "body":
                request.schema = reformatSchema(parameter.schema, body);
                break;
            }
          });
          return resolve(request);
        } else {
          reject({
            error: "no schema found",
            info: "no parameters found in swagger",
          });
        }
      case "response":
        const responses = body.paths[path][method].responses;
        Object.keys(responses).forEach((key) => {
          if (Number(key) >= 200 && Number(key) < 300) {
            const responseSchema = responses[key].schema;
            const reformattedSchema = reformatSchema(responseSchema, body);
            return resolve(reformattedSchema);
          }
        });
        return reject({
          error: "OK schema not found",
          info: "schema is empty",
        });
    }
  });
};

const NullIt = (schema) => {
  Object.entries(schema).forEach(([key, value]) => {
    if (key === "type") {
      schema[key] = [value, "null"];
    } else if (typeof value === "object") {
      NullIt(value);
    }
  });
  return schema;
};

router.post("/swagger/v2/toJSV", (req, res) => {
  if (!req.body.swagger) {
    return res.status(400).json({
      error: "input is not swagger v2",
      info: "check your body",
    });
  }
  if (!req.header("MySwagger-Path")) {
    return res.status(400).json({
      error: "no path provided",
      info: "check your header {MySwagger-Path}",
    });
  }
  if (!req.header("MySwagger-Method")) {
    return res.status(400).json({
      error: "no method provided",
      info: "check your header {MySwagger-Method}",
    });
  }
  if (!req.header("MySwagger-Direction")) {
    return res.status(400).json({
      error: "no direction provided",
      info: "check your header {MySwagger-Direction}",
    });
  }
  const body = req.body;
  const path = req.header("MySwagger-Path");
  const method = req.header("MySwagger-Method").toLowerCase();
  const direction = req.header("MySwagger-Direction").toLowerCase();
  if (!req.body.paths[path]) {
    return res.status(400).json({
      error: "path not found",
      info: `check your swagger if it has this ${path}`,
    });
  }
  if (!req.body.paths[path][method]) {
    return res.status(400).json({
      error: "method not found",
      info: `check your swagger if PATH:${path} has METHOD:${method}`,
    });
  }
  if (!(direction === "request" || "response")) {
    return res.status(400).json({
      error: "direction is not valid",
      info: `${MySwagger - Direction} can only be request or response`,
    });
  }
  req.query?.nullify === "true" ? (nullify = true) : (nullify = false);
  req.query?.harden === "true" ? (harden = true) : (harden = false);
  if (harden) {
    body = Harden(body);
  }
  HandleSchema(body, path, method, direction)
    .then((data) => {
      if (nullify) {
        if (data.schema) {
          data.schema = NullIt(data.schema);
        } else {
          data = NullIt(data);
        }
      }
      return res.json(data);
    })
    .catch((err) => {
      return res.status(400).json(err);
    });
});

const Harden = (swagger, newSwagger) => {
  newSwagger = newSwagger || {};
  Object.entries(swagger).forEach(([key, value]) => {
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        newSwagger[key] = value;
        return;
      }
      switch (key) {
        case "properties":
          newSwagger["additionalProperties"] = false;
          break;
        case "items":
          newSwagger["additionalItems"] = false;
      }
      newSwagger[key] = Harden(value);
    } else {
      if (key === "addiitonalProperties" || key === "additionalItems") {
        return;
      }
      newSwagger[key] = value;
    }
  });
  return newSwagger;
};

router.post("/swagger/v2/Harden", (req, res) => {
  const body = req.body;
  if (req.body.swagger) {
    newSwagger = Harden(body);
    return res.json(newSwagger);
  } else {
    res.status(400).json({ error: "body is not swagger v2" });
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

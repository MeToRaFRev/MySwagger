const express = require("express");
const fs = require("fs");
const https = require("https");
require("dotenv/config");
// Constants
const PORT = 8080;
const HOST = "0.0.0.0";
//Container SSL
const key = fs.readFileSync(process.env.key_linux);
const cert = fs.readFileSync(process.env.cert_linux);
//Windows SSL
// const key = fs.readFileSync(process.env.key_windows);
// const cert = fs.readFileSync(process.env.cert_windows);

const ssl = { key: key, cert: cert };
// App
const app = express();
app.use(express.json());
app.set("json spaces", 2);

const swagger = require("./routes/swagger");
const convert = require("./routes/convert");
const validate = require("./routes/validate");

app.use("/", swagger);
app.use("/convert", convert);
app.use("/validate", validate);

const server = https.createServer(ssl, app);
server.listen(PORT, HOST);
console.log(`Running on https://${HOST}:${PORT}`);

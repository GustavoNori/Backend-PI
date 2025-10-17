require('dotenv').config();
require('reflect-metadata');
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/", require("./routes/testRoute"));
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/post", require("./routes/postRoute"));
app.use("/api/ratings", require("./routes/ratingRoute"));

module.exports = app; // exporta apenas o app, sem iniciar o servidor

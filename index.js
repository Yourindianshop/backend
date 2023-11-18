const express = require("express");
const app = express();
const cors = require("cors");
const user = require("./router/user");
const Buser = require("./router/Buser");
const admin = require("./router/Admin");
const Manager = require("./router/Manager");
const envvar = require("dotenv");
const schedule = require("node-cron");
const { AtInterval, mid } = require("./router/Aws");
const path = require("path");
// const pool = require("./router/pool");
// const mysql = require("mysql");
const shipment = require("./router/Shipment"); // Import the shipment router
// const sm = require('./router/Mail')
envvar.config();

// const connection = mysql.createConnection({
//   host: "localhost", // host for connection
//   port: 3306, // default port for mysql is 3306
//   database: "yourindianshop", // database from which we want to connect out node application
//   user: "root", // username of the mysql connection
//   password: "Rjt@ms70#2204", // password of the mysql connection
// });

// connection.connect(function (err) {
//   if (err) {
//     console.log("error occurred while connecting");
//     console.log(err);
//   } else {
//     console.log("connection created with Mysql successfully");
//   }
// });

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.static(path.join(__dirname, "build")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.use(express.static(path.join(__dirname, "build2")));
app.get("/manager", (req, res) => {
  res.sendFile(path.join(__dirname, "build2", "index2.html"));
});
app.use(express.static(path.join(__dirname, "build3")));
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "build3", "index3.html"));
});
app.use(express.static(path.join(__dirname, "build")));

app.use(mid);
app.use(express.json());
// app.get('/', (req, res) => {
//     res.send("Welcome to the site...");
// });
app.use(user);
app.use(admin);
app.use(Manager);
app.use(Buser);
app.use(shipment); // Use the shipment router

const port = process.env.PORT || 4000;
schedule.schedule("0 0 0 * * * *", AtInterval);
// setInterval(AtInterval,1000)

app.listen(port, () => {
  console.log("listening on port: " + port);
});
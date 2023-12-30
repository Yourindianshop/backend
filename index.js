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
const Paypal = require("./router/paypal");
const Razorpay = require('./router/razorpay');
// const sm = require('./router/Mail')
envvar.config();



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

app.use(Paypal);
app.use(Razorpay);
app.use(mid);
app.use(express.json());
app.use(user);
app.use(admin);
app.use(Manager);
app.use(Buser);
app.use(shipment); // Use the shipment router

const port = process.env.PORT || 4000;
schedule.schedule("0 0 0 * * * *", AtInterval);

app.listen(port, () => {
  console.log("listening on port: " + port);
});
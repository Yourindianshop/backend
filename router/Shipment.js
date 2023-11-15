const express = require("express");
const router = express.Router();
const pool = require("./pool"); // Assuming this is the correct path to your pool module

// Create a new Shipping record
router.post("/createShipping", (req, res) => {
  const { name, price, perkmprice, perkgprice } = req.body;

  const insertShippingQuery = `
    INSERT INTO Shipping (name, price, perkmprice, perkgprice)
    VALUES (?, ?, ?, ?)
  `;

  pool.query(
    insertShippingQuery,
    [name, price, perkmprice, perkgprice],
    (err, results) => {
      if (err) {
        console.error("Error creating Shipping record:", err);
        res.status(500).json({
          success: false,
          message: "Error creating Shipping record",
        });
      } else {
        console.log("Shipping record created successfully.");
        res.status(201).json({
          success: true,
          message: "Shipping record created successfully",
        });
      }
    }
  );
});

// Get all shipping methods
router.get("/getAllShippers", (req, res) => {  
  const selectAllShippingQuery = "SELECT * FROM Shipping";
  pool.query(selectAllShippingQuery, (err, results) => {
    if (err) {
      console.error("Error fetching shipping methods:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching shipping methods",
      });
    } else {
      console.log("Shipping methods fetched successfully.");
      res.status(200).json({
        success: true,
        shippings: results,
      });
    }
  });
});

// Get a single shipment
router.get("/getShipment/:id", (req, res) => {
  const shipmentId = req.params.id;

  const selectSingleShippingQuery = "SELECT * FROM Shipping WHERE id = ?";

  pool.query(selectSingleShippingQuery, [shipmentId], (err, results) => {
    if (err) {
      console.error("Error fetching shipment:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching shipment",
      });
    } else if (results.length === 0) {
      res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    } else {
      const shipment = results[0];
      console.log("Shipment fetched successfully.");
      res.status(200).json({
        success: true,
        shipment,
      });
    }
  });
});

// Update a Shipping -- Admin
router.put("/updateShipping/:id", (req, res) => {
  const shippingId = req.params.id;
  const { name, price, perkmprice, perkgprice } = req.body;

  const updateShippingQuery = `
    UPDATE Shipping
    SET name = ?, price = ?, perkmprice = ?, perkgprice = ?
    WHERE id = ?
  `;

  pool.query(
    updateShippingQuery,
    [name, price, perkmprice, perkgprice, shippingId],
    (err, results) => {
      if (err) {
        console.error("Error updating Shipping record:", err);
        res.status(500).json({
          success: false,
          message: "Error updating Shipping record",
        });
      } else if (results.affectedRows === 0) {
        res.status(404).json({
          success: false,
          message: "Shipping record not found",
        });
      } else {
        console.log("Shipping record updated successfully.");
        res.status(200).json({
          success: true,
          message: "Shipping record updated successfully",
        });
      }
    }
  );
});

// Delete a Shipping -- Admin
router.delete("/deleteShipping/:id", (req, res) => {
  const shippingId = req.params.id;

  const deleteShippingQuery = "DELETE FROM Shipping WHERE id = ?";

  pool.query(deleteShippingQuery, [shippingId], (err, results) => {
    if (err) {
      console.error("Error deleting Shipping record:", err);
      res.status(500).json({
        success: false,
        message: "Error deleting Shipping record",
      });
    } else if (results.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Shipping record not found",
      });
    } else {
      console.log("Shipping record deleted successfully.");
      res.status(200).json({
        success: true,
        message: "Shipping record deleted successfully",
      });
    }
  });
});

module.exports = router;
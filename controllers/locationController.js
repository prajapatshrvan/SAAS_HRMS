const mongoose = require("mongoose");

module.exports.country = async (req, res) => {
  try {
    const db = mongoose.connection;
    if (db.readyState !== 1) {
      throw new Error("MongoDB connection not established");
    }

    const data = await db.collection("countries").find({ id: 101 }).toArray();

    if (data) {
      res.status(200).send(data);
    } else {
      res.status(404).send("No data found");
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.city = async (req, res) => {
  try {
    const db = mongoose.connection;

    if (db.readyState !== 1) {
      throw new Error("MongoDB connection not established");
    }
    let stateId = req.params.id;

    if (stateId) {
      stateId = +stateId;
    }

    if (isNaN(stateId)) {
      res.status(404).send("invalid state");
      return;
    }
    // Fetch data from the "cities" collection
    let data = await db
      .collection("cities")
      .find({ state_id: stateId })
      .sort({ name: 1 })
      .toArray();

    res.send(data);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.state = async (req, res) => {
  try {
    const db = mongoose.connection;
    if (db.readyState !== 1) {
      throw new Error("MongoDB connection not established");
    }

    let countryId = req.params.id;

    if (countryId) {
      countryId = +countryId;
    }

    if (isNaN(countryId)) {
      res.status(404).send("invalid country");
      return;
    }
    // Fetch data from the "states" collection
    let data = await db
      .collection("states")
      .find({ country_id: countryId })
      .sort({ name: 1 })
      .toArray();
    res.send(data);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.state_name = async (req, res) => {
  try {
    const db = mongoose.connection;
    if (db.readyState !== 1) {
      throw new Error("MongoDB connection not established");
    }
    let countryName = req.params.country_name;
    // return console.log(countryName);

    // if (countryName) {
    //   countryName = +countryName;
    // }

    // if (isNaN(countryName)) {
    //   res.status(404).send("invalid country");
    //   return;
    // }
    // Fetch data from the "states" collection
    let data = await db
      .collection("states")
      .find({ country_name: countryName })
      .sort({ name: 1 })
      .toArray();
    res.send(data);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Internal Server Error");
  }
};

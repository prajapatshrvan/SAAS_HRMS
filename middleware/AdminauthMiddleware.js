const Adminauth = require("../models/Adminauth.model");

const auth = async (req, res, next) => {
  const username = req.session.username;
  const password = req.session.password;

  if (!username || !password) {
    return res.redirect("/login");
  }
  try {
    const user = await Adminauth.findOne({ username: username });
    if (!user) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    console.error("Error during authentication:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { auth };

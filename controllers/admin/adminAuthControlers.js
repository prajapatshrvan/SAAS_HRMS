const Adminauth = require("../../models/Adminauth.model");
const Resources = require("../../models/Resources.model");
const bcrypt = require("bcrypt");

module.exports.login = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log(error);
  }
};

module.exports.dashboard = async (req, res) => {
  try {
    return res.render("index");
  } catch (error) {
    console.log(error);
  }
};

// module.exports.AdminDashboard = async (req, res) => {
//   try {
//     return res.render("dashboard");
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports.Adminlogin = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
      return res.status(400).send("Invalid username or password");
    }

    const user = await Adminauth.findOne({ username: username });

    if (!user) {
      return res.status(401).send("Account not found");
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).send("Invalid Password");
    }

    req.session.username = user.username;
    req.session.password = user.password;

    if (req.session.path) {
      return res.status(200).send(req.session.path);
    } else {
      return res.status(200).send("success");
    }
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.logout = async (req, res) => {
  try {
    req.session.destroy();
    return res.send("success");
  } catch (error) {
    return res.send("Something went wrong please try again later");
  }
};

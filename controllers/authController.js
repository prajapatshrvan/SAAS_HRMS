const User = require("../models/User.model.js");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Role = require("../models/Role.model.js");
const transporter = require("../config/email_config.js");
const { authLabels } = require("../Label.js");
const Otp = require("../models/Otp.model.js");
const randomstring = require("randomstring");
const {
  getResourcesForUser
} = require("../utility/permit_utilities/user_permits_utility.js");
const Employee = require("../models/Employee.model.js");

module.exports.register = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      throw new Error("Request body is not defined");
    }
    const exist = await User.findOne({
      email: req.body.email
    });
    if (exist) {
      return res.json({
        message: authLabels.already_user_exist
      });
    } else {
      const {
        firstname,
        lastname,
        mobile_number,
        email,
        password,
        city,
        role_name
      } = req.body;

      if (!firstname) {
        return res.status(400).json({ message: "Please fill firstname" });
      } else if (lastname) {
        return res.status(400).json({ message: "Please fill lastname" });
      } else if (mobile_number) {
        return res.status(400).json({ message: "Please fill mobile number" });
      } else if (!password) {
        return res.status(400).json({ message: "Please fill password" });
      } else if (!role_name) {
        return res.status(400).json({ message: "Please fill role name" });
      }

      const baseUid = lastname.slice(0, 3) + firstname.slice(0, 3);
      let userId = baseUid;
      let numCount = 1;
      let existingUser;
      do {
        existingUser = await User.findOne({ userId });
        if (existingUser) {
          userId = baseUid + numCount;
          numCount++;
        }
      } while (existingUser);

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const user = new User({
        userId,
        firstname,
        lastname,
        mobile_number,
        email,
        password: hashPassword,
        city,
        role_name
      });

      await user.save();
      console.info(`Generate user success ${userId}`);
      return res.status(201).json({
        msg: authLabels.register_user_success
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

module.exports.employeeLogin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (email && password) {
      const user = await Employee.findOne({
        company_email: email
      });
      // status: { $in: ["completed", "InNoticePeriod"] }
      if (user) {
        const comparePassword = await bcrypt.compare(password, user.password);

        if (user.company_email === email && comparePassword) {
          const expiresIn = rememberMe ? "7d" : "8h";
          const token = jwt.sign(
            {
              userObjectId: user._id,
              userId: user.employeeID,
              name: user.firstname,
              role_name: user.role,
              email: user.email,
              company_email: user.company_email ? user.company_email : null,
              userInheritedRoles: user.inherits || []
            },
            process.env.TOKEN_SECRET,
            {
              expiresIn: expiresIn
            }
          );

          if (user.token.length >= 2) {
            user.token.pop();
          }
          user.token.unshift(token);
          await user.save();

          console.info(`Generate login token success ${email}`);

          if (rememberMe) {
            // Set the cookies correctly
            res.cookie("email", email, {
              httpOnly: true,
              maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000
            });
            res.cookie("password", password, {
              httpOnly: true,
              maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000
            });
          }

          return res.status(200).json({
            token: token,
            id: user._id
          });
        } else {
          res.status(403).json({
            message: authLabels.invalid_message
          });
        }
      } else {
        res.status(403).json({
          message: "You are not a Registered User"
        });
      }
    } else {
      res.status(404).json({
        message: authLabels.fieldrequired_message
      });
    }
  } catch (error) {
    console.error(error);
  }
};

// reset password
module.exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userObjectId;

    const { password, conformPassword } = req.body;
    if (password && conformPassword) {
      if (password !== conformPassword) {
        res.status(401).json({
          message: authLabels.passwordNotConfirm_message
        });
      }

      const user = await Employee.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }
      const comparePassword = await bcrypt.compare(password, user.password);
      if (comparePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as the old password"
        });
      }
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      await Employee.findByIdAndUpdate(
        {
          _id: userId
        },
        {
          $set: {
            password: newHashPassword
          }
        }
      );
      res.status(200).json({
        message: authLabels.changepassword_message
      });
    } else {
      res.json({
        msg: authLabels.fieldrequired_message
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// Create a random OTP
const generateOTP = () => {
  return randomstring.generate({
    length: 4,
    charset: "numeric"
  });
};

//forget Password
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email field is required" });
    }
    const user = await Employee.findOne({
      company_email: email
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }
    const userOtp = generateOTP();
    const otpexis = await Otp.findOne({ email: email });
    if (otpexis) {
      await Otp.findOneAndDelete({ email: email });
    }
    // const userOtp = 1234;
    await Otp.create({
      userId: user._id,
      email: email,
      otp: userOtp
    });

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.company_email,
        subject: "HR-TOOLS - Email OTP",
        html: `OTP: ${userOtp}`
      });
      res.status(200).json({
        message: "OTP sent successfully",
        info: info.response,
        email: user.company_email
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({ message: "Failed to send OTP via email" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email field is required" });
    }
    const user = await Employee.findOne({
      company_email: email,
      status: "completed"
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }
    const userOtp = generateOTP();
    const otpexis = await Otp.findOne({ email: email });
    if (otpexis) {
      await Otp.findOneAndDelete({ email: email });
    }
    // const userOtp = 1234;
    await Otp.create({
      userId: user._id,
      email: email,
      otp: userOtp
    });

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.company_email,
        subject: "HR-TOOLS - Email OTP",
        html: `OTP: ${userOtp}`
      });
      res.status(200).json({
        message: "OTP sent successfully",
        info: info.response,
        email: user.company_email
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({ message: "Failed to send OTP via email" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.verifyOtp = async (req, res) => {
  try {
    const getCurrentTimestamp = () => {
      return new Date().getTime();
    };

    const isOTPExpired = (storedTimestamp, expiryDuration) => {
      const currentTimestamp = getCurrentTimestamp();
      return currentTimestamp - storedTimestamp > expiryDuration;
    };

    const isBlocked = userotp => {
      const currentTimestamp = getCurrentTimestamp();
      const firstFailedAttemptTimestamp = new Date(
        userotp.firstFailedAttemptAt
      ).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      return (
        userotp.failedAttempts >= 3 &&
        currentTimestamp - firstFailedAttemptTimestamp < oneDay
      );
    };

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send("Missing email or OTP");
    }

    const userotp = await Otp.findOne({ email: email });
    if (!userotp) {
      return res.status(400).send("User not found");
    }

    if (isBlocked(userotp)) {
      return res
        .status(400)
        .send("User is blocked for the day due to too many failed attempts");
    }

    const expiryDuration = 1.5 * 60 * 1000;
    const storedTimestamp = new Date(userotp.createdAt).getTime();

    if (isOTPExpired(storedTimestamp, expiryDuration)) {
      return res.status(400).send("OTP has expired");
    }

    if (parseInt(otp) === userotp.otp) {
      const secret = process.env.TOKEN_SECRET;
      if (!secret) {
        console.error("TOKEN_SECRET is not defined in environment variables");
        return res.status(500).send("Internal Server Error");
      }

      const token = jwt.sign(
        {
          userId: userotp.userId
        },
        secret,
        {
          expiresIn: "20m"
        }
      );

      userotp.failedAttempts = 0;
      userotp.firstFailedAttemptAt = null;
      await userotp.save();

      return res.status(200).json({ token: token });
    } else {
      userotp.failedAttempts += 1;
      if (userotp.failedAttempts === 1) {
        userotp.firstFailedAttemptAt = new Date();
      }
      await userotp.save();

      return res.status(400).send("Invalid OTP");
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.json({
        message: authLabels.fieldrequired_message
      });
    }

    const new_secret = process.env.TOKEN_SECRET;

    jwt.verify(token, new_secret, async (err, decoded) => {
      if (err) {
        return res.json({
          message: authLabels.invalid_token_message
        });
      } else {
        const user = await Employee.findById(decoded.userId);
        if (!user) {
          return res.json({
            message: "User not found"
          });
        }
        // Compare the new password with the current password
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
          return res.json({
            message: "New password cannot be the same as the old password"
          });
        }

        const salt = await bcrypt.genSalt(10);
        const newHashPassword = await bcrypt.hash(password, salt);

        await Employee.findByIdAndUpdate(decoded.userId, {
          $set: {
            password: newHashPassword
          }
        });

        await Otp.findOneAndDelete({ userId: decoded.userId });

        res.json({
          message: authLabels.resetpassword_message
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

module.exports.logout = async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(
      {
        _id: req.user.userID
      },
      {
        $pull: {
          token: req.token
        }
      }
    );
    res.status(200).json({
      message: authLabels.logout_message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: authLabels.internal_server_message
    });
  }
};

module.exports.logOutAll = async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(
      {
        _id: req.user.userID
      },
      {
        $set: {
          token: []
        }
      }
    );
    res.status(200).json({
      message: authLabels.logout_all_message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: authLabels.internal_server_message
    });
  }
};

module.exports.userInfo = async (req, res) => {
  const loggedInUser = req.user;

  try {
    const userRoleMapping = {
      _id: loggedInUser.userObjectId,
      userId: loggedInUser.userId,
      role: loggedInUser.role_name,
      inherits: loggedInUser.userInheritedRoles
    };
    const empimg = await Employee.findById(userRoleMapping._id, {
      image: 1,
      _id: 0
    });

    const userResources = await getResourcesForUser(userRoleMapping);

    if (userResources)
      return res.status(200).json({
        image: empimg.image,
        role: userRoleMapping.role,
        resources: userResources
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
};

module.exports.ViewRoleApi = async (req, res) => {
  try {
    const roles = await Role.find().select({
      label: "$role",
      id: "$_id",
      _id: 0
    });
    return res.status(200).send(roles);
  } catch (error) {
    return res.status(500).send("internal server error");
  }
};

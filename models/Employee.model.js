const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    employeeID: {
      type: String,
      unique: true,
      required: false
    },
    firstname: {
      type: String,
      required: true
    },
    middlename: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: false
    },
    lastname: {
      type: String,
      required: false
    },
    image: {
      type: String,
      required: false
    },
    documentDob: {
      type: String,
      required: false
    },
    originalDob: {
      type: String,
      required: false
    },
    gender: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: true
    },
    mobile_number: {
      type: String,
      required: false
    },
    profile: {
      type: String,
      required: false
    },

    joining_date: {
      type: String,
      required: false
    },

    emergency_number: {
      type: String,
      required: false
    },
    aadharcard_no: {
      type: Number,
      required: false
    },
    resetpassword: {
      type: Boolean,
      default: false
    },
    aadhar_image: {
      type: String,
      required: false
    },
    pancard_no: {
      type: String,
      required: false
    },
    cocuments: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    pan_image: {
      type: String,
      required: false
    },
    family_member_first_name: {
      type: String,
      required: false
    },
    family_member_last_name: {
      type: String,
      required: false
    },
    relationship: {
      type: String,
      required: false
    },
    family_member_dob: {
      type: String,
      required: false
    },
    family_member_phone: {
      type: String,
      required: false
    },

    family_member_email: {
      type: String,
      required: false
    },

    currentAddress: {
      line1: {
        type: String,
        required: false
      },
      line2: {
        type: String,
        required: false
      },
      line3: {
        type: String,
        required: false
      },
      city: {
        type: Number,
        required: false
      },
      state: {
        type: Number,
        required: false
      },
      zip: {
        type: Number,
        required: false
      },
      country: {
        type: Number,
        required: false
      }
    },

    ParmanentAddress: {
      line1: {
        type: String,
        required: false
      },
      line2: {
        type: String,
        required: false
      },
      line3: {
        type: String,
        required: false
      },
      city: {
        type: Number,
        required: false
      },
      state: {
        type: Number,
        required: false
      },
      zip: {
        type: String,
        required: false
      },
      country: {
        type: Number,
        required: false
      }
    },
    sameAddress: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: "pending"
    },
    company_email: {
      type: String,
      default: null
    },
    department: {
      type: String,
      default: null
    },
    designation: {
      type: String,
      default: null
    },

    bankdetails: {
      bank_name: {
        type: String
      },
      account_no: {
        type: String
      },
      ifsc_code: {
        type: String
      }
    },

    ctcDetails: {
      totalctc: String,
      monthlycompensation: String,
      hra: String,
      pf: String,
      insurance: String,
      tax: String
    },

    worklocation: {
      country: Number,
      state: Number,
      city: Number,
      zip: String
    },

    inherits: [String],

    token: [
      {
        type: String,
        default: null
      }
    ]
  },
  {
    timestamps: true
  }
);
const Employee = mongoose.model("Employee", EmployeeSchema);
module.exports = Employee;

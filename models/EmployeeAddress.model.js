const mongoose = require("mongoose")

const empAddreshSchema = new mongoose.Schema({
    empid : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    currentAddress : {
        line1 : {
            type : String
        },
        line2 : {
            type : String
        },
        line3 : {
            type : String
        },
        city : {
            type : String
        },
        state : {
            type : String
        },
        zip : {
            type : Number
        },
        country : {
            type : String
        },
    },
    ParmanentAddress : {
        line1 : {
            type : String
        },
        line2 : {
            type : String
        },
        line3 : {
            type : String
        },
        city : {
            type : String
        },
        state : {
            type : String
        },
        zip : {
            type : String
        },
        country : {
            type : String
        },
    },
    sameAddress : {
        type : Boolean,
        default : false
        }
    },
   
  {
    timestamps: true
  }
   )
const EmpAddresh = mongoose.model("EmpAddresh", empAddreshSchema)
module.exports = EmpAddresh
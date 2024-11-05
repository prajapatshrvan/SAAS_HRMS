const mongoose = require("mongoose")

const OnBordingSchema = new mongoose.Schema({
    userkey : {
        type : String,
      },
     userid : {
      type : mongoose.Schema.Types.ObjectId
      }
     },
    {
     timestamps: true
    }
    )
  const Onboarding = mongoose.model("is_user", OnBordingSchema)
   module.exports = Onboarding
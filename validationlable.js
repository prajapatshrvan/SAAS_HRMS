const Validation = {
  email_regex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
  // /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  name_regex: /^[a-zA-Z ]{2,30}$/,
  mobile_regex: /^\d{10}$/,
  aadhar_Regex: /^[0-9]{12}$/,
  // pan_Regex: /^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]$/,
  pan_Regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  dob_Regex: /^\d{4}-\d{2}-\d{2}$/,
};

module.exports = Validation;

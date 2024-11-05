const Validation = {
    email_regex: /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    name_regex: /^[a-zA-Z ]{2,30}$/,
    mobile_regex: /^\d{10}$/,
    aadhar_Regex :/^\d{12}$/,
    pan_Regex  : /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    dob_Regex :  /^\d{4}-\d{2}-\d{2}$/
};

module.exports = Validation;

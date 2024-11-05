const {
  Candidate_Address_Details,
  Address_form_title,
} = require("../../i18/en/candidate_address_form.label");
const { education_form } = require("../../i18/en/candidate_education_form.label");
const { experience_form } = require("../../i18/en/candidate_experience_form.label");
const { details_form } = require("../../i18/en/candidate-details-form.label");
const { global } = require("../../i18/en/global.label");
const { header } = require("../../i18/en/header.label");
const { onboarding_title } = require("../../i18/en/onboarding-title.label");
const { sidebar } = require("../../i18/en/sidebar.label");

const {
  attendance,
} = require("../../i18/en/attendance-tracking/attendance-tracking.label");
const { add_asset } = require("../../i18/en/Leave-Request/add-asset.label");
const {
  employee_profile,
} = require("../../i18/en/Leave-Request/employee-profile.label");
const { leave_request } = require("../../i18/en/Leave-Request/leave-request.label");

module.exports.dasboardlabels = async (req, res) => {
  try {
    return res.status(200).json({
      address_form: { Candidate_Address_Details, Address_form_title },
      education_form: education_form,
      experience_form: experience_form,
      details_form: details_form,
      global: global,
      header: header,
      onboarding_title: onboarding_title,
      sidebar: sidebar,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports.leaverequestlabels = async (req, res) => {
  try {
    return res.status(200).json({
      attendance: attendance,
      add_asset: add_asset,
      employee_profile: employee_profile,
      leave_request: leave_request,
    });
  } catch (error) {
    res.status(500).json({
      massage: "Internal server error",
    });
  }
};

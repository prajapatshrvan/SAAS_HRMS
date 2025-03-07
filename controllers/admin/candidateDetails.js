const EmpDocument = require("../../models/EmpDocument.model.js");
const Employee = require("../../models/Employee.model.js");
const ApiCRUDController = require("../ApiCrudController.js");

module.exports.candidateDetails = async (req, res, next) => {
  let empId = req?.params?.empid;
  if (!empId) {
    res.status(404).send("Invalid Candidate");
  }

  let keys =
    "firstname middlename joining_date marital_status lastname image documentDob originalDob gender email mobile_number emergency_number aadharcard_no family_member_first_name family_member_last_name relationship family_member_dob family_member_phone family_member_email aadhar_image pancard_no pan_image status,pf_number uan_number company_name";

  let data = await getEmployeeData(empId, keys);

  let nextPage = false;
  if (data) {
    nextPage = true;
  }

  res.status(200).send({ data, nextPage });
};

module.exports.candidateAddressDetails = async (req, res, next) => {
  let empId = req?.params?.empid;
  if (!empId) {
    res.status(404).send("Invalid Candidate");
  }

  let keys = "currentAddress ParmanentAddress sameAddress";
  let data = await getEmployeeData(empId, keys);

  let nextPage = false;

  if (data && data?.currentAddress?.city) {
    nextPage = true;
  }
  res.status(200).send({ data, nextPage });
};

module.exports.candidateDocuments = async (req, res, next) => {
  let empId = req?.params?.empid;
  if (!empId) {
    res.status(404).send("Invalid Candidate");
  }

  let data = await getEmployeeDocsData(empId);
  let dataStatus = await getEmployeeData(empId, "status");

  let nextPage = false;
  if (data) {
    nextPage = true;
  }

  let newData = { ...data?._doc, status: dataStatus.status };
  res.status(200).send({ data: newData, nextPage });
};

const extractAddressProperties = (address) => {
  return {
    cityname: address?.city[0]?.name,
    statename: address?.state[0]?.name,
    countryname: address?.country[0]?.name,
    city: address?.city[0]?.id,
    state: address?.state[0]?.id,
    country: address?.country[0]?.id,
    line1: address?.line1,
    line2: address?.line2,
    line3: address?.line3,
    zip: address?.zip
  };
};

const modifyCandidateData = (data) => {
  data.ParmanentAddress = extractAddressProperties(data.ParmanentAddress);
  data.currentAddress = extractAddressProperties(data.currentAddress);
  data.worklocation = extractAddressProperties(data.worklocation);
  delete data.password;
  delete data.__v;
  delete data.token;

  return data;
};

const modifyLimitedCandidateData = (data) => {
  data.ParmanentAddress = extractAddressProperties(data.ParmanentAddress);
  data.currentAddress = extractAddressProperties(data.currentAddress);
  data.worklocation = extractAddressProperties(data.worklocation);
  delete data.password;
  delete data.originalDob;
  delete data.aadharcard_no;
  delete data.aadhar_image;
  delete data.pancard_no;
  delete data.pan_image;
  delete data.documents;
  delete data.bankdetails;
  delete data.ctcDetails;
  delete data.ParmanentAddress;
  delete data.currentAddress;
  delete data.worklocation;
  delete data.__v;
  delete data.token;
  return data;
};

module.exports.candidateAllData = async (req, res, next) => {
  let empId = req?.params?.empid;
  let userId = req.user?.userObjectId;
  let role = req.user?.role_name;

  if (!empId) {
    return res.status(404).send("Invalid Candidate");
  }

  let data = await readEmpAndPopulateData(empId);
  let newData;

  if (
    empId === userId ||
    role === "ADMIN" ||
    role === "EMPLOYEE" ||
    role === "HR" 
  ) {
    newData = modifyCandidateData({ ...data });
  } else {
    newData = modifyLimitedCandidateData({ ...data });
  }
  // console.log(newData,"newData")
  return res.status(200).send(newData);
};

const getEmployeeData = async (empId, keys) => {
  let data = await Employee.findOne({ _id: empId }, keys);

  return data;
};

const getEmployeeDocsData = async (empId, keys) => {
  let data;
  if (keys) {
    data = await EmpDocument.findOne({ empid: empId }, keys);
  } else {
    data = await EmpDocument.findOne({ empid: empId });
  }

  return data;
};

const readEmpAndPopulateData = async (empId) => {
  const { readAllandPopulate } = new ApiCRUDController(Employee);

  let collections = [
    { name: "empdocuments", key: "empid", as: "documents", local: "_id" },
    { name: "countries", key: "id", local: "ParmanentAddress.country", as: "ParmanentAddress.country" },
    { name: "states", key: "id", local: "ParmanentAddress.state", as: "ParmanentAddress.state" },
    { name: "cities", key: "id", local: "ParmanentAddress.city", as: "ParmanentAddress.city" },
    { name: "countries", key: "id", local: "currentAddress.country", as: "currentAddress.country" },
    { name: "states", key: "id", local: "currentAddress.state", as: "currentAddress.state" },
    { name: "cities", key: "id", local: "currentAddress.city", as: "currentAddress.city" },
    { name: "countries", key: "id", local: "worklocation.country", as: "worklocation.country" },
    { name: "states", key: "id", local: "worklocation.state", as: "worklocation.state" },
    { name: "cities", key: "id", local: "worklocation.city", as: "worklocation.city" }
  ];

  let data = await readAllandPopulate(collections, empId);
  return data;
};

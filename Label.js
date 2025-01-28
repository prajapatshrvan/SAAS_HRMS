const authLabels = {
  login_success_message: "Login success",
  register_user_success: "User registered successfully",
  already_user_exist: "user already exist",
  invalid_message: "Email or Password is not Valid",
  notRegister_message: "You are not a Registered User",
  fieldrequired_message: "all fields Are Required",
  passwordNotConfirm_message: "doesn't Match Password",
  changepassword_message: "Password Change Sucessfully",
  sendlink_message: "password Reset Email Sent...Please Check your Email",
  send_otp: "otp send successfully",
  notExistemail_message: "Email doesn't exists",
  emailFieldRequired_message: "Email field is Required",
  resetpasswowrd_message: "Password reset successfully",
  logout_message: "Logged out successfully",
  logout_all_message: "All screen logged out successfully",
  invalid_token_message: "Invalid Token",
  internal_server_message: "Internal server error",
  resetpassword_message: "Password reset successfull"
};
const roleLabels = {
  role_exist_message: "Role already exists",
  role_create_message: "Role added successfully",
  internal_server_message: "Internal server error",
  role_edit_message: "Role update successfully",
  role_edit_message: "Role Add successfully"
};

const resourcesLabels = {
  resources_exist_message: "Resources already exists",
  resources_create_message: "Resources added successfully",
  internal_server_message: "Internal server error",
  resources_edit_message: "Resources update successfully",

  resources_edit_message: "Resources Add successfully"
};

//  const permissionLabels = {
//     permission_create_message : "Permission added successfully",
//     internal_server_message : "Internal server error"
//  }

const recourcesLabels = {
  resources_create_message: "Recources added successfully",
  internal_server_message: "Internal server error",
  resources_update_message: "Recources updated successfully"
};

const Auth_Middleware = {
  authorization_error: "Authorization failed",
  payload_message: "Payload is missing",
  token_expire_message: "Token has expired",
  user_not_found_message: "User not found",
  invalid_token_message: "Invalid token"
};

const assetLabels = {
  fileUpload_error: "File upload error",
  asset_already_exist: "Asset Already Exists",
  invalid_dateFormat: "Invalid date format. Please use YYYY/MM/DD",
  asset_add_message: "Asset Added successfully",
  invalid_status: "Invalid status Please Enter Valid Status",
  Object_id_message: "Please select assetObject",
  Email_id_message: "Please select Email Id",
  asset_notfound_message: "This email is not associated with any user",
  not_found_message: "Asset not found",
  asset_already_assign_message: "Asset is already assigned",
  asset_update_Success_message: "Asset Update Successfully",
  asset_verified_message: "Verified",
  asset_not_verified_message: "Not Verified",
  invaid_status_value: "Invalid verified value",
  not_update_message: "No assets found to update",
  file_error: "No file uploaded",
  upload_And_save_message: "Excel File uploaded and saved successfully",
  internal_server_message: "Internal Server Error"
};

module.exports = {
  Auth_Middleware,
  authLabels,
  roleLabels,
  recourcesLabels,
  assetLabels,
  resourcesLabels
};

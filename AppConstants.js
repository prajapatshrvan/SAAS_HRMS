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
  notExistemail_message: "Email doesn't exists",
  emailFieldRequired_message: "Email field is Required",
  resetpasswowrd_message: "Password reset successfully",
  logout_message: "Logged out successfully",
  logout_all_message: "All screen logged out successfully",
  invalid_token_message: "Invalid Token",
  internal_server_message: "Internal server error"
};
const roleLabels = {
  role_exist_message: "Role already exists",
  role_create_message: "Role added successfully",
  internal_server_message: "Internal server error",
  role_edit_message: "Role updata successfully"
};

const permissionLabels = {
  permission_create_message: "Permission added successfully",
  internal_server_message: "Internal server error"
};

const Auth_Middleware = {
  authorization_error: "Authorization failed",
  payload_message: "Payload is missing",
  token_expire_message: "Token has expired",
  user_not_found_message: "User not found",
  invalid_token_message: "Invalid token"
};

module.exports = {
  Auth_Middleware,
  authLabels,
  roleLabels,
  permissionLabels
};

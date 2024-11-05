function generatePassword(length) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specialChars = "@#$%^&*()";

  const allChars = lowercase + uppercase + numbers + specialChars;

  // Ensure at least one lowercase letter is included
  let password = lowercase.charAt(Math.floor(Math.random() * lowercase.length));

  // Generate the rest of the password
  for (let i = 1; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password to ensure randomness
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

module.exports = generatePassword;

// console.log(generatePassword(6));

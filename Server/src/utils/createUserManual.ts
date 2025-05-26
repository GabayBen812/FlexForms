const bcrypt = require("bcrypt");

async function getHashedPassword() {
  const hashedPassword = await bcrypt.hash("102030", 10);
  console.log('Hashed password for "102030":');
  console.log(hashedPassword);
}

getHashedPassword();

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node server/utils/hashPassword.js <your_password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nYour bcrypt hash:\n');
  console.log(hash);
  console.log('');
});

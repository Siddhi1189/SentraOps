import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export { hashPassword, comparePassword };
export default {
  hashPassword,
  comparePassword,
};

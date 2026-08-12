import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id || user.userId, 
      organizationId: user.organizationId, 
      role: user.role 
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id || user.userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

export { generateAccessToken, generateAccessToken as signAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
export default {
  generateAccessToken,
  signAccessToken: generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

import AuthService from '../services/authService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import AuditService from '../services/auditService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const { user, organization, accessToken, refreshToken } = await AuthService.register(req.body);

  await AuditService.record(organization.id, user.id, 'auth.register', 'User', user.id, {
    email: user.email,
  });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(
    res,
    { user: sanitizeUser(user), organization, accessToken },
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await AuthService.login(req.body);

  await AuditService.record(user.organizationId, user.id, 'auth.login', 'User', user.id, {
    email: user.email,
  });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, { user: sanitizeUser(user), accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { accessToken, refreshToken } = await AuthService.refreshTokens(token);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return ApiResponse.success(res, { accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await AuthService.logout(token);
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, { message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { user: req.user });
});

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export { register, login, refresh, logout, me };
export default { register, login, refresh, logout, me };

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { COOKIE_NAME } from '../middleware/index.js';
import { HttpError } from '../utils/helpers.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  // The frontend proxies /api through its own origin, so the cookie is first-party.
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.verifyPassword(password))) throw new HttpError(401, 'Invalid email or password');
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await User.findById(req.user.sub);
  if (!user) throw new HttpError(401, 'User no longer exists');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

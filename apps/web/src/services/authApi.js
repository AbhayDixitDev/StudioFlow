import api from './api.js';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function register(displayName, email, password) {
  const { data } = await api.post('/auth/register', { email, password, displayName });
  return data.data;
}

export async function refreshToken(token) {
  const { data } = await api.post('/auth/refresh', { refreshToken: token });
  return data.data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

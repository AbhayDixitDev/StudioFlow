import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SERVER_URL_KEY = 'studioflow_server_url';
const TOKEN_KEY = 'studioflow_token';

const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api',
  ios: 'http://localhost:5000/api',
  default: 'http://localhost:5000/api',
});

let baseURL = DEFAULT_URL;

async function getBaseURL() {
  const stored = await AsyncStorage.getItem(SERVER_URL_KEY);
  if (stored) baseURL = stored;
  return baseURL;
}

const api = axios.create({ timeout: 30000 });

api.interceptors.request.use(async (config) => {
  config.baseURL = await getBaseURL();
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(err);
  }
);

export async function setServerURL(url) {
  const normalized = url.endsWith('/api') ? url : `${url}/api`;
  await AsyncStorage.setItem(SERVER_URL_KEY, normalized);
  baseURL = normalized;
}

export async function getServerURL() {
  return await getBaseURL();
}

export function getBaseURLSync() {
  return baseURL;
}

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  if (res.data?.token) {
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
  }
  return res.data;
}

export async function register(name, email, password) {
  const res = await api.post('/auth/register', { name, email, password });
  if (res.data?.token) {
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
  }
  return res.data;
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function isLoggedIn() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return !!token;
}

export async function getToken() {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export function getDownloadURL(serverPath) {
  const base = baseURL.replace('/api', '');
  return `${base}${serverPath}`;
}

export default api;

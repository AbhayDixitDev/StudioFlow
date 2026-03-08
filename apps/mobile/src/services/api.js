import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SERVER_URL_KEY = 'studioflow_server_url';
const TOKEN_KEY = 'studioflow_token';

// Auto-detect the dev machine's IP from Expo's debuggerHost.
function getAutoDetectedURL() {
  try {
    const debuggerHost =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000/api`;
      }
    }
  } catch {}
  return 'http://10.0.2.2:5000/api';
}

let baseURL = getAutoDetectedURL();
let _serverOnline = null; // null = unknown, true/false = checked

export async function checkServerOnline() {
  try {
    const url = baseURL.replace(/\/api$/, '') + '/api/health';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    _serverOnline = res.ok;
  } catch {
    _serverOnline = false;
  }
  return _serverOnline;
}

export function isServerOnline() {
  return _serverOnline === true;
}

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
  _serverOnline = null;
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

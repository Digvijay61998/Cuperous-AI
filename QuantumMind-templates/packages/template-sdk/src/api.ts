import axios, { AxiosInstance } from 'axios';
import { getContext } from './context';

/**
 * Shared axios instance pointed at the JarCube backend. The base URL is
 * injected at build time via VITE_API_BASE_URL so the same build works across
 * environments.
 *
 * Every request auto-attaches the visitor context as headers so templates
 * never have to thread ids through manually.
 */
const baseURL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  'http://localhost:4000/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const ctx = getContext();
  if (ctx.visitorId) config.headers['x-visitor-id'] = ctx.visitorId;
  if (ctx.botId) config.headers['x-bot-id'] = ctx.botId;
  if (ctx.conversationId) config.headers['x-conversation-id'] = ctx.conversationId;
  if (ctx.platform) config.headers['x-platform'] = ctx.platform;
  return config;
});

export const setApiBaseUrl = (url: string) => {
  api.defaults.baseURL = url;
};

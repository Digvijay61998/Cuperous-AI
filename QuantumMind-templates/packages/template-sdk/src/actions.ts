import { api } from './api';
import { getContext } from './context';

/**
 * Typed, reusable actions every template can call. Each action automatically
 * includes the visitor context (visitorId, phone, botId, platform) so the
 * backend can attribute the submission to the right customer/conversation.
 *
 * NOTE: The endpoint paths below are the intended Phase-2 contract. They are
 * centralised here so that when the backend endpoints land, every template
 * benefits without any per-template change.
 */

const withContext = <T extends Record<string, any>>(payload: T) => {
  const ctx = getContext();
  return {
    visitorId: ctx.visitorId,
    phone: ctx.phone,
    botId: ctx.botId,
    conversationId: ctx.conversationId,
    platform: ctx.platform,
    templateId: ctx.templateId,
    ...payload,
  };
};

export interface AppointmentPayload {
  service?: string;
  practitioner?: string;
  date: string; // ISO date
  slot: string; // e.g. "10:30 AM"
  name: string;
  phone?: string;
  notes?: string;
  [key: string]: any;
}

export const createAppointment = (payload: AppointmentPayload) =>
  api.post('/template/actions/appointment', withContext(payload));

export const submitForm = (formId: string, values: Record<string, any>) =>
  api.post('/template/actions/form', withContext({ formId, values }));

export const createLead = (values: Record<string, any>) =>
  api.post('/template/actions/lead', withContext(values));

export const bookSlot = (values: Record<string, any>) =>
  api.post('/template/actions/slot', withContext(values));

export const uploadFile = (file: File, meta: Record<string, any> = {}) => {
  const form = new FormData();
  form.append('file', file);
  Object.entries(withContext(meta)).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  return api.post('/template/actions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const makePayment = (values: Record<string, any>) =>
  api.post('/template/actions/payment', withContext(values));

export const generateQuote = (values: Record<string, any>) =>
  api.post('/template/actions/quote', withContext(values));

export const fetchProducts = (params: Record<string, any> = {}) =>
  api.get('/template/actions/products', { params });

// ** WhatsApp Web (baileys) session API helpers.
// Mirrors OpenWA's /sessions surface, served by QuantumMind-backend at
// /api/whatsapp-web/sessions. These drive the Social Messengers "WhatsApp Web"
// connect flow and the OpenWA-style session action buttons.
import Axios from 'src/helper/Axios';

const BASE = 'whatsapp-web/sessions';

export interface WhatsappWebSession {
  id?: string;
  _id?: string;
  name: string;
  status: string;
  liveStatus?: string;
  engineLoaded?: boolean;
  phone?: string;
  pushName?: string;
  jarcubeBot?: any;
  social?: any;
  connectedAt?: string;
  lastActiveAt?: string;
}

export const createWhatsappWebSession = (data: {
  name: string;
  jarcubeBot: string;
}): Promise<WhatsappWebSession> =>
  Axios.post(BASE, data).then((r) => r.data);

export const getWhatsappWebSession = (id: string): Promise<WhatsappWebSession> =>
  Axios.get(`${BASE}/${id}`).then((r) => r.data);

export const startWhatsappWebSession = (id: string): Promise<WhatsappWebSession> =>
  Axios.post(`${BASE}/${id}/start`).then((r) => r.data);

export const stopWhatsappWebSession = (id: string): Promise<WhatsappWebSession> =>
  Axios.post(`${BASE}/${id}/stop`).then((r) => r.data);

/** Unlink the device from WhatsApp (logout). */
export const unlinkWhatsappWebSession = (id: string): Promise<WhatsappWebSession> =>
  Axios.post(`${BASE}/${id}/logout`).then((r) => r.data);

/** Force-kill a wedged session. */
export const killWhatsappWebSession = (id: string): Promise<WhatsappWebSession> =>
  Axios.post(`${BASE}/${id}/force-kill`).then((r) => r.data);

/** Delete the session AND its linked Social row. */
export const deleteWhatsappWebSession = (id: string): Promise<any> =>
  Axios.delete(`${BASE}/${id}`).then((r) => r.data);

export const getWhatsappWebQr = (
  id: string,
): Promise<{ qrCode: string; status: string }> =>
  Axios.get(`${BASE}/${id}/qr`).then((r) => r.data);

export const requestWhatsappWebPairingCode = (
  id: string,
  phoneNumber: string,
): Promise<{ pairingCode: string; status: string }> =>
  Axios.post(`${BASE}/${id}/pairing-code`, { phoneNumber }).then((r) => r.data);

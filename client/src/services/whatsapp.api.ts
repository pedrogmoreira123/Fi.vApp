import { getToken } from "@/utils/auth";

const API_URL = "https://app.fivconnect.net/api/whatsapp";

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Token não encontrado");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ${res.status}: ${errorText}`);
  }

  return res.json();
}

export const whatsappAPI = {
  getInstance: () => request("/instance"),
  getQRCode: (id: string) => request(`/instance/${id}/qrcode`),
  connectInstance: (id: string) =>
    request(`/instance/${id}/connect`, { method: "POST" }),
  disconnectInstance: (id: string) =>
    request(`/instance/${id}`, { method: "DELETE" }),
  sendMessage: (data: any) =>
    request("/send-message", { method: "POST", body: JSON.stringify(data) }),
  sendMedia: (data: any) =>
    request("/send-media", { method: "POST", body: JSON.stringify(data) }),
};

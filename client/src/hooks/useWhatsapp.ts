import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/utils/auth";
import { whatsappAPI } from "@/services/whatsapp.api";

let socket: Socket | null = null;

export function useWhatsapp() {
  const [instance, setInstance] = useState<any>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [error, setError] = useState<string | null>(null);

  const initSocket = useCallback(() => {
    const token = getToken();
    if (!token) return;

    socket = io("https://app.fivconnect.net", {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token }
    });

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("whatsapp:status", (data) => setInstance(data));
    socket.on("whatsapp:qr", (data) => setQrcode(data.qr));
    socket.on("whatsapp:connected", () => setStatus("connected"));
    socket.on("whatsapp:disconnected", () => setStatus("disconnected"));
    socket.on("connect_error", (err) => setError(err.message));
  }, []);

  useEffect(() => {
    initSocket();
    return () => { socket?.disconnect(); };
  }, [initSocket]);

  return {
    instance,
    qrcode,
    status,
    error,
    refreshInstance: () => whatsappAPI.getInstance().then(setInstance).catch(setError),
    refreshQRCode: (id: string) => whatsappAPI.getQRCode(id).then(setQrcode).catch(setError),
    connect: (id: string) => whatsappAPI.connectInstance(id).then(setInstance).catch(setError),
    disconnect: (id: string) => whatsappAPI.disconnectInstance(id).then(() => setStatus("disconnected")).catch(setError),
  };
}

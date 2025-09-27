import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function initSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Token ausente"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id} (usuário ${socket.data.user?.id})`);

    // Exemplo inicial
    socket.emit("whatsapp:status", { connected: false });
  });

  return io;
}

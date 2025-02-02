const socketIo = require("socket.io");

const createSocketServer = (port, allowedOrigin) => {
  const io = socketIo(port, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
    },
  });

  return io;
};

const registerSocketEvent = (socket, eventName) => {
  socket.on(eventName, (data) => {
    console.log(data);
    socket.broadcast.emit(eventName, JSON.stringify(data)); // Emit to all clients except the sender
  });
};

const handleNewConnection = (socket) => {
  console.log("A user connected");
  const event = "handpose";
  registerSocketEvent(socket, event);
};

const startServer = () => {
  const port = 3002;
  const allowedOrigin = "*"; // Update this with your Next.js frontend origin
  const io = createSocketServer(port, allowedOrigin);

  io.on("connection", handleNewConnection);

  console.log(`Server-side WebSocket running on port ${port}`);
};

startServer();

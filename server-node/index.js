const msgpack = require("msgpack-lite");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });
console.log("wss:created", "ws://localhost:8080");

const world = {};

class Msg {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

wss.on("connection", ws => {
  console.log("ws:connected");

  ws.on("message", buffer => {
    let msg;
    try {
      msg = msgpack.decode(buffer);
    } catch (error) {
      sendError("invalid msg");
      ws.close();
      return;
    }

    handleMsg(msg);
  });

  ws.on("close", () => {});

  function applyClientState(clientState) {
    Object.values(clientState).forEach(entry => {
      world[entry.id] = entry;
    });
  }

  function handleMsg(msg) {
    // console.log("msg:received", msg.type);
    if (msg.type === "CLIENT_UPDATE") {
      const clientState = msg.data;
      applyClientState(clientState);
      sendServerState();
    } else if (msg.type === "LOGIN") {
      // applyClientState({});
      sendServerState();
    } else {
      sendError("unknowen msg type");
    }
  }

  function sendServerState() {
    // console.log("msg:send:server-update");
    sendMsg("SERVER_UPDATE", world);
  }

  function sendError(text) {
    console.log("msg:send:error", text);
    sendMsg("ERROR", text);
  }

  function sendMsg(type, data) {
    const msg = new Msg(type, data);
    const buffer = msgpack.encode(msg);
    ws.send(buffer);
  }
});

setInterval(() => {
  console.log(world);
}, 1000);

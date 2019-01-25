const net = (function() {
  // const host = "10.42.0.1:9002";
  const host = "localhost:8080";

  const ws = new WebSocket(`ws://${host}`);
  console.log("ws:created");

  const userId = "u" + Math.round(Math.random() * 16 ** 6).toString(16);

  let connected = false;

  let world = {
    [userId]: {
      id: userId,
      pos: {
        x: 1,
        y: 1
      }
    }
  };

  ws.addEventListener("open", () => {
    console.log("ws:event:open", event);
    connected = true;
    init();
    sendLogin();
  });

  class Msg {
    constructor(type, data) {
      this.type = type;
      this.data = data;
    }
  }

  function init() {
    ws.addEventListener("message", event => {
      // console.log("ws:event:message", event);
      let msg;
      try {
        const blob = event.data;
        const fileReader = new FileReader();
        fileReader.onload = event => {
          const buffer = event.target.result;
          msg = msgpack.decode(new Uint8Array(buffer));
          handleMsg(msg);
        };
        fileReader.readAsArrayBuffer(blob);
      } catch (error) {
        console.error(error);
        sendError("invalid msg");
        ws.close();
        return;
      }
    });

    ws.addEventListener("close", event => {
      console.log("ws:event:close", event);
      connected = false;
    });

    ws.addEventListener("error", event => {
      console.log("ws:event:error", event);
      console.error("ws error", event);
      ws.close();
    });

    window.addEventListener("unload", () => {
      console.log("window:event:unload", event);
      ws.close();
    });
  }

  function handleMsg(msg) {
    // console.log("msg:received", msg.type);
    if (msg.type === "SERVER_UPDATE") {
      const serverState = msg.data;
      applyServerState(serverState);
      setTimeout(() => {
        sendClientState();
      }, 10);
    } else {
      sendError("unknowen msg type");
    }
  }

  function applyServerState(serverState) {
    Object.values(serverState).forEach(entry => {
      let object;
      if (entry.id === userId) {
        // object = base.player;
        return;
      } else {
        object = base.users.children.find(
          object => object.userData.entryId === entry.id
        );
      }

      if (!object) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshNormalMaterial();
        object = new THREE.Mesh(geometry, material);
        object.userData.entryId = entry.id;
        base.users.add(object);
      }

      object.position.x = entry.positionX;
      object.position.y = entry.positionY;
    });
  }

  function sendLogin() {
    console.log("msg:send:login");
    sendMsg("LOGIN", {});
  }

  function sendClientState() {
    // console.log("msg:send:client-update");
    sendMsg("CLIENT_UPDATE", [
      {
        id: userId,
        positionX: base.player.position.x,
        positionY: base.player.position.y
      }
    ]);
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

  return {
    world
  };
})();

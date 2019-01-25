const keysDown = new Set();

const codeW = 87;
const codeA = 65;
const codeS = 83;
const codeD = 68;

window.addEventListener("keydown", event => {
  // console.log(event.code, event.keyCode);
  keysDown.add(event.keyCode);
});

window.addEventListener("keyup", event => {
  keysDown.delete(event.keyCode);
});

(function loop(now) {
  requestAnimationFrame(loop);

  if (keysDown.has(codeW)) {
    base.player.position.y += 0.05;
  }
  if (keysDown.has(codeA)) {
    base.player.position.x -= 0.05;
  }
  if (keysDown.has(codeS)) {
    base.player.position.y -= 0.05;
  }
  if (keysDown.has(codeD)) {
    base.player.position.x += 0.05;
  }

  display.render();
})();

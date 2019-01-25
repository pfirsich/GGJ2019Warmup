const base = (function() {
  const scene = new THREE.Scene();

  const users = new THREE.Object3D();
  scene.add(users);

  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshNormalMaterial();
  const player = new THREE.Mesh(geometry, material);
  scene.add(player);

  return {
    users,
    player,
    scene
  };
})();

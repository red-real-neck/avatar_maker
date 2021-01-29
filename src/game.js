import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import logger from "./logger";
import constants from "./constants";

const state = {
  DOMContentLoaded: false,
  shouldResize: false,
  didInit: false,
  scene: null,
  camera: null,
  renderer: null,
  hairStyleNode: null,
  avatarConfig: {},
  newAvatarConfig: {},
  shouldApplyNewAvatarConfig: false,
};
window.gameState = state;

window.addEventListener("DOMContentLoaded", () => {
  state.DOMContentLoaded = true;
});
window.onresize = () => {
  state.shouldResize = true;
};
document.body.addEventListener(constants.avatarConfigChanged, (e) => {
  state.newAvatarConfig = e.detail.avatarConfig;
  state.shouldApplyNewAvatarConfig = true;
});

const loadGLTF = (function () {
  const loader = new GLTFLoader();
  return function loadGLTF(url) {
    return new Promise(function (resolve, reject) {
      loader.load(
        url,
        function (gltf) {
          resolve(gltf);
          // gltf.animations; // Array<THREE.AnimationClip>
          // gltf.scene; // THREE.Group
          // gltf.scenes; // Array<THREE.Group>
          // gltf.cameras; // Array<THREE.Camera>
          // gltf.asset; // Object
        },
        function (xhr) {
          logger.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        function (error) {
          logger.log("An error happened");
          reject(error);
        }
      );
    });
  };
})();

function init() {
  THREE.Cache.enabled = true;
  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.25, 1.5);
  state.camera = camera;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 2, 1);
  scene.add(directionalLight);

  const renderer = new THREE.WebGLRenderer();
  state.renderer = renderer;
  renderer.setSize(window.innerWidth, window.innerHeight);
  // TODO: Square this with react
  document.body.appendChild(renderer.domElement);

  loadGLTF("assets/DefaultAvatar.glb").then(function (gltf) {
    scene.add(gltf.scene);
  });

  state.hairStyleNode = new THREE.Group();
  scene.add(state.hairStyleNode);
}

function tick(time) {
  {
    window.requestAnimationFrame(tick);
  }

  {
    if (state.DOMContentLoaded && !state.didInit) {
      init();
      state.didInit = true;
    }
    if (!state.didInit) {
      return;
    }
  }

  {
    if (state.shouldResize) {
      state.shouldResize = false;
      state.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  {
    // Render scene
    const { renderer, scene, camera } = state;
    renderer.render(scene, camera);
    // TODO: Do we need to update the camera aspect and call updateProjectionMatrix?
  }

  {
    if (state.shouldApplyNewAvatarConfig) {
      if (state.newAvatarConfig.hairStyle !== state.avatarConfig.hairStyle) {
        state.hairStyleNode.clear();
        if (state.newAvatarConfig.hairStyle !== null) {
          loadGLTF(`assets/${state.newAvatarConfig.hairStyle}.glb`).then((gltf) => state.hairStyleNode.add(gltf.scene));
        }
        state.avatarConfig.hairStyle = state.newAvatarConfig.hairStyle;
      }
      state.shouldApplyNewAvatarConfig = false;
    }
  }
}

window.requestAnimationFrame(tick);
mport { GollyCA } from '../src/golly-ca.js';
import { MarchingCubes } from '../src/marching-cubes.js';
import { Triangulation } from '../src/triangulation.js';
import { LaneDetection } from '../src/lane-detection.js';
// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);
camera.position.set(30, 30, 30);
camera.lookAt(0, 0, 0);
// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.8);
directionalLight.position.set(20, 40, 20);
scene.add(directionalLight);
// Initialize systems
const resolution = 20;
const ca = new GollyCA(resolution);
const marchingCubes = new MarchingCubes(resolution);
const triangulation = new Triangulation();
const laneDetection = new LaneDetection();
let mesh = null;
let stepCount = 0;
let isPlaying = true;
// UI elements
const stepCountEl = document.getElementById('stepCount');
const activeCountEl = document.getElementById('activeCount');
const laneCountEl = document.getElementById('laneCount');
// Controls
document.getElementById('stepForward').onclick = () => {
  ca.stepForward();
  updateVisualization();
  stepCount++;
};
document.getElementById('stepBackward').onclick = () => {
  ca.stepBackward();
  updateVisualization();
  stepCount--;
};
document.getElementById('addDirac').onclick = () => {
  const x = Math.floor(Math.random() * resolution);

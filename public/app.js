import { GollyCA } from '../src/golly-ca.js';
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
  const y = Math.floor(Math.random() * resolution);
  const z = Math.floor(Math.random() * resolution);
  ca.addDiracEvent(x, y, z);
  updateVisualization();
};

document.getElementById('reset').onclick = () => {
  ca.reset();
  stepCount = 0;
  updateVisualization();
};

function updateVisualization() {
  // Update mesh
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  const meshData = marchingCubes.extractMesh(ca.field);
  if (meshData.positions.length > 0) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(meshData.positions.length * 3);
    
    for (let i = 0; i < meshData.positions.length; i++) {
      vertices[i * 3] = meshData.positions[i][0] - resolution / 2;
      vertices[i * 3 + 1] = meshData.positions[i][1] - resolution / 2;
      vertices[i * 3 + 2] = meshData.positions[i][2] - resolution / 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(meshData.cells.flat());
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  }

  // Update stats
  const activeCount = ca.getActiveVoxelCount();
  const lanes = laneDetection.detectLanes(ca.field, resolution);
  
  stepCountEl.textContent = stepCount;
  activeCountEl.textContent = activeCount;
  laneCountEl.textContent = lanes.length;
}

// Initialize
ca.initialize();
updateVisualization();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (isPlaying && stepCount % 30 === 0) { // Auto-step every 30 frames
    ca.stepForward();
    updateVisualization();
    stepCount++;
  }
  
  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

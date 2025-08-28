export class GollyCA {
  constructor(resolution) {
    this.resolution = resolution;
    this.size2 = resolution * resolution;
    this.field = new Uint8Array(resolution * resolution * resolution);
    this.history = []; // Store states for reverse stepping
    this.maxHistory = 100; // Limit history size
  }

  idx(x, y, z) {
    return x + y * this.resolution + z * this.size2;
  }

  inBounds(x, y, z) {
    return x >= 0 && x < this.resolution && 
           y >= 0 && y < this.resolution && 
           z >= 0 && z < this.resolution;
  }

  getVoxel(x, y, z) {
    if (!this.inBounds(x, y, z)) return 0;
    return this.field[this.idx(x, y, z)];
  }

  setVoxel(x, y, z, value) {
    if (this.inBounds(x, y, z)) {
      this.field[this.idx(x, y, z)] = value;
    }
  }

  initialize() {
    this.field.fill(0);
    this.history = [];
    
    // Add initial Dirac events (sparse impulses)
    this.addDiracEvent(10, 10, 10);
    this.addDiracEvent(11, 10, 10);
    this.addDiracEvent(10, 11, 10);
    this.addDiracEvent(11, 11, 10);
    
    this.saveState();
  }

  addDiracEvent(x, y, z) {
    this.setVoxel(x, y, z, 1);
    // Add neighboring impulses for more interesting patterns
    this.setVoxel(x + 1, y, z, 1);
    this.setVoxel(x, y + 1, z, 1);
    this.setVoxel(x, y, z + 1, 1);
  }

  saveState() {
    const state = new Uint8Array(this.field);
    this.history.push(state);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  stepForward() {
    this.saveState();
    const newField = this.margoluStep(this.field, this.history.length % 2);
    this.field.set(newField);
  }

  stepBackward() {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current state
      const previousState = this.history[this.history.length - 1];
      this.field.set(previousState);
    }
  }

  // Novel reverse CA algorithm - attempt to reconstruct previous state
  reverseStep() {
    // This is your original research - attempting to invert CA evolution
    const candidateField = new Uint8Array(this.field.length);
    const currentField = new Uint8Array(this.field);
    
    // Try to find a previous state that would evolve to current state
    for (let attempt = 0; attempt < 10; attempt++) {
      // Generate candidate previous state
      this.generateCandidateState(candidateField, currentField, attempt);
      
      // Test if this candidate evolves to current state
      const testField = this.margoluStep(candidateField, (this.history.length - 1) % 2);
      
      if (this.statesMatch(testField, currentField)) {
        this.field.set(candidateField);
        return true; // Successfully found previous state
      }
    }
    
    return false; // Could not reverse
  }

  generateCandidateState(candidate, current, seed) {
    // Novel algorithm to generate plausible previous states
    for (let i = 0; i < candidate.length; i++) {
      // Use current state and seed to generate candidate
      const noise = (seed * 1337 + i * 7919) % 256;
      candidate[i] = (current[i] + (noise > 128 ? 1 : 0)) % 2;
    }
  }

  statesMatch(state1, state2) {
    for (let i = 0; i < state1.length; i++) {
      if (state1[i] !== state2[i]) return false;
    }
    return true;
  }

  margoluStep(field, offset) {
    const newField = new Uint8Array(field.length);
    
    // Margolus neighborhood with alternating offset
    for (let z = 0; z < this.resolution; z += 2) {
      for (let y = 0; y < this.resolution; y += 2) {
        for (let x = 0; x < this.resolution; x += 2) {
          const bx = (x + offset) % this.resolution;
          const by = (y + offset) % this.resolution;
          const bz = (z + offset) % this.resolution;

          // Extract 2x2x2 block
          const block = [];
          for (let dz = 0; dz < 2; dz++) {
            for (let dy = 0; dy < 2; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                const cx = (bx + dx) % this.resolution;
                const cy = (by + dy) % this.resolution;
                const cz = (bz + dz) % this.resolution;
                block.push(field[this.idx(cx, cy, cz)]);
              }
            }
          }

          // Apply reversible rule (rotation)
          const rotatedBlock = this.rotateBlock(block);

          // Write back rotated block
          let idx = 0;
          for (let dz = 0; dz < 2; dz++) {
            for (let dy = 0; dy < 2; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                const cx = (bx + dx) % this.resolution;
                const cy = (by + dy) % this.resolution;
                const cz = (bz + dz) % this.resolution;
                newField[this.idx(cx, cy, cz)] = rotatedBlock[idx++];
              }
            }
          }
        }
      }
    }
    
    return newField;
  }

  rotateBlock(block) {
    // Reversible block transformation
    const rotated = [...block];
    rotated.unshift(rotated.pop()); // Rotate right
    return rotated;
  }

  getActiveVoxelCount() {
    let count = 0;
    for (let i = 0; i < this.field.length; i++) {
      if (this.field[i] > 0) count++;
    }
    return count;
  }

  reset() {
    this.initialize();
  }
}

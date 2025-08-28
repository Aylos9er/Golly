import { surfaceNets } from 'https://cdn.skypack.dev/isosurface';

export class MarchingCubes {
  constructor(resolution) {
    this.resolution = resolution;
  }

  extractMesh(field) {
    const scalarField = (x, y, z) => {
      if (x < 0 || y < 0 || z < 0 || 
          x >= this.resolution || y >= this.resolution || z >= this.resolution) {
        return 0;
      }
      const idx = x + y * this.resolution + z * this.resolution * this.resolution;
      return field[idx] > 0 ? 1 : 0;
    };

    try {
      const mesh = surfaceNets([this.resolution, this.resolution, this.resolution], scalarField, 0.5);
      return {
        positions: mesh.positions || [],
        cells: mesh.cells || []
      };
    } catch (error) {
      console.warn('Marching cubes extraction failed:', error);
      return { positions: [], cells: [] };
    }
  }

  // Alternative: simple voxel mesh extraction
  extractVoxelMesh(field) {
    const positions = [];
    const cells = [];
    let vertexIndex = 0;

    for (let z = 0; z < this.resolution; z++) {
      for (let y = 0; y < this.resolution; y++) {
        for (let x = 0; x < this.resolution; x++) {
          const idx = x + y * this.resolution + z * this.resolution * this.resolution;
          
          if (field[idx] > 0) {
            // Add cube vertices
            const cubeVertices = this.getCubeVertices(x, y, z);
            positions.push(...cubeVertices);
            
            // Add cube faces (12 triangles)
            const cubeFaces = this.getCubeFaces(vertexIndex);
            cells.push(...cubeFaces);
            
            vertexIndex += 8;
          }
        }
      }
    }

    return { positions, cells };
  }

  getCubeVertices(x, y, z) {
    return [
      [x, y, z], [x+1, y, z], [x+1, y+1, z], [x, y+1, z],     // Bottom face
      [x, y, z+1], [x+1, y, z+1], [x+1, y+1, z+1], [x, y+1, z+1] // Top face
    ];
  }

  getCubeFaces(startIndex) {
    const faces = [];
    const indices = [
      // Bottom face
      [0, 1, 2], [0, 2, 3],
      // Top face  
      [4, 6, 5], [4, 7, 6],
      // Front face
      [0, 4, 5], [0, 5, 1],
      // Back face
      [2, 6, 7], [2, 7, 3],
      // Left face
      [0, 3, 7], [0, 7, 4],
      // Right face
      [1, 5, 6], [1, 6, 2]
    ];

    for (const face of indices) {
      faces.push([
        startIndex + face[0],
        startIndex + face[1], 
        startIndex + face[2]
      ]);
    }

    return faces;
  }
}

export class Triangulation {
  constructor() {
    this.delaunator = window.Delaunator; // From CDN
  }

  // Extract 2D slice from 3D field and triangulate
  triangulateSlice(field, resolution, sliceAxis = 'z', sliceIndex = 10) {
    const points = this.extractSlicePoints(field, resolution, sliceAxis, sliceIndex);
    
    if (points.length < 3) {
      return { triangles: [], points: [] };
    }

    try {
      const delaunay = this.delaunator.from(points);
      return {
        triangles: delaunay.triangles,
        points: points,
        hull: delaunay.hull
      };
    } catch (error) {
      console.warn('Triangulation failed:', error);
      return { triangles: [], points: [] };
    }
  }

  extractSlicePoints(field, resolution, axis, index) {
    const points = [];
    const size2 = resolution * resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        let fieldIndex;
        
        switch (axis) {
          case 'x':
            fieldIndex = index + j * resolution + i * size2;
            if (field[fieldIndex] > 0) points.push([j, i]);
            break;
          case 'y':
            fieldIndex = i + index * resolution + j * size2;
            if (field[fieldIndex] > 0) points.push([i, j]);
            break;
          case 'z':
          default:
            fieldIndex = i + j * resolution + index * size2;
            if (field[fieldIndex] > 0) points.push([i, j]);
            break;
        }
      }
    }

    return points;
  }

  // Detect triangulation events (topology changes)
  detectTriangulationEvents(previousTriangulation, currentTriangulation) {
    const events = [];

    if (!previousTriangulation || !currentTriangulation) {
      return events;
    }

    const prevTriCount = previousTriangulation.triangles.length / 3;
    const currTriCount = currentTriangulation.triangles.length / 3;

    if (prevTriCount !== currTriCount) {
      events.push({
        type: 'triangle_count_change',
        previous: prevTriCount,
        current: currTriCount,
        delta: currTriCount - prevTriCount
      });
    }

    const prevPointCount = previousTriangulation.points.length;
    const currPointCount = currentTriangulation.points.length;

    if (prevPointCount !== currPointCount) {
      events.push({
        type: 'point_count_change',
        previous: prevPointCount,
        current: currPointCount,
        delta: currPointCount - prevPointCount
      });
    }

    return events;
  }

  // Calculate triangulation complexity (inspired by zxcvbn)
  calculateComplexity(triangulation) {
    if (!triangulation.triangles || triangulation.triangles.length === 0) {
      return 0;
    }

    const triangleCount = triangulation.triangles.length / 3;
    const pointCount = triangulation.points.length;
    
    // Complexity based on triangle density and point distribution
    const density = triangleCount / Math.max(pointCount, 1);
    const distribution = this.calculatePointDistribution(triangulation.points);
    
    return Math.floor(density * distribution * 100);
  }

  calculatePointDistribution(points) {
    if (points.length < 2) return 1;

    let totalDistance = 0;
    let minDistance = Infinity;
    let maxDistance = 0;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i][0] - points[j][0], 2) +
          Math.pow(points[i][1] - points[j][1], 2)
        );
        totalDistance += dist;
        minDistance = Math.min(minDistance, dist);
        maxDistance = Math.max(maxDistance, dist);
      }
    }

    const avgDistance = totalDistance / (points.length * (points.length - 1) / 2);
    const uniformity = minDistance / Math.max(maxDistance, 0.001);
    
    return avgDistance * uniformity;
  }
}

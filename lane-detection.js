export class LaneDetection {
  constructor() {
    this.minLaneLength = 3;
    this.maxGapSize = 1;
  }

  detectLanes(field, resolution) {
    const lanes = [];
    const visited = new Set();

    // Detect lanes in all three dimensions
    lanes.push(...this.detectLanesInDirection(field, resolution, 'x', visited));
    lanes.push(...this.detectLanesInDirection(field, resolution, 'y', visited));
    lanes.push(...this.detectLanesInDirection(field, resolution, 'z', visited));

    return this.filterAndMergeLanes(lanes);
  }

  detectLanesInDirection(field, resolution, direction, visited) {
    const lanes = [];
    const size2 = resolution * resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const lane = this.traceLane(field, resolution, direction, i, j, visited);
        if (lane.length >= this.minLaneLength) {
          lanes.push({
            direction,
            points: lane,
            length: lane.length,
            id: `${direction}_${i}_${j}_${Date.now()}`
          });
        }
      }
    }

    return lanes;
  }

  traceLane(field, resolution, direction, startI, startJ, visited) {
    const lane = [];
    const size2 = resolution * resolution;
    let gapCount = 0;

    for (let k = 0; k < resolution; k++) {
      let x, y, z, index;

      switch (direction) {
        case 'x':
          x = k; y = startI; z = startJ;
          break;
        case 'y':
          x = startI; y = k; z = startJ;
          break;
        case 'z':
          x = startI; y = startJ; z = k;
          break;
      }

      index = x + y * resolution + z * size2;
      const key = `${x},${y},${z}`;

      if (field[index] > 0 && !visited.has(key)) {
        lane.push({ x, y, z, index });
        visited.add(key);
        gapCount = 0;
      } else if (lane.length > 0) {
        gapCount++;
        if (gapCount > this.maxGapSize) {
          break;
        }
      }
    }

    return lane;
  }

  filterAndMergeLanes(lanes) {
    // Remove duplicate and overlapping lanes
    const filtered = [];
    
    for (const lane of lanes) {
      let isDuplicate = false;
      
      for (const existing of filtered) {
        if (this.lanesOverlap(lane, existing)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        filtered.push(lane);
      }
    }

    return filtered;
  }

  lanesOverlap(lane1, lane2) {
    if (lane1.direction !== lane2.direction) return false;
    
    const overlap = lane1.points.filter(p1 => 
      lane2.points.some(p2 => 
        p1.x === p2.x && p1.y === p2.y && p1.z === p2.z
      )
    );

    return overlap.length > Math.min(lane1.length, lane2.length) * 0.5;
  }

  // Detect hyperspace structures (4D-like patterns)
  detectHyperspaceLanes(field, resolution, timeHistory) {
    if (!timeHistory || timeHistory.length < 3) {
      return [];
    }

    const hyperLanes = [];
    
    // Look for persistent lanes across time
    for (let t = 0; t < timeHistory.length - 1; t++) {
      const currentLanes = this.detectLanes(timeHistory[t], resolution);
      const nextLanes = this.detectLanes(timeHistory[t + 1], resolution);
      
      // Find lanes that persist or evolve predictably
      for (const currentLane of currentLanes) {
        const matchingLane = this.findMatchingLane(currentLane, nextLanes);
        if (matchingLane) {
          hyperLanes.push({
            ...currentLane,
            timeStart: t,
            timeEnd: t + 1,
            evolution: this.calculateLaneEvolution(currentLane, matchingLane),
            isHyperspace: true
          });
        }
      }
    }

    return hyperLanes;
  }

  findMatchingLane(targetLane, candidateLanes) {
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidateLanes) {
      const score = this.calculateLaneSimilarity(targetLane, candidate);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  calculateLaneSimilarity(lane1, lane2) {
    if (lane1.direction !== lane2.direction) return 0;
    
    const commonPoints = lane1.points.filter(p1 =>
      lane2.points.some(p2 => 
        Math.abs(p1.x - p2.x) <= 1 && 
        Math.abs(p1.y - p2.y) <= 1 && 
        Math.abs(p1.z - p2.z) <= 1
      )
    );

    return commonPoints.length / Math.max(lane1.length, lane2.length);
  }

  calculateLaneEvolution(lane1, lane2) {
    // Calculate how the lane has changed
    const centerOfMass1 = this.calculateCenterOfMass(lane1.points);
    const centerOfMass2 = this.calculateCenterOfMass(lane2.points);
    
    return {
      translation: {
        x: centerOfMass2.x - centerOfMass1.x,
        y: centerOfMass2.y - centerOfMass1.y,
        z: centerOfMass2.z - centerOfMass1.z
      },
      lengthChange: lane2.length - lane1.length,
      similarity: this.calculateLaneSimilarity(lane1, lane2)
    };
  }

  calculateCenterOfMass(points) {
    if (points.length === 0) return { x: 0, y: 0, z: 0 };
    
    const sum = points.reduce((acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
      z: acc.z + p.z
    }), { x: 0, y: 0, z: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      z: sum.z / points.length
    };
  }
}

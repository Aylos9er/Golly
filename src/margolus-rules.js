export class MargolusRules {
  static BBM_RULE = 'bbm'; // Billiard Ball Model
  static HPP_RULE = 'hpp'; // Hardy-de-Pazzis-Pomeau
  static CUSTOM_RULE = 'custom';

  static applyRule(block, rule = MargolusRules.BBM_RULE) {
    switch (rule) {
      case MargolusRules.BBM_RULE:
        return MargolusRules.billiardBallModel(block);
      case MargolusRules.HPP_RULE:
        return MargolusRules.hppModel(block);
      case MargolusRules.CUSTOM_RULE:
        return MargolusRules.customRule(block);
      default:
        return MargolusRules.rotateRule(block);
    }
  }

  static billiardBallModel(block) {
    // Classic BBM rule for particle interactions
    const [a, b, c, d, e, f, g, h] = block;
    
    // Collision rules for particles
    if (a && c && !b && !d && !e && !f && !g && !h) {
      return [0, 1, 0, 1, 0, 0, 0, 0]; // Head-on collision
    }
    if (b && d && !a && !c && !e && !f && !g && !h) {
      return [1, 0, 1, 0, 0, 0, 0, 0]; // Head-on collision
    }
    
    // Default: particles continue straight
    return [b, a, d, c, f, e, h, g];
  }

  static hppModel(block) {
    // Hardy-de-Pazzis-Pomeau gas model
    const [a, b, c, d, e, f, g, h] = block;
    const sum = a + b + c + d + e + f + g + h;
    
    if (sum === 2) {
      // Two particle interactions
      return MargolusRules.twoParticleCollision(block);
    }
    
    // Default rotation
    return [b, c, d, a, f, g, h, e];
  }

  static twoParticleCollision(block) {
    const [a, b, c, d, e, f, g, h] = block;
    
    // Specific two-particle collision patterns
    if (a && c && !b && !d && !e && !f && !g && !h) {
      return [0, 1, 0, 1, 0, 0, 0, 0];
    }
    if (b && d && !a && !c && !e && !f && !g && !h) {
      return [1, 0, 1, 0, 0, 0, 0, 0];
    }
    
    return block; // No collision
  }

  static customRule(block) {
    // Your custom reversible rule
    const [a, b, c, d, e, f, g, h] = block;
    const sum = a + b + c + d + e + f + g + h;
    
    // Custom logic based on local density
    if (sum === 0) return block; // Empty stays empty
    if (sum === 8) return block; // Full stays full
    
    // Rotate based on parity
    if (sum % 2 === 0) {
      return [b, c, d, a, f, g, h, e]; // Clockwise
    } else {
      return [d, a, b, c, h, e, f, g]; // Counter-clockwise
    }
  }

  static rotateRule(block) {
    // Simple rotation rule
    const rotated = [...block];
    rotated.unshift(rotated.pop());
    return rotated;
  }

  // Reverse rule application (your novel contribution)
  static reverseRule(block, rule = MargolusRules.BBM_RULE) {
    // Attempt to find the previous state that would produce this block
    // This is computationally intensive but novel
    
    for (let attempt = 0; attempt < 256; attempt++) {
      const candidate = MargolusRules.intToBlock(attempt);
      const result = MargolusRules.applyRule(candidate, rule);
      
      if (MargolusRules.blocksEqual(result, block)) {
        return candidate;
      }
    }
    
    return block; // Could not reverse
  }

  static intToBlock(n) {
    const block = [];
    for (let i = 0; i < 8; i++) {
      block.push((n >> i) & 1);
    }
    return block;
  }

  static blocksEqual(block1, block2) {
    for (let i = 0; i < 8; i++) {
      if (block1[i] !== block2[i]) return false;
    }
    return true;
  }
}

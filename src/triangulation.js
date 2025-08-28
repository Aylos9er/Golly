export class Triangulation {
  constructor() {
    this.delaunator = window.Delaunator; // From CDN
  }

  // Extract 2D slice from 3D field and triangulate
  triangulateSlice(field, resolution, sliceAxis = 'z', sliceIndex = 10) {
    const

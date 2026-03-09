import * as faceapi from "face-api.js";

let modelsLoaded = false;
let modelsLoading = false;

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model";

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) {
    // Wait for already in-progress load
    while (modelsLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return;
  }

  modelsLoading = true;
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  } finally {
    modelsLoading = false;
  }
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Extract a 128-dimension face descriptor from an image element.
 * Returns null if no face is detected.
 */
export async function extractFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ?? null;
}

/**
 * Detect all faces in an image/video and return their descriptors.
 */
export async function extractAllFaceDescriptors(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array[]> {
  const detections = await faceapi
    .detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((d) => d.descriptor);
}

/**
 * Convert Float32Array to a plain number array for JSON storage.
 */
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

/**
 * Convert stored number array back to Float32Array.
 */
export function arrayToDescriptor(arr: number[]): Float32Array {
  return new Float32Array(arr);
}

/**
 * Match a face descriptor against a database of known descriptors.
 * Returns the best match if distance is below threshold.
 */
export function findBestMatch(
  queryDescriptor: Float32Array,
  knownFaces: { studentId: string; studentName: string; descriptor: Float32Array }[],
  threshold = 0.5
): { studentId: string; studentName: string; distance: number } | null {
  let bestMatch: { studentId: string; studentName: string; distance: number } | null = null;

  for (const known of knownFaces) {
    const distance = faceapi.euclideanDistance(queryDescriptor, known.descriptor);
    if (distance < threshold && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { studentId: known.studentId, studentName: known.studentName, distance };
    }
  }

  return bestMatch;
}

/**
 * Match multiple face descriptors against known faces.
 */
export function findAllMatches(
  queryDescriptors: Float32Array[],
  knownFaces: { studentId: string; studentName: string; descriptor: Float32Array }[],
  threshold = 0.5
): { studentId: string; studentName: string; distance: number }[] {
  const matches: { studentId: string; studentName: string; distance: number }[] = [];
  const matchedIds = new Set<string>();

  for (const query of queryDescriptors) {
    const match = findBestMatch(query, knownFaces, threshold);
    if (match && !matchedIds.has(match.studentId)) {
      matches.push(match);
      matchedIds.add(match.studentId);
    }
  }

  return matches;
}

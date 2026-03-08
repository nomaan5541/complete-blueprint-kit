const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `File type ".${ext}" is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File MIME type "${file.type}" is not allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`;
  }
  return null;
}

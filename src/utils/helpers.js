export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(input) {
  if (!input) return "—";
  try {
    const d = new Date(input);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function validateFile(file) {
  if (!file) return { valid: false, error: "No file selected." };
  const extension = "." + file.name.split(".").pop().toLowerCase();
  const typeOk = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
  if (!typeOk) {
    return { valid: false, error: "Unsupported file type. Please upload a JPG, PNG, or PDF." };
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File exceeds the ${MAX_FILE_SIZE_MB}MB limit.` };
  }
  return { valid: true };
}

export function statusMeta(status) {
  switch (status) {
    case "VALID":
      return { label: "Valid", badgeClass: "badge-valid", summary: "Low risk / no significant anomalies detected" };
    case "SUSPICIOUS":
      return {
        label: "Suspicious",
        badgeClass: "badge-suspicious",
        summary: "Potential anomalies detected — manual review recommended",
      };
    case "INVALID":
      return {
        label: "Invalid",
        badgeClass: "badge-invalid",
        summary: "Strong indicators of inconsistency or manipulation detected",
      };
    case "MANUAL_REVIEW":
      return {
        label: "Manual review",
        badgeClass: "badge-unknown",
        summary: "AI could not confidently determine the result",
      };
    default:
      return { label: "Unknown", badgeClass: "badge-unknown", summary: "Insufficient information for assessment" };
  }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

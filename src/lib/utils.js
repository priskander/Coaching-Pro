/**
 * utils.js — General utility functions
 */

export function isValidFieldContent(val) {
    if (val === null || val === undefined) return false;
    const s = String(val).trim();
    if (!s || s === "-" || s === "–" || s === "—" || s === "n/a" || s === "N/A" || s === "none" || s === "None" || s === "— Select —" || s === "Select…") {
        return false;
    }
    return true;
}

export function escapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

if (typeof window !== "undefined") {
    window.isValidFieldContent = isValidFieldContent;
    window.escapeHtml = escapeHtml;
}

// hooks/getStoreId.js
export function getStoreIdFromSubdomain() {
  const host = window.location.hostname.toLowerCase();

  // Dev fallback: /store/:storeId path
  if (host.includes("localhost")) {
    const match = window.location.pathname.match(/^\/store\/([^\/]+)/);
    return match ? match[1] : null;
  }

  const parts = host.split(".");
  // e.g., velvetcakes.minimart.ng
  if (parts.length >= 3 && parts[1] === "minimart" && parts[2] === "ng") {
    return parts[0];
  }

  return null;
}

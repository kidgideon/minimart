// hooks/getStoreId.js
export function getStoreIdFromSubdomain() {
  const host = window.location.hostname.toLowerCase();

  // Dev fallback: /store/:storeId path
  if (host.includes("localhost")) {
    const match = window.location.pathname.match(/^\/store\/([^\/]+)/);
    return match ? match[1] : null;
  }

  const parts = host.split(".");

  // On production, ensure it's a subdomain like velvetcakes.minimart.ng
  if (parts.length === 3 && parts[1] === "minimart" && parts[2] === "ng") {
    const subdomain = parts[0];
    if (subdomain && subdomain !== "www" && subdomain !== "minimart") {
      return subdomain;
    }
  }

  return null;
}

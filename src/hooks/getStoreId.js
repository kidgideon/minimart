export const getStoreIdFromSubdomain = () => {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) return parts[0]; // e.g. "velvetcakes"
  return null;
};

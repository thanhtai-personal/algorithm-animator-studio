export const getAuthDeviceDescriptor = () => {
  if (typeof navigator === "undefined") {
    return "web";
  }
  const platform = navigator.platform ?? "web";
  const userAgent = navigator.userAgent ?? "unknown";
  return `${platform}|${userAgent}`;
};

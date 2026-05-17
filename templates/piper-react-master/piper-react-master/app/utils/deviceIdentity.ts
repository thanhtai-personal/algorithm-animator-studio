export type DeviceIdentity = {
  deviceId: string;
  deviceName: string;
  machineName: string;
  nameChanged: boolean;
};

const DEVICE_ID_KEY = "kata.studio.deviceId";
const DEVICE_NAME_KEY = "kata.studio.deviceName";
const MACHINE_NAME_KEY = "kata.studio.machineName";
const NAME_CHANGED_KEY = "kata.studio.deviceNameChanged";

export function getDeviceIdentity(): DeviceIdentity {
  const deviceId = getOrCreateDeviceId();
  const machineName = getStoredValue(MACHINE_NAME_KEY) || detectDefaultMachineName();
  const deviceName = getStoredValue(DEVICE_NAME_KEY) || machineName;
  const nameChanged = getStoredValue(NAME_CHANGED_KEY) === "true";

  storeValue(MACHINE_NAME_KEY, machineName);
  storeValue(DEVICE_NAME_KEY, deviceName);

  return { deviceId, deviceName, machineName, nameChanged };
}

export function saveDeviceIdentity(identity: Partial<DeviceIdentity>) {
  if (identity.deviceName !== undefined) storeValue(DEVICE_NAME_KEY, identity.deviceName);
  if (identity.machineName !== undefined) storeValue(MACHINE_NAME_KEY, identity.machineName);
  if (identity.nameChanged !== undefined) storeValue(NAME_CHANGED_KEY, String(identity.nameChanged));
}

export function getOrCreateDeviceId(): string {
  const existing = getStoredValue(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  storeValue(DEVICE_ID_KEY, id);
  return id;
}

function detectDefaultMachineName(): string {
  if (typeof navigator === "undefined") return "Local device";

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || "Local";
  return `${platform} device`;
}

function getStoredValue(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

function storeValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

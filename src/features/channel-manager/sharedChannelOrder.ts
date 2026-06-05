import { channelKey, type SharedChannelItem } from "./SharedChannelSidebar";

const SHARED_CHANNEL_ORDER_STORAGE_KEY = "kai-studio:shared-channel-order:v1";

export function orderSharedChannels(channels: SharedChannelItem[], order: string[]) {
  if (!order.length) return channels;
  const indexByKey = new Map(order.map((key, index) => [key, index]));
  return [...channels].sort((left, right) => {
    const leftIndex = indexByKey.get(channelKey(left));
    const rightIndex = indexByKey.get(channelKey(right));
    if (leftIndex === undefined && rightIndex === undefined) return 0;
    if (leftIndex === undefined) return 1;
    if (rightIndex === undefined) return -1;
    return leftIndex - rightIndex;
  });
}

export function readSharedChannelOrder() {
  try {
    const rawValue = window.localStorage.getItem(SHARED_CHANNEL_ORDER_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export function writeSharedChannelOrder(order: string[]) {
  window.localStorage.setItem(SHARED_CHANNEL_ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function moveSharedChannelKey(keys: string[], draggedKey: string, targetKey: string) {
  const fromIndex = keys.indexOf(draggedKey);
  const toIndex = keys.indexOf(targetKey);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return keys;

  const nextKeys = [...keys];
  const [movedKey] = nextKeys.splice(fromIndex, 1);
  nextKeys.splice(toIndex, 0, movedKey);
  return nextKeys;
}

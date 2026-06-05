import { useMemo, useRef, useState } from "react";
import { channelKey, type SharedChannelItem } from "./SharedChannelSidebar";
import { moveSharedChannelKey, orderSharedChannels, readSharedChannelOrder, writeSharedChannelOrder } from "./sharedChannelOrder";

export function useSharedChannelOrder(rawChannels: SharedChannelItem[]) {
  const [channelOrder, setChannelOrder] = useState<string[]>(() => readSharedChannelOrder());
  const dragStartOrderRef = useRef<string[] | null>(null);
  const dragCommittedRef = useRef(false);
  const latestPreviewOrderRef = useRef<string[]>([]);
  const channels = useMemo(() => orderSharedChannels(rawChannels, channelOrder), [channelOrder, rawChannels]);

  function startReorder() {
    const currentOrder = channels.map(channelKey);
    dragStartOrderRef.current = currentOrder;
    latestPreviewOrderRef.current = currentOrder;
    dragCommittedRef.current = false;
  }

  function previewReorder(draggedKey: string, targetKey: string) {
    setChannelOrder((currentOrder) => {
      const currentKeys = orderSharedChannels(rawChannels, currentOrder).map(channelKey);
      const nextOrder = moveSharedChannelKey(currentKeys, draggedKey, targetKey);
      latestPreviewOrderRef.current = nextOrder;
      return nextOrder;
    });
  }

  function commitReorder() {
    const nextOrder = latestPreviewOrderRef.current.length ? latestPreviewOrderRef.current : channels.map(channelKey);
    dragCommittedRef.current = true;
    dragStartOrderRef.current = null;
    setChannelOrder(nextOrder);
    writeSharedChannelOrder(nextOrder);
  }

  function cancelReorder() {
    if (!dragCommittedRef.current && dragStartOrderRef.current) {
      setChannelOrder(dragStartOrderRef.current);
    }
    dragCommittedRef.current = false;
    dragStartOrderRef.current = null;
  }

  return { cancelReorder, channels, commitReorder, previewReorder, startReorder };
}

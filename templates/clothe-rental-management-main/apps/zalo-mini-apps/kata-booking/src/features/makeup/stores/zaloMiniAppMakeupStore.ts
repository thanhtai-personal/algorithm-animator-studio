import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppMakeupEventDto } from "@/features/makeup/types/makeup";

class ZaloMiniAppMakeupStore {
  createdEvents: ZaloMiniAppMakeupEventDto[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  hydrateCreatedEvent(event: ZaloMiniAppMakeupEventDto): void {
    const existingIndex = this.createdEvents.findIndex((entry) => entry.id === event.id);
    if (existingIndex >= 0) {
      this.createdEvents[existingIndex] = event;
      return;
    }

    this.createdEvents = [event, ...this.createdEvents];
  }

  get lastCreatedEvent(): ZaloMiniAppMakeupEventDto | null {
    return this.createdEvents[0] ?? null;
  }
}

export const zaloMiniAppMakeupStore = new ZaloMiniAppMakeupStore();

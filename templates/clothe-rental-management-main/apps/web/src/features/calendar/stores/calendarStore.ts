import { makeAutoObservable } from "mobx";
import type { CalendarEventsResponse } from "@/types/calendarModule";

class CalendarStore {
  private static _instance: CalendarStore | null = null;

  private _eventsPayload: CalendarEventsResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new CalendarStore();
    }

    return this._instance;
  }

  get eventsPayload(): CalendarEventsResponse | null {
    return this._eventsPayload;
  }

  hydrateEvents(payload: CalendarEventsResponse): void {
    this._eventsPayload = payload;
  }

  clear(): void {
    this._eventsPayload = null;
  }
}

export const calendarStore = CalendarStore.getInstance();

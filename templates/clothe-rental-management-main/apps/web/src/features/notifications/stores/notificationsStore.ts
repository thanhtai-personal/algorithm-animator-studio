import { makeAutoObservable } from "mobx";
import type { NotificationItemDto, NotificationsListResponse } from "@/types/notificationsModule";

class NotificationsStore {
  private static _instance: NotificationsStore | null = null;

  private _listItems: NotificationItemDto[] = [];
  private _unreadCount = 0;
  private _nextCursor: string | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new NotificationsStore();
    }

    return this._instance;
  }

  get listItems(): NotificationItemDto[] {
    return this._listItems;
  }

  get unreadCount(): number {
    return this._unreadCount;
  }

  get nextCursor(): string | null {
    return this._nextCursor;
  }

  hydrateList(payload: NotificationsListResponse, options?: { append?: boolean }): void {
    const append = options?.append ?? false;

    if (!append) {
      this._listItems = payload.items;
    } else {
      const merged = [...this._listItems];
      const known = new Set(merged.map((item) => item.id));
      for (const item of payload.items) {
        if (!known.has(item.id)) {
          merged.push(item);
          known.add(item.id);
        }
      }
      this._listItems = merged;
    }

    this._unreadCount = payload.unreadCount;
    this._nextCursor = payload.nextCursor;
  }

  replaceFromPages(pages: NotificationsListResponse[]): void {
    const merged: NotificationItemDto[] = [];
    const known = new Set<string>();

    for (const page of pages) {
      for (const item of page.items) {
        if (known.has(item.id)) continue;
        known.add(item.id);
        merged.push(item);
      }
    }

    this._listItems = merged;
    this._unreadCount = pages[0]?.unreadCount ?? 0;
    this._nextCursor = pages[pages.length - 1]?.nextCursor ?? null;
  }

  upsertListItem(item: NotificationItemDto): void {
    const index = this._listItems.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const next = [...this._listItems];
      next[index] = item;
      this._listItems = next;
      return;
    }

    this._listItems = [item, ...this._listItems];
  }

  setUnreadCount(count: number): void {
    this._unreadCount = Math.max(0, Math.floor(count));
  }

  markAllAsRead(): void {
    this._listItems = this._listItems.map((item) => ({
      ...item,
      isRead: true,
      readAt: item.readAt ?? new Date().toISOString(),
    }));
    this._unreadCount = 0;
  }

  clear(): void {
    this._listItems = [];
    this._unreadCount = 0;
    this._nextCursor = null;
  }
}

export const notificationsStore = NotificationsStore.getInstance();

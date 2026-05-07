

import { makeAutoObservable } from "mobx";
import type { CategoryRow } from "@/features/categories/types";
import storageAdapter from "@/lib/storageAdapter";

class CategoryStore {
  categories: CategoryRow[] = [];

  private static _instance: CategoryStore | null = null;
  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): CategoryStore {
    if (!CategoryStore._instance) {
      CategoryStore._instance = new CategoryStore();
    }
    return CategoryStore._instance;
  }

  get userId(): string | null {
    return storageAdapter.getAnonId() || storageAdapter.getUserId();
  }
  
  // Map of category id to CategoryRow for fast lookup
  categoryMap: Record<string, CategoryRow> = {};

  private updateCategoryMap() {
    this.categoryMap = this.categories.reduce((map, cat) => {
      map[cat.id] = cat;
      return map;
    }, {} as Record<string, CategoryRow>);
  }

  get storageUserId(): string | null {
    return this.userId;
  }

  load(): void {
    const userId = this.storageUserId;
    if (!userId) {
      this.categories = [];
      this.updateCategoryMap();
      return;
    }
    const arr = storageAdapter.getCategories(userId) as CategoryRow[] | null;
    if (!arr) {
      this.categories = [];
      this.updateCategoryMap();
      return;
    }
    this.categories = arr;
    this.updateCategoryMap();
  }

  write(categories: CategoryRow[]): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.categories = categories;
    this.updateCategoryMap();
    storageAdapter.setCategories(userId, categories);
  }

  findById(id: string): CategoryRow | undefined {
    return this.categoryMap[id];
  }

  upsert(category: CategoryRow): void {
    const userId = this.storageUserId;
    if (!userId) return;
    const idx = this.categories.findIndex((item) => item.id === category.id);
    if (idx !== -1) {
      this.categories[idx] = category;
    } else {
      this.categories.push(category);
    }
    this.categories = this.categories.slice();
    this.updateCategoryMap();
    storageAdapter.setCategories(userId, this.categories);
  }

  remove(id: string): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.categories = this.categories.filter((item) => item.id !== id);
    this.updateCategoryMap();
    storageAdapter.setCategories(userId, this.categories);
  }

  clear(): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.categories = [];
    this.updateCategoryMap();
    storageAdapter.setCategories(userId, []);
  }

  clearForUser(userId: string): void {
    this.categories = [];
    this.updateCategoryMap();
    storageAdapter.setCategories(userId, []);
  }
}

export const categoryStore = CategoryStore.getInstance();

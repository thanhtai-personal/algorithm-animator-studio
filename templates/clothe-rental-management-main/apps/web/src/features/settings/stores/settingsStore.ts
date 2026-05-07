import { makeAutoObservable } from "mobx";
import type {
  SalesShiftDetailResponse,
  SalesShiftListResponse,
} from "@/types/salesDesk";
import type {
  SettingsBranchesResponse,
  SettingsGeneralResponse,
  SettingsManagedProductCategoryDto,
  SettingsProductCategoriesResponse,
  SettingsShowroomPagesResponse,
  SettingsShowroomDto,
  SettingsShowroomsResponse,
  SettingsUserRowDto,
  SettingsUsersResponse,
} from "@/types/settingsModule";

class SettingsStore {
  private static _instance: SettingsStore | null = null;

  private _general: SettingsGeneralResponse | null = null;
  private _showroomPages: SettingsShowroomPagesResponse | null = null;
  private _showrooms: SettingsShowroomsResponse | null = null;
  private _productCategories: SettingsProductCategoriesResponse | null = null;
  private _users: SettingsUsersResponse | null = null;
  private _branches: SettingsBranchesResponse | null = null;
  private _shifts: SalesShiftListResponse | null = null;
  private _shiftDetail: SalesShiftDetailResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new SettingsStore();
    }

    return this._instance;
  }

  get general(): SettingsGeneralResponse | null {
    return this._general;
  }

  get showroomPages(): SettingsShowroomPagesResponse | null {
    return this._showroomPages;
  }

  get users(): SettingsUsersResponse | null {
    return this._users;
  }

  get showrooms(): SettingsShowroomsResponse | null {
    return this._showrooms;
  }

  get productCategories(): SettingsProductCategoriesResponse | null {
    return this._productCategories;
  }

  get branches(): SettingsBranchesResponse | null {
    return this._branches;
  }

  get shifts(): SalesShiftListResponse | null {
    return this._shifts;
  }

  get shiftDetail(): SalesShiftDetailResponse | null {
    return this._shiftDetail;
  }

  hydrateGeneral(payload: SettingsGeneralResponse): void {
    this._general = payload;
  }

  hydrateShowroomPages(payload: SettingsShowroomPagesResponse): void {
    this._showroomPages = payload;
  }

  hydrateShowrooms(payload: SettingsShowroomsResponse): void {
    this._showrooms = payload;
  }

  hydrateProductCategories(payload: SettingsProductCategoriesResponse): void {
    this._productCategories = payload;
  }

  hydrateUsers(payload: SettingsUsersResponse): void {
    this._users = payload;
  }

  hydrateBranches(payload: SettingsBranchesResponse): void {
    this._branches = payload;
  }

  hydrateShifts(payload: SalesShiftListResponse): void {
    this._shifts = payload;
  }

  hydrateShiftDetail(payload: SalesShiftDetailResponse): void {
    this._shiftDetail = payload;
  }

  upsertUser(user: SettingsUserRowDto): void {
    if (!this._users) return;

    const index = this._users.items.findIndex((entry) => entry.profileId === user.profileId);
    const nextItems = [...this._users.items];

    if (index >= 0) {
      nextItems[index] = user;
    } else {
      nextItems.unshift(user);
    }

    this._users = {
      ...this._users,
      items: nextItems,
    };
  }

  upsertBranch(branch: SettingsBranchesResponse["items"][number]): void {
    if (!this._branches) return;

    const index = this._branches.items.findIndex((entry) => entry.id === branch.id);
    const nextItems = [...this._branches.items];

    if (index >= 0) {
      nextItems[index] = branch;
    } else {
      nextItems.push(branch);
    }

    this._branches = {
      items: nextItems,
    };
  }

  upsertShowroom(showroom: SettingsShowroomDto): void {
    if (!this._showrooms) return;

    const index = this._showrooms.items.findIndex((entry) => entry.id === showroom.id);
    const nextItems = [...this._showrooms.items];

    if (index >= 0) {
      nextItems[index] = showroom;
    } else {
      nextItems.push(showroom);
    }

    nextItems.sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return a.name.localeCompare(b.name);
      }
      return a.isDefault ? -1 : 1;
    });

    this._showrooms = {
      ...this._showrooms,
      items: nextItems,
    };
  }

  removeShowroom(showroomId: string): void {
    if (!this._showrooms) return;

    this._showrooms = {
      ...this._showrooms,
      items: this._showrooms.items.filter((entry) => entry.id !== showroomId),
    };
  }

  upsertProductCategory(category: SettingsManagedProductCategoryDto): void {
    if (!this._productCategories) return;
    if (category.branchId && category.branchId !== this._productCategories.branchId) return;

    const index = this._productCategories.items.findIndex((entry) => entry.id === category.id);
    const nextItems = [...this._productCategories.items];

    if (index >= 0) {
      nextItems[index] = category;
    } else {
      nextItems.push(category);
    }

    nextItems.sort((a, b) => {
      if (a.sortOrder === b.sortOrder) {
        return a.name.localeCompare(b.name);
      }
      return a.sortOrder - b.sortOrder;
    });

    this._productCategories = {
      ...this._productCategories,
      items: nextItems,
    };
  }

  removeProductCategory(productCategoryId: string): void {
    if (!this._productCategories) return;

    this._productCategories = {
      ...this._productCategories,
      items: this._productCategories.items.filter((entry) => entry.id !== productCategoryId),
    };
  }

  clear(): void {
    this._general = null;
    this._showroomPages = null;
    this._showrooms = null;
    this._productCategories = null;
    this._users = null;
    this._branches = null;
    this._shifts = null;
    this._shiftDetail = null;
  }
}

export const settingsStore = SettingsStore.getInstance();

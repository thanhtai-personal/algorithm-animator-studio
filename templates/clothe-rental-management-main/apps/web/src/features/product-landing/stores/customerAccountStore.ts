import { makeAutoObservable } from "mobx";
import type { CustomerAccountProfileDto } from "@/types/customerAccount";

class CustomerAccountStore {
  private static _instance: CustomerAccountStore | null = null;

  private _profile: CustomerAccountProfileDto | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new CustomerAccountStore();
    }

    return this._instance;
  }

  get profile(): CustomerAccountProfileDto | null {
    return this._profile;
  }

  hydrateProfile(profile: CustomerAccountProfileDto | null): void {
    this._profile = profile;
  }

  clear(): void {
    this._profile = null;
  }
}

export const customerAccountStore = CustomerAccountStore.getInstance();

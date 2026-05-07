export interface CustomerAccountProfileDto {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  locale: "vi" | "en" | null;
  isActive: boolean;
}

export interface CustomerAccountProfileResponse {
  profile: CustomerAccountProfileDto;
}

export interface UpdateCustomerAccountProfilePayload {
  fullName?: string;
  email?: string;
  phone?: string;
}

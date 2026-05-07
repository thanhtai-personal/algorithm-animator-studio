import { NextRequest } from "next/server";
import {
  handleGetCustomerAccountProfile,
  handlePatchCustomerAccountProfile,
} from "@/server/services/customerAccountService";

export async function GET(request: NextRequest) {
  return handleGetCustomerAccountProfile(request);
}

export async function PATCH(request: NextRequest) {
  return handlePatchCustomerAccountProfile(request);
}

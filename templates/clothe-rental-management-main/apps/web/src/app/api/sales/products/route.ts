import { NextRequest } from "next/server";
import {
  handleCreateSalesProductEntry,
  handleGetSalesProducts,
} from "@/server/services/productsService";

export async function GET(request: NextRequest) {
  return handleGetSalesProducts(request);
}

export async function POST(request: NextRequest) {
  return handleCreateSalesProductEntry(request);
}

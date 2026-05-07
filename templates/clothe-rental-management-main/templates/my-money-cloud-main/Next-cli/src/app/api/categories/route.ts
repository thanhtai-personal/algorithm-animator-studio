import { NextRequest } from "next/server";
import { handleCreateCategory, handleListCategories } from "@/server/services/categoryService";

export async function GET(request: NextRequest) {
  return handleListCategories(request);
}

export async function POST(request: NextRequest) {
  return handleCreateCategory(request);
}

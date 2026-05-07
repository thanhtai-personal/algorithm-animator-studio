import { NextRequest } from "next/server";
import { handleDeleteCategory, handleUpdateCategory } from "@/server/services/categoryService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return handleDeleteCategory(request, id);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return handleUpdateCategory(request, id);
}

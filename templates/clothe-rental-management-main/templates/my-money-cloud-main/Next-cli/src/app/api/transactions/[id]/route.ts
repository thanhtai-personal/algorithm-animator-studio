import { NextRequest } from "next/server";
import { handleDeleteTransaction, handleUpdateTransaction } from "@/server/services/transactionService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return handleUpdateTransaction(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return handleDeleteTransaction(request, id);
}

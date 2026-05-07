import { NextRequest } from "next/server";
import { handleCreateTransaction, handleListTransactions } from "@/server/services/transactionService";

export async function GET(request: NextRequest) {
  return handleListTransactions(request);
}

export async function POST(request: NextRequest) {
  return handleCreateTransaction(request);
}

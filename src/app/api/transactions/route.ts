import { NextResponse } from "next/server";
import { mockTransactions } from "@/mocks/transactions";

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return NextResponse.json({ transactions: mockTransactions });
}

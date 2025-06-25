import { NextResponse } from 'next/server'
import { getUserWithdrawalOrdersAction } from '@/src/lib/withdrawalActions'

export async function POST(request: Request) {
  const body = await request.json();
  const { current = 1, pageSize = 10 } = body;
  const result = await getUserWithdrawalOrdersAction({ current, pageSize });
  return NextResponse.json(result);
}
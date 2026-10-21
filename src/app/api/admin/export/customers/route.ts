import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/export/customers
 * Streams all customers as a CSV file. Admin only.
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  const userIds = users.map((u) => u.id);
  const spendRows = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, status: 'PAID' },
    _sum: { totalAmountZAR: true },
  });
  const spendMap = new Map(spendRows.map((r) => [r.userId, r._sum.totalAmountZAR ?? 0]));

  const headers = ['User ID', 'Name', 'Email', 'Role', 'Joined', 'Total Orders', 'Total Spent (ZAR)'];

  const rows = users.map((u) => [
    u.id,
    u.name ?? '',
    u.email,
    u.role,
    u.createdAt.toISOString(),
    u._count.orders,
    ((spendMap.get(u.id) ?? 0) / 100).toFixed(2),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lusso-customers-${date}.csv"`,
    },
  });
}

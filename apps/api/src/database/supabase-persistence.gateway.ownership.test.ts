import { describe, expect, it } from 'vitest';
import { SupabasePersistenceGateway } from './supabase-persistence.gateway';

type QueryCall = {
  table: string;
  op: string;
  args: unknown[];
};

class QueryRecorder {
  constructor(
    private readonly table: string,
    private readonly calls: QueryCall[],
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'select', args });
    return this;
  }

  update(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'update', args });
    return this;
  }

  delete(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'delete', args });
    return this;
  }

  eq(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'eq', args });
    return this;
  }

  in(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'in', args });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'order', args });
    return this;
  }

  limit(...args: unknown[]) {
    this.calls.push({ table: this.table, op: 'limit', args });
    return this;
  }

  maybeSingle() {
    this.calls.push({ table: this.table, op: 'maybeSingle', args: [] });
    return Promise.resolve({ data: null, error: null });
  }

  then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
  }
}

function makeGateway() {
  const calls: QueryCall[] = [];
  const client = {
    from(table: string) {
      calls.push({ table, op: 'from', args: [table] });
      return new QueryRecorder(table, calls);
    },
  };

  return {
    calls,
    gateway: new SupabasePersistenceGateway(client as never),
  };
}

function expectOwnerFilter(calls: QueryCall[], table: string, ownerUserId: string): void {
  expect(calls).toContainEqual({
    table,
    op: 'eq',
    args: ['owner_user_id', ownerUserId],
  });
}

describe('SupabasePersistenceGateway ownership scoping', () => {
  const ownerUserId = '11111111-1111-4111-8111-111111111111';

  it('scopes chart/detail related reads by owner_user_id', async () => {
    const { gateway, calls } = makeGateway();

    await gateway.findChartSnapshotById(ownerUserId, 'chart-1');
    await gateway.findChartSnapshotsByIds(ownerUserId, ['chart-1', 'chart-2']);
    await gateway.findDivinationContextBySnapshotId(ownerUserId, 'chart-1');
    await gateway.findDivinationContextsByChartIds(ownerUserId, ['chart-1', 'chart-2']);

    expectOwnerFilter(calls, 'chart_snapshots', ownerUserId);
    expectOwnerFilter(calls, 'divination_context', ownerUserId);
  });

  it('scopes explanation reads and state transitions by owner_user_id', async () => {
    const { gateway, calls } = makeGateway();

    await gateway.findExplanationRequestByIdempotencyKey(ownerUserId, 'idem-1');
    await gateway.updateExplanationRequest({
      ownerUserId,
      requestId: 'request-1',
      requestState: 'running',
    }).catch(() => undefined);
    await gateway.tryClaimExplanationRequest({
      ownerUserId,
      requestId: 'request-1',
      expectedUpdatedAt: '2026-07-13T00:00:00.000Z',
      nextState: 'pending',
    });
    await gateway.findExplanationResultByRequestId(ownerUserId, 'request-1');
    await gateway.listExplanationResultsForChart(ownerUserId, 'chart-1');
    await gateway.findExplanationResultsByIds(ownerUserId, ['result-1', 'result-2']);

    expectOwnerFilter(calls, 'explanation_requests', ownerUserId);
    expectOwnerFilter(calls, 'explanation_results', ownerUserId);
  });

  it('scopes history, vision, conversations, and annual reports by owner_user_id', async () => {
    const { gateway, calls } = makeGateway();

    await gateway.listHistoryViews(ownerUserId, 20);
    await gateway.findVisionResultsByIds(ownerUserId, ['vision-1']);
    await gateway.findVisionResultById(ownerUserId, 'vision-1');
    await gateway.deleteVisionResult(ownerUserId, 'vision-1');
    await gateway.listConversationsForChart(ownerUserId, 'chart-1');
    await gateway.findConversationById(ownerUserId, 'conversation-1');
    await gateway.listRecentConversationMessages(ownerUserId, 'conversation-1', 20);
    await gateway.findAnnualReportByChartAndYear(ownerUserId, 'chart-1', 2026);

    expectOwnerFilter(calls, 'history_views', ownerUserId);
    expectOwnerFilter(calls, 'vision_results', ownerUserId);
    expectOwnerFilter(calls, 'conversations', ownerUserId);
    expectOwnerFilter(calls, 'conversation_messages', ownerUserId);
    expectOwnerFilter(calls, 'annual_reports', ownerUserId);
  });
});

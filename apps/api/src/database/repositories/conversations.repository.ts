import { Injectable } from '@nestjs/common';
import { type ConversationRecord, type ConversationMessageRecord } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toConversationRecord, toConversationMessageRecord, type SupabaseRow } from '../persistence-mappers';

const MAX_CONVERSATIONS_PER_CHART = 200;

@Injectable()
export class ConversationsRepository extends SupabaseBaseRepository {
  async createConversation(params: {
    ownerUserId: string;
    chartSnapshotId: string;
    title?: string | null;
  }): Promise<ConversationRecord> {
    const { data, error } = await this.client
      .from('conversations')
      .insert({
        owner_user_id: params.ownerUserId,
        chart_snapshot_id: params.chartSnapshotId,
        title: params.title ?? null,
        status: 'active',
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toConversationRecord(data);
  }

  async listConversationsForChart(ownerUserId: string, chartSnapshotId: string): Promise<ConversationRecord[]> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('chart_snapshot_id', chartSnapshotId)
      .order('created_at', { ascending: false })
      .limit(MAX_CONVERSATIONS_PER_CHART);
    this.throwIfError(error);
    return (data ?? []).map((row: SupabaseRow) => toConversationRecord(row));
  }

  async findConversationById(ownerUserId: string, conversationId: string): Promise<ConversationRecord | null> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', conversationId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toConversationRecord(data) : null;
  }

  async createConversationMessage(params: {
    ownerUserId: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    quickPromptKey?: string | null;
    providerName?: string | null;
    providerMetadata?: Record<string, string>;
  }): Promise<ConversationMessageRecord> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .insert({
        owner_user_id: params.ownerUserId,
        conversation_id: params.conversationId,
        role: params.role,
        content: params.content,
        quick_prompt_key: params.quickPromptKey ?? null,
        provider_name: params.providerName ?? null,
        provider_metadata: params.providerMetadata ?? {},
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toConversationMessageRecord(data);
  }

  async listRecentConversationMessages(ownerUserId: string, conversationId: string, limit: number): Promise<ConversationMessageRecord[]> {
    const { data, error } = await this.client
      .from('conversation_messages')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    this.throwIfError(error);
    const records = (data ?? []).map((row: SupabaseRow) => toConversationMessageRecord(row));
    return records.reverse();
  }

  async countConversationUserMessagesSince(ownerUserId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .eq('role', 'user')
      .gte('created_at', sinceIso);
    this.throwIfError(error);
    return count ?? 0;
  }
}

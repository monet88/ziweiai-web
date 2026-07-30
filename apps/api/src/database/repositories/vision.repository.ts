import { Injectable } from '@nestjs/common';
import { type VisionResultRecord, type VisionKind } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toVisionResultRecord, type SupabaseRow } from '../persistence-mappers';

@Injectable()
export class VisionRepository extends SupabaseBaseRepository {
  async createVisionResult(params: {
    ownerUserId: string;
    kind: VisionKind;
    imagePath: string;
    question: string | null;
    renderedMarkdown: string;
    providerMetadata: Record<string, string>;
  }): Promise<VisionResultRecord> {
    const { data, error } = await this.client
      .from('vision_results')
      .insert({
        owner_user_id: params.ownerUserId,
        kind: params.kind,
        image_path: params.imagePath,
        question: params.question,
        rendered_markdown: params.renderedMarkdown,
        provider_metadata: params.providerMetadata,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toVisionResultRecord(data);
  }

  async findVisionResultsByIds(ownerUserId: string, visionResultIds: string[]): Promise<Record<string, VisionResultRecord>> {
    if (visionResultIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(visionResultIds)];
    const { data, error } = await this.client
      .from('vision_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('id', uniqueIds);
    this.throwIfError(error);

    return Object.fromEntries(
      (data ?? []).map((row: SupabaseRow) => {
        const record = toVisionResultRecord(row);
        return [record.id, record];
      }),
    );
  }

  async findVisionResultById(ownerUserId: string, visionResultId: string): Promise<VisionResultRecord | null> {
    const { data, error } = await this.client
      .from('vision_results')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', visionResultId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toVisionResultRecord(data) : null;
  }

  async deleteVisionResult(ownerUserId: string, visionResultId: string): Promise<void> {
    const { error } = await this.client
      .from('vision_results')
      .delete()
      .eq('owner_user_id', ownerUserId)
      .eq('id', visionResultId);
    this.throwIfError(error);
  }
}

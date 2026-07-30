import { Injectable } from '@nestjs/common';
import { type BirthInput, type BirthProfileRecord, type ChartSnapshot, type ChartSnapshotRecord, type NormalizedBirth } from '@ziweiai/contracts';
import { SupabaseBaseRepository } from './supabase-base.repository';
import { toBirthProfileRecord, toChartSnapshotRecord, type SupabaseRow } from '../persistence-mappers';

@Injectable()
export class ChartsRepository extends SupabaseBaseRepository {
  async findLatestBirthProfileByInputHash(ownerUserId: string, inputHashDigest: string): Promise<BirthProfileRecord | null> {
    const { data, error } = await this.client
      .from('birth_profiles')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('input_hash_digest', inputHashDigest)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
    this.throwIfError(error);
    return data && data[0] ? toBirthProfileRecord(data[0]) : null;
  }

  async createBirthProfile(params: {
    ownerUserId: string;
    rawBirthInput: BirthInput;
    normalizedBirth: NormalizedBirth;
    inputHashDigest: string;
    isActive: boolean;
  }): Promise<BirthProfileRecord> {
    if (params.isActive) {
      const { error: deactivateError } = await this.client
        .from('birth_profiles')
        .update({ is_active: false })
        .eq('owner_user_id', params.ownerUserId)
        .is('deleted_at', null);
      this.throwIfError(deactivateError);
    }

    const { data, error } = await this.client
      .from('birth_profiles')
      .insert({
        owner_user_id: params.ownerUserId,
        is_active: params.isActive,
        raw_birth_input_json: params.rawBirthInput,
        normalized_birth_json: params.normalizedBirth,
        input_hash_digest: params.inputHashDigest,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toBirthProfileRecord(data);
  }

  async findChartSnapshotByDedupeKey(ownerUserId: string, snapshotDedupeKey: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('snapshot_dedupe_key', snapshotDedupeKey)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
  }

  async findChartSnapshotById(ownerUserId: string, chartSnapshotId: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('id', chartSnapshotId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
  }

  async findPublicChartSnapshotById(chartSnapshotId: string): Promise<ChartSnapshotRecord | null> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('id', chartSnapshotId)
      .maybeSingle();
    this.throwIfError(error);
    return data ? toChartSnapshotRecord(data) : null;
  }

  async findChartSnapshotsByIds(ownerUserId: string, chartSnapshotIds: string[]): Promise<Record<string, ChartSnapshotRecord>> {
    if (chartSnapshotIds.length === 0) {
      return {};
    }

    const uniqueIds = [...new Set(chartSnapshotIds)];
    const { data, error } = await this.client
      .from('chart_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .in('id', uniqueIds);
    this.throwIfError(error);

    return Object.fromEntries(
      (data ?? []).map((row: SupabaseRow) => {
        const record = toChartSnapshotRecord(row);
        return [record.id, record];
      }),
    );
  }

  async createChartSnapshot(params: {
    ownerUserId: string;
    birthProfileId: string | null;
    snapshotDedupeKey: string;
    snapshot: ChartSnapshot;
  }): Promise<ChartSnapshotRecord> {
    const { data, error } = await this.client
      .from('chart_snapshots')
      .insert({
        owner_user_id: params.ownerUserId,
        birth_profile_id: params.birthProfileId,
        chart_system: params.snapshot.chartSystem,
        snapshot_dedupe_key: params.snapshotDedupeKey,
        chart_snapshot_json: params.snapshot,
        engine_package: params.snapshot.engineVersion.enginePackage,
        engine_semver: params.snapshot.engineVersion.engineSemver,
        rule_source_name: params.snapshot.ruleSource.canonicalLibrary.name,
        rule_source_version: params.snapshot.ruleSource.canonicalLibrary.version,
        input_hash_digest: params.snapshot.inputHash.digest,
        confidence_level: params.snapshot.calculationConfidence.level,
      })
      .select('*')
      .single();
    this.throwIfError(error);
    return toChartSnapshotRecord(data);
  }

  async countChartSnapshotsSince(ownerUserId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.client
      .from('chart_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)
      .gte('created_at', sinceIso);
    this.throwIfError(error);
    return count ?? 0;
  }
}

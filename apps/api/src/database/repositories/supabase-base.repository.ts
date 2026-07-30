import { Inject } from '@nestjs/common';
import { type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase-client';

export abstract class SupabaseBaseRepository {
  constructor(@Inject(SUPABASE_CLIENT) protected readonly client: SupabaseClient) {}

  protected throwIfError(error: { message: string; code?: string } | null): void {
    if (error) {
      throw new Error(error.message);
    }
  }
}

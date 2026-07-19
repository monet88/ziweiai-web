import { PipeTransform, Injectable, ArgumentMetadata, HttpStatus } from '@nestjs/common';
import { ZodType, ZodError } from 'zod';
import { ApiErrorHttpException } from '../http/api-error';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private schema: ZodType<any>,
    private customMessage?: string,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        if (this.customMessage) {
          throw new ApiErrorHttpException(HttpStatus.BAD_REQUEST, 'INVALID_INPUT', this.customMessage);
        }
        // Let ApiErrorFilter handle this
        throw error;
      }
      throw error;
    }
  }
}

import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { mbtiQuizRequestSchema, type AuthenticatedUser, type MbtiResult } from '@ziweiai/contracts';
import { ApiErrorHttpException } from '../../common/http/api-error';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { QuizzesMbtiService } from './quizzes-mbti.service';

@Controller('quizzes/mbti')
export class QuizzesMbtiController {
  constructor(private readonly service: QuizzesMbtiService) {}

  @Post()
  @HttpCode(200)
  async submit(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<MbtiResult> {
    const input = mbtiQuizRequestSchema.safeParse(body);
    if (!input.success) {
      throw new ApiErrorHttpException(
        HttpStatus.BAD_REQUEST,
        'INVALID_INPUT',
        input.error.issues[0]?.message ?? 'Dữ liệu trắc nghiệm không hợp lệ.',
        request.requestId ?? null,
      );
    }

    return this.service.submitQuiz(currentUser, request.ip ?? 'unknown', input.data.answers);
  }
}

import { Langfuse, LangfuseTraceClient } from 'langfuse-node';
import { Logger } from '@nestjs/common';
import { 
  AiConversationProvider, 
  ConversationPromptPayload, 
  ConversationProviderResult, 
  ExplanationPromptPayload, 
  ExplanationProviderResult 
} from './ai-explanation-provider';

export class LangfuseAiProviderWrapper implements AiConversationProvider {
  private readonly langfuse: Langfuse | null = null;
  private readonly logger = new Logger(LangfuseAiProviderWrapper.name);

  generateConversationStream?: (
    payload: ConversationPromptPayload,
    signal?: AbortSignal,
  ) => AsyncGenerator<string, ConversationProviderResult, void>;

  generateExplanationStream?: (
    payload: ExplanationPromptPayload,
    signal?: AbortSignal,
  ) => AsyncGenerator<string, ExplanationProviderResult, void>;

  constructor(private readonly delegate: AiConversationProvider) {
    // Only initialize Langfuse if keys are present
    if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
      this.langfuse = new Langfuse({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        baseUrl: process.env.LANGFUSE_BASEURL || 'https://us.cloud.langfuse.com',
      });
      
      this.langfuse.on('error', (error: Error) => {
        this.logger.error(`Langfuse error: ${error.message}`);
      });
    }

    if (typeof delegate.generateConversationStream === 'function') {
      this.generateConversationStream = this._generateConversationStream.bind(this);
    }
    if (typeof delegate.generateExplanationStream === 'function') {
      this.generateExplanationStream = this._generateExplanationStream.bind(this);
    }
  }

  get providerName(): string {
    return this.delegate.providerName;
  }

  isAvailable(): boolean {
    return this.delegate.isAvailable();
  }

  isVisionCapable(modelOverride?: string): boolean {
    return this.delegate.isVisionCapable(modelOverride);
  }

  private startTrace(name: string, payload: { userId?: string; sessionId?: string; explanationKind?: string; modelOverride?: string }): LangfuseTraceClient | null {
    if (!this.langfuse) return null;
    
    return this.langfuse.trace({
      name,
      userId: payload.userId,
      sessionId: payload.sessionId,
      tags: [this.providerName],
      metadata: {
        modelOverride: payload.modelOverride,
        explanationKind: payload.explanationKind,
      }
    });
  }

  // Rough estimation of tokens based on character count (1 token ~ 4 chars for English, might be 1 token ~ 1-2 chars for Vietnamese)
  // Just a fallback since we don't have true usage from SSE streams yet.
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 3);
  }

  async generateExplanation(payload: ExplanationPromptPayload): Promise<ExplanationProviderResult> {
    const trace = this.startTrace('generateExplanation', payload);
    const generation = trace?.generation({
      name: 'generateExplanation',
      model: payload.modelOverride || 'default',
      startTime: new Date(),
    });

    try {
      const result = await this.delegate.generateExplanation(payload);
      
      if (generation) {
        const promptTokens = this.estimateTokens(JSON.stringify(payload));
        generation.end({
          output: result.renderedMarkdown,
          usage: {
            // Rough estimation
            promptTokens,
            completionTokens: this.estimateTokens(result.renderedMarkdown),
            totalTokens: promptTokens + this.estimateTokens(result.renderedMarkdown),
          }
        });
      }
      
      return result;
    } catch (error) {
      if (generation) {
        generation.end({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    } finally {
      if (trace) {
        // Flush async
        void this.langfuse?.flushAsync();
      }
    }
  }

  async generateConversation(payload: ConversationPromptPayload): Promise<ConversationProviderResult> {
    const trace = this.startTrace('generateConversation', payload);
    const generation = trace?.generation({
      name: 'generateConversation',
      model: payload.modelOverride || 'default',
      startTime: new Date(),
    });

    try {
      const result = await this.delegate.generateConversation(payload);
      
      if (generation) {
        const promptTokens = this.estimateTokens(JSON.stringify(payload.messages));
        generation.end({
          output: result.renderedMarkdown,
          usage: {
            promptTokens,
            completionTokens: this.estimateTokens(result.renderedMarkdown),
            totalTokens: promptTokens + this.estimateTokens(result.renderedMarkdown),
          }
        });
      }
      
      return result;
    } catch (error) {
      if (generation) {
        generation.end({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    } finally {
      if (trace) {
        void this.langfuse?.flushAsync();
      }
    }
  }

  private async *_generateConversationStream(
    payload: ConversationPromptPayload,
    signal?: AbortSignal,
  ): AsyncGenerator<string, ConversationProviderResult, void> {
    if (!this.delegate.generateConversationStream) {
      throw new Error(`Provider ${this.providerName} does not support streaming`);
    }

    const trace = this.startTrace('generateConversationStream', payload);
    const generation = trace?.generation({
      name: 'generateConversationStream',
      model: payload.modelOverride || 'default',
      startTime: new Date(),
    });

    try {
      const generator = this.delegate.generateConversationStream(payload, signal);
      let next = await generator.next();
      while (!next.done) {
        yield next.value;
        next = await generator.next();
      }
      
      const result = next.value;
      
      if (generation) {
        const promptTokens = this.estimateTokens(JSON.stringify(payload.messages));
        generation.end({
          output: result.renderedMarkdown,
          usage: {
            promptTokens,
            completionTokens: this.estimateTokens(result.renderedMarkdown),
            totalTokens: promptTokens + this.estimateTokens(result.renderedMarkdown),
          }
        });
      }
      
      return result;
    } catch (error) {
      if (generation) {
        generation.end({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    } finally {
      if (trace) {
        void this.langfuse?.flushAsync();
      }
    }
  }

  private async *_generateExplanationStream(
    payload: ExplanationPromptPayload,
    signal?: AbortSignal,
  ): AsyncGenerator<string, ExplanationProviderResult, void> {
    if (!this.delegate.generateExplanationStream) {
      throw new Error(`Provider ${this.providerName} does not support explanation streaming`);
    }

    const trace = this.startTrace('generateExplanationStream', payload);
    const generation = trace?.generation({
      name: 'generateExplanationStream',
      model: payload.modelOverride || 'default',
      startTime: new Date(),
    });

    try {
      const generator = this.delegate.generateExplanationStream(payload, signal);
      let next = await generator.next();
      while (!next.done) {
        yield next.value;
        next = await generator.next();
      }

      const result = next.value;

      if (generation) {
        const promptTokens = this.estimateTokens(JSON.stringify(payload));
        generation.end({
          output: result.renderedMarkdown,
          usage: {
            promptTokens,
            completionTokens: this.estimateTokens(result.renderedMarkdown),
            totalTokens: promptTokens + this.estimateTokens(result.renderedMarkdown),
          },
        });
      }

      return result;
    } catch (error) {
      if (generation) {
        generation.end({
          level: 'ERROR',
          statusMessage: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    } finally {
      if (trace) {
        void this.langfuse?.flushAsync();
      }
    }
  }
}

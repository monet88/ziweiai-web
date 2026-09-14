---
name: ai
description: "Skill for the Ai area of ziweiai-web. 162 symbols across 33 files."
---

# Ai

162 symbols | 33 files | Cohesion: 84%

## When to Use

- Working with code in `apps/`
- Understanding how getAIConfigStorage, getAIConfig, getAIConfigMode work
- Modifying ai-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `packages/xuanshu-runtime/lib/ai/config.ts` | generateId, normalizeTemperature, normalizeConfig, stripSecret, setConfigSecret (+29) |
| `packages/xuanshu-runtime/lib/ai/analysisPrompts.ts` | trimString, sanitizeForPrompt, formatChartData, buildStructuredPrompt, buildBaZiSystemPrompt (+6) |
| `apps/api/src/providers/ai/build-palace-explanation-prompt.ts` | translateToken, formatStar, formatPalaceStars, formatStemBranch, describePalace (+6) |
| `apps/api/src/providers/ai/ai-explanation-provider.ts` | isAvailable, AiConversationProvider, humanizeKey, normalizeLegacyTime, formatStringValue (+5) |
| `apps/api/src/providers/ai/openai-compatible-explanation-provider.ts` | buildChatCompletionsEndpoint, isAvailable, isVisionCapable, generateExplanationStream, generateConversationStream (+5) |
| `apps/api/src/providers/ai/llm-chat-adapter.ts` | assertNoCjk, isAvailable, resolveModel, buildProviderMetadata, buildRequest (+2) |
| `apps/api/src/providers/ai/langfuse-ai-provider-wrapper.ts` | LangfuseAiProviderWrapper, startTrace, estimateTokens, generateExplanation, generateConversation (+2) |
| `apps/api/src/providers/ai/gemini-chat-adapter.ts` | readGeminiResponseBody, extractGeminiErrorMessage, parseResult, GeminiChatAdapter, buildGeminiSdkEndpoint (+1) |
| `apps/api/src/providers/ai/gemini-explanation-provider.ts` | GeminiExplanationProvider, generateConversation, generateExplanation, isAvailable, isVisionCapable |
| `apps/api/src/providers/ai/deepseek-explanation-provider.ts` | DeepseekExplanationProvider, generateConversation, generateExplanation, isAvailable, isVisionCapable |

## Entry Points

Start here when exploring this area:

- **`getAIConfigStorage`** (Function) — `packages/xuanshu-runtime/lib/ai/config.ts:171`
- **`getAIConfig`** (Function) — `packages/xuanshu-runtime/lib/ai/config.ts:214`
- **`getAIConfigMode`** (Function) — `packages/xuanshu-runtime/lib/ai/config.ts:246`
- **`setAIConfigMode`** (Function) — `packages/xuanshu-runtime/lib/ai/config.ts:253`
- **`getAllConfigs`** (Function) — `packages/xuanshu-runtime/lib/ai/config.ts:279`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ProviderUnavailableError` | Class | `apps/api/src/providers/ai/provider-errors.ts` | 1 |
| `OpenAiCompatibleExplanationProvider` | Class | `apps/api/src/providers/ai/openai-compatible-explanation-provider.ts` | 40 |
| `LangfuseAiProviderWrapper` | Class | `apps/api/src/providers/ai/langfuse-ai-provider-wrapper.ts` | 10 |
| `GeminiExplanationProvider` | Class | `apps/api/src/providers/ai/gemini-explanation-provider.ts` | 20 |
| `DeepseekExplanationProvider` | Class | `apps/api/src/providers/ai/deepseek-explanation-provider.ts` | 22 |
| `ProviderRouterBase` | Class | `apps/api/src/providers/ai/provider-router-base.ts` | 16 |
| `ExplanationProviderRouter` | Class | `apps/api/src/providers/ai/explanation-provider-router.ts` | 18 |
| `ConversationProviderRouter` | Class | `apps/api/src/providers/ai/conversation-provider-router.ts` | 20 |
| `ProviderTimeoutError` | Class | `apps/api/src/providers/ai/provider-errors.ts` | 0 |
| `OpenAiStyleChatAdapter` | Class | `apps/api/src/providers/ai/openai-style-chat-adapter.ts` | 44 |
| `GeminiChatAdapter` | Class | `apps/api/src/providers/ai/gemini-chat-adapter.ts` | 61 |
| `getAIConfigStorage` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 171 |
| `getAIConfig` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 214 |
| `getAIConfigMode` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 246 |
| `setAIConfigMode` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 253 |
| `getAllConfigs` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 279 |
| `addConfig` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 287 |
| `updateConfig` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 316 |
| `deleteConfig` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 338 |
| `setActiveConfig` | Function | `packages/xuanshu-runtime/lib/ai/config.ts` | 366 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateExplanationStream → HumanizeKey` | cross_community | 7 |
| `GenerateExplanationStream → HumanizeKey` | cross_community | 7 |
| `BuildSystemPrompt → TrimString` | intra_community | 6 |
| `GenerateConversationStream → HumanizeKey` | cross_community | 6 |
| `GenerateConversationStream → HumanizeKey` | cross_community | 6 |
| `GenerateConversationStream → FormatPalaceStars` | cross_community | 6 |
| `TestAPIConnection → GetAISecretStorage` | cross_community | 5 |
| `TestAPIConnection → SaveAISecretStorage` | cross_community | 5 |
| `TestAPIConnection → StripSecret` | cross_community | 5 |
| `TestAPIConnection → NormalizeTemperature` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Observability | 1 calls |
| Audio | 1 calls |
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getAIConfigStorage"})` — see callers and callees
2. `gitnexus_query({query: "ai"})` — find related execution flows
3. Read key files listed above for implementation details

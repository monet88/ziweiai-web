# 0030 LlmExchange + LlmChatAdapter seam cho cum AI provider

Date: 2026-06-28

## Status

Accepted

## Context

Ba lop provider AI (DeepseekExplanationProvider, OpenAiCompatibleExplanationProvider,
GeminiExplanationProvider) cung implement AiConversationProvider va lap lai gan
nguyen mot khoi glue trong generateChatCompletion / generateContent:

- Dung timeout signal (AbortSignal.timeout).
- Goi fetch.
- Parse ket qua + kiem tra !response.ok.
- Trim text rong -> ProviderUnavailableError(emptyMessage).
- CJK guard: containsCjkText -> logger.warn + throw ProviderUnavailableError voi
  cung mot thong diep "noi dung khong hop le (chua chu Han)".
- Dung providerMetadata { provider, model, totalTokens, promptTokens, completionTokens }.
- Map loi ngoai cung: ProviderUnavailableError rethrow; TimeoutError/AbortError ->
  ProviderTimeoutError; con lai -> ProviderUnavailableError.

Phan THAT SU khac nhau giua ba provider chi nam o: URL + headers + body shape
(deepseek/openai-compat dung messages[] + content part image_url; gemini dung
contents[].parts[] + inlineData + systemInstruction), cach doc usage
(usage vs usageMetadata), va thong diep loi dac thu tung provider (openai-compat
raw-text-then-parse de giu HTTP status; gemini readGeminiResponseBody +
extractGeminiErrorMessage; deepseek thong diep co dinh).

Khoi glue lap lai nay la diem de phan ky cau hinh (vi du sua CJK guard mot noi
quen hai noi) va lam moi provider test phai dung lai toan bo case glue
(timeout/CJK/metadata) thay vi chi test phan dac thu.

## Decision

Tach cum AI provider non-stream thanh hai manh sau, theo huong deep module:

1. LlmExchange (@Injectable, core sau): doc quyen vong
   fetch -> adapter.parseResult -> assertNoCjk -> buildProviderMetadata, dung
   timeout signal, va map loi ngoai cung (TimeoutError/AbortError ->
   ProviderTimeoutError; con lai -> ProviderUnavailableError; ProviderUnavailableError
   rethrow nguyen). Day la noi DUY NHAT goi fetch cho duong non-stream.

2. Hai ham thuan dung chung ca stream lan non-stream: assertNoCjk(text) va
   buildProviderMetadata(providerName, model, usage). Streaming van o lai
   OpenAiCompatibleExplanationProvider nhung goi chung hai ham nay.

3. Interface LlmChatAdapter (seam dat o Response THO): moi adapter khai
   providerName, isAvailable(), resolveModel(modelOverride?), visionCapable,
   buildRequest({ prompt, imageInput, model, timeoutMs, signal }) -> { url, init },
   va parseResult(response) -> { text, usage } (tu xu !response.ok + thong diep
   loi dac thu tung provider).

4. Hai adapter cu the: OpenAiStyleChatAdapter (nhan config endpoint/apiKey/model/
   extraBody/visionCapable; DeepSeek va OpenAI-compat deu dung) va GeminiChatAdapter
   (shape rieng). Ba lop @Injectable provider giu nguyen ten + DI, tro thanh vo
   mong dung adapter + goi LlmExchange.

5. Don dead code: isDeepseekModelVisionCapable + allowlist
   DEEPSEEK_VISION_CAPABLE_MODELS bo duoc vi DeepSeek vision-false cung
   (visionCapable = false hang so tren adapter). buildImageDataUrl /
   mimeTypeToExtension / SUPPORTED_VISION_MIME_TYPES giu nguyen.

Bat bien giu nguyen, KHONG doi:

- providerMetadata cua openai-compat KHONG co field `kind`; deepseek/gemini CO
  field `kind` (kind nay khong duoc doc lai o downstream nhung van giu de khong
  doi JSON persisted). buildProviderMetadata phai giu dung khac biet nay.
- Router (ExplanationProviderRouter/ConversationProviderRouter), provider-router-base,
  ai-providers.module.ts, va thu tu failover/CJK-guard-rethrow khong doi.
- Ten 3 lop provider + chu ky public method (generateExplanation/generateConversation/
  generateConversationStream/isAvailable/isVisionCapable/supportsPreference) khong doi.

## Alternatives Considered

1. Giu nguyen, chap nhan lap glue ba noi. Bo qua vi de phan ky cau hinh va lam
   moi provider test phai dung lai toan bo case glue.
2. Mot adapter duy nhat co if theo providerName. Bo qua vi seam khong sach,
   them provider = sua than ham dispatch (vi pham open/closed).
3. Tach ca duong streaming vao LlmExchange. Bo qua: streaming co vong
   doc SSE + abort/disconnect rieng (decision 0026), gop vao se lam LlmExchange
   nong; chi chia se assertNoCjk + buildProviderMetadata la du.

## Consequences

Positive:

- Glue (timeout/fetch/CJK/metadata/error-map) song o mot noi; sua mot lan.
- Them provider moi = them mot adapter, khong dung LlmExchange.
- Provider test chi con test phan dac thu adapter; LlmExchange + ham thuan co
  test rieng qua mock adapter.

Tradeoffs:

- Them mot lop interface (LlmChatAdapter) + hai file adapter, tang so file.
- Streaming van song rieng trong openai-compat (chi chia se ham thuan), nen van
  con mot it doi xung giua hai duong.

## Follow-Up

- Neu sau nay can streaming cho provider khac (deepseek/gemini), can xet mo rong
  adapter de cover ca duong stream thay vi nhan doi logic.

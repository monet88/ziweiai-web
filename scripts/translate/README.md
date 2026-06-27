# Pipeline dich Han -> Viet (backlog #41 / US-033)

Ha tang dung chung cho moi he B6 (giai mong, xin xam, Lenormand, hoang lich...)
de dich du lieu nguon tieng Trung sang tieng Viet **mot lan luc port**, ghi ra
file tinh de commit. App runtime KHONG bao gio goi pipeline nay.

## Vi sao dich offline, khong dich luc chay

- Chi phi: dich mot lan thay vi moi request nguoi dung.
- On dinh: du lieu co dinh, khong lech giua cac lan, khong phu thuoc LLM luc chay.
- Hard-gate ngon ngu: output duoc quet `\p{Script=Han}` (dong bo `@ziweiai/core`),
  con chu Han la fail-fast nen du lieu ban khong lot vao repo.

## Thanh phan

- `core.ts` — loi thuan (batch, cache/resume, retry phan con Han, validate dem
  khop + sach Han). Khong I/O, khong network -> test bang fake translator.
- `glossary.ts` — bang thuat ngu Han -> Viet nhung vao prompt de ep dich nhat quan.
- `translate-client.ts` — lop goi LLM OpenAI-compatible that (doc
  `OPENAI_COMPAT_API_KEY` / `_BASE_URL` / `_MODEL` tu env).
- `run.ts` — CLI: doc file units -> dich -> ghi cache resume + file ket qua.

## Cach dung

Moi he B6 tu viet buoc flatten dataset cua minh thanh mang `{id, text}` (units.json)
roi re-assemble units da dich (vi.json) ve dataset Viet. Pipeline chi lo phan chung.

```bash
# .env phai co OPENAI_COMPAT_API_KEY / _BASE_URL / _MODEL
npx tsx --env-file=.env scripts/translate/run.ts \
  --in units.json --out vi.json --cache cache.json --batch 40
```

- `units.json`: `[{ "id": "dream.snake.meaning", "text": "..." }, ...]`
- `vi.json`: `{ "dream.snake.meaning": "Ran trong mo...", ... }`
- `cache.json`: cung dang `vi.json`; doc truoc khi chay + ghi lai sau moi lan de
  resume (bo qua unit da dich sach Han). Dataset lon (xin xam ~387KB) chay nhieu
  dot nho cache.

## Test

```bash
npx vitest run scripts/translate
```

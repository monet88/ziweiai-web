<script lang="ts">
  // Route Tiểu Lục Nhâm (Issue #65): wrapper cho màn gieo quẻ Tiểu Lục Nhâm.
  // Cờ EXTENDED_SYSTEM_XIAOLIUREN_ENABLED gate ở backend (POST /draws/xiaoliuren).
  import XiaoLiuRenScreen from '$lib/features/xiaoliuren/XiaoLiuRenScreen.svelte';
  import { viCopy } from '$lib/i18n/vi';
</script>

<XiaoLiuRenScreen copy={viCopy.xiaoliuren} />

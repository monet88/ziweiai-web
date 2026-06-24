<script lang="ts">
  // Route MBTI (US-017b): wrapper mỏng cho màn trắc nghiệm tính cách. Cờ EXTENDED_SYSTEM_MBTI
  // gate ở backend (POST /quizzes/mbti); route luôn render UI, submit mới chạm gate.
  import MbtiQuizScreen from '$lib/features/mbti/MbtiQuizScreen.svelte';
</script>

<MbtiQuizScreen />

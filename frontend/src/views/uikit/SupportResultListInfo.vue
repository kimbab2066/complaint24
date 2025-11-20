<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import axios from 'axios';

const route = useRoute();
const supportResultId = route.params.support_result_no;

const form = ref({
  supportTitle: '',
  supportSpend: '',
  supportContent: '',
  startedAt: null,
  endedAt: null,
});

const loading = ref(true);

// 날짜 포맷 (YYYY-MM-DD)
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d) ? '-' : d.toLocaleDateString();
};

// 금액 포맷 (천 단위 콤마)
const formatAmount = (amount) => {
  if (amount == null || amount === '') return '-';
  return Number(amount).toLocaleString();
};

// 지원 결과 데이터 로딩
const loadSupportResult = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`/api/staff/support-result/${supportResultId}`);
    const data = res.data;

    if (data) {
      form.value.supportTitle = data.support_title || '';
      form.value.supportSpend = data.support_spend || '';
      form.value.supportContent = data.support_content || '';
      form.value.startedAt = data.support_started_at || null;
      form.value.endedAt = data.support_ended_at || null;
    }
  } catch (err) {
    console.error(err);
    alert('지원 결과를 불러오지 못했습니다.');
  } finally {
    loading.value = false;
  }
};

onMounted(loadSupportResult);
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">지원 결과 상세</h2>

    <div v-if="loading">로딩 중...</div>
    <div v-else>
      <div class="mb-3">
        <label class="font-semibold">지원 제목</label>
        <InputText :value="form.supportTitle" readonly class="w-full" />
      </div>

      <div class="mb-3">
        <label class="font-semibold">지원 금액</label>
        <InputText :value="formatAmount(form.supportSpend)" readonly class="w-full" />
      </div>

      <div class="mb-3">
        <label class="font-semibold">상세 내용</label>
        <Textarea :value="form.supportContent" readonly rows="5" class="w-full" />
      </div>

      <div class="mb-3">
        <label class="font-semibold">시작 일자</label>
        <InputText :value="formatDate(form.startedAt)" readonly class="w-full" />
      </div>

      <div class="mb-3">
        <label class="font-semibold">종료 일자</label>
        <InputText :value="formatDate(form.endedAt)" readonly class="w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 600;
}
</style>

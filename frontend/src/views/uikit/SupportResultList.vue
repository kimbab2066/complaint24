<script setup>
import { ref, onBeforeMount, computed } from 'vue';
import axios from 'axios';
import InputText from 'primevue/inputtext';
import SupportResultItem from '@/components/staff/SupportResultItem.vue';

const ALLOW_MULTIPLE_ACCORDIONS = ref(false);
const surveys = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const activeSupportPlanNo = ref(null);

// 상세 토글
const handleToggleDetail = (supportResultNo) => {
  if (!ALLOW_MULTIPLE_ACCORDIONS.value) {
    activeSupportPlanNo.value =
      activeSupportPlanNo.value === supportResultNo ? null : supportResultNo;
  }
};

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '-';
  return date.split('T')[0];
};

// DB에서 support-result 가져오기 (두 번째 API)
onBeforeMount(async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/staff/support-result');
    const list = Array.isArray(res.data) ? res.data : [res.data];

    surveys.value = list.map((item) => ({
      support_plan_no: item.support_result_no, // 리스트 키
      title: item.support_title,
      spend: item.support_spend,
      startedAt: formatDate(item.support_started_at),
      endedAt: formatDate(item.support_ended_at),
      // SupportPlanItem 용 커스텀 필드
      support_plan_goal: item.support_title,
      staff_name: item.staff_name || '미지정',
      priority: '-',
      business_name: item.business_name || '-',
      writer_date: formatDate(item.support_started_at),
      support_plan_status: item.status || '',
      plan: item.support_content,
      file_names: '',
    }));
  } catch (err) {
    console.error('지원 결과 조회 오류:', err);
  } finally {
    loading.value = false;
  }
});

// 검색 필터
const filteredSurveys = computed(() => {
  if (!searchKeyword.value) return surveys.value;

  const keyword = searchKeyword.value.toLowerCase();
  return surveys.value.filter(
    (item) =>
      item.title?.toLowerCase().includes(keyword) ||
      item.staff_name?.toLowerCase().includes(keyword)
  );
});
</script>

<template>
  <div class="card">
    <!-- 검색창 -->
    <div class="p-input-icon-left w-full mb-4">
      <i class="pi pi-search" />
      <InputText
        v-model="searchKeyword"
        placeholder="지원 제목, 작성자 검색"
        class="w-full p-inputtext-lg"
      />
    </div>

    <!-- 결과 리스트 -->
    <div v-if="!loading" class="flex flex-col gap-4">
      <SupportResultItem
        v-for="item in filteredSurveys"
        :key="item.support_plan_no"
        :item="item"
        :is-active="activeSupportPlanNo === item.support_plan_no"
        :allow-multiple="ALLOW_MULTIPLE_ACCORDIONS"
        @toggle-detail="() => handleToggleDetail(item.support_plan_no)"
      />
    </div>

    <div v-else class="text-center p-6 text-lg text-gray-500">데이터 불러오는 중...</div>
  </div>
</template>

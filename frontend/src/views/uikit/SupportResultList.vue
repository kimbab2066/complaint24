<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { FilterMatchMode } from '@primevue/core/api';
import axios from 'axios';

const supportResults = ref([]);
const loading = ref(false);
const router = useRouter();

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// 금액 포맷
const formatAmount = (amount) => amount?.toLocaleString() || '-';

// 날짜 포맷
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return isNaN(d) ? '-' : d.toLocaleDateString();
};

// 상세보기 클릭 → 승인/반려 페이지로 이동
const viewDetails = (row) => {
  router.push({
    name: 'SupportResultListInfo',
    params: { support_result_no: row.id },
  });
};

// 지원 결과 목록 조회
const loadSupportResults = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/staff/support-result');
    const data = Array.isArray(res.data) ? res.data : [res.data];

    supportResults.value = data.map((item) => ({
      id: item.support_result_no,
      supportTitle: item.support_title,
      supportSpend: item.support_spend,
      startedAt: item.support_started_at,
      endedAt: item.support_ended_at,
    }));
  } catch (err) {
    console.error('지원 결과 조회 실패:', err);
    supportResults.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadSupportResults);
</script>

<template>
  <div class="card">
    <div class="p-input-icon-left w-full mb-4">
      <i class="pi pi-search" />
      <InputText
        v-model="filters.global.value"
        placeholder="지원 제목, 금액 등 검색"
        class="w-full p-inputtext-lg"
      />
    </div>

    <DataTable
      :value="supportResults"
      :loading="loading"
      :filters="filters"
      :global-filter-fields="['supportTitle', 'supportSpend']"
      paginator
      :rows="10"
      tableStyle="min-width: 50rem"
    >
      <Column field="id" header="번호" sortable style="width: 5rem" />
      <Column field="supportTitle" header="지원 제목" sortable />
      <Column field="supportSpend" header="지원 금액" sortable>
        <template #body="slotProps">
          {{ formatAmount(slotProps.data.supportSpend) }}
        </template>
      </Column>
      <Column field="startedAt" header="시작 일자" sortable>
        <template #body="slotProps">
          {{ formatDate(slotProps.data.startedAt) }}
        </template>
      </Column>
      <Column field="endedAt" header="종료 일자" sortable>
        <template #body="slotProps">
          {{ formatDate(slotProps.data.endedAt) }}
        </template>
      </Column>

      <Column header="보기">
        <template #body="slotProps">
          <Button
            label="상세보기"
            size="small"
            outlined
            @click="() => viewDetails(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.card {
  padding: 1.5rem;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>

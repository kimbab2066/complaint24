<script setup>
// vue에서 제공하는 데이터 테이블을 깔끔하게 볼 수 있는 기능
import { DataTable, Column, Tag, Button } from 'primevue';
import { ref, onMounted } from 'vue';
import axios from 'axios';

// DB에서 정보를 가져와야함
const approvalList = ref([]);

// 날짜 포맷팅 함수
const formatData = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '유효하지 않은 날짜';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    return '날짜 포맷 오류';
  }
};

const getRoleText = (role) => {
  switch (role) {
    case '2a':
      return '기관 담당자';
    case '3a':
      return '기관 관리자';
    default:
      return role;
  }
};

// 승인 상태에 따라 태그 색상 정의
const getStatus = (status) => {
  switch (status) {
    case 'READY':
      return 'warning';
    case 'ACTIVE':
      return 'success';
    default:
      return 'secondary';
  }
};

const getApprovalList = async () => {
  try {
    // backend 서버의 API
    const response = await axios.get('/api/approval');
    approvalList.value = response.data;
  } catch (error) {
    console.error('권한 승인 대기 목록 오류', error);
  }
};
// vue 컴포넌트가 로드될 때 데이터를 가져오도록
onMounted(() => {
  getApprovalList();
});
</script>

<template>
  <div class="approval-page">
    <h2 class="page-subtitle">신규 관리자 및 담당자 승인 대기 목록</h2>

    <div class="table-container">
      <div v-if="!approvalList.length" class="empty-list-message">
        <i class="pi pi-check-circle"></i>
        <p>현재 승인 대기 중인 사용자가 없습니다</p>
      </div>
      <!-- paginator은 DataTable이 가지고 있는 페이징 기능 -->
      <DataTable v-else :value="approvalList" paginator :rows="10" class="p-datatable-gridlines">
        <Column field="user_id" header="신청자명" style="width: 15%; min-width: 120px"></Column>

        <Column
          field="institution_no"
          header="소속기관"
          style="width: 15%; min-width: 120px"
        ></Column>

        <Column field="role" header="요청권한" style="width: 15%; min-width: 120px">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.role"
              :severity="slotProps.data.role.includes('3a') ? 'info' : 'secondary'"
            ></Tag>
          </template>
        </Column>

        <Column field="applicationDate" header="신청일자" style="width: 15%; min-width: 120px">
          <template #body="slotProps">{{ formatDate(slotProps.data.applicationDate) }}</template>
        </Column>

        <Column field="status" header="상태" style="width: 15%; min-width: 100px">
          <template #body="slotProps">
            <Tag :value="slotProps.data.status" :severity="getStatus(slotProps.data.status)"></Tag>
          </template>
        </Column>

        <Column
          header="처리"
          style="width: 15%; min-width: 160px"
          headerStyle="text-align: center;"
        >
          <template #body="slotProps">
            <div class="flex gap-2 justify-center" v-if="slotProps.data.status === 'READY'">
              <Button icon="pi pi-check" label="승인" severity="success" size="small"></Button>
              <Button icon="pi pi-times" label="반려" severity="danger" size="small"></Button>
              <!-- @click으로 승인/반려 버튼 누르면 승인할 수 있도록 함수 -->
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

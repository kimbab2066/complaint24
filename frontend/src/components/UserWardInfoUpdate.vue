<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag'; // Tag 컴포넌트 추가

const props = defineProps({
  userName: {
    type: String,
    required: true
  }
});

// --- 피보호자 관리 상태 ---
const wards = ref([]);
const wardDialog = ref(false);
const submitted = ref(false);
const ward = ref({});

const loadWards = async () => {
  try {
    const response = await axios.get('/api/user/wards', {
      params: { guardianName: props.userName },
    });
    wards.value = response.data.result;
  } catch (error) {
    console.error('피보호자 목록을 불러오는 데 실패했습니다:', error);
  }
};

onMounted(() => {
  loadWards();
});

// --- 피보호자 관리 이벤트 핸들러 ---
const openNewWardDialog = () => {
  ward.value = {};
  submitted.value = false;
  wardDialog.value = true;
};
const hideWardDialog = () => {
  wardDialog.value = false;
  submitted.value = false;
};
const saveWard = async () => {
  submitted.value = true;
  try {
    if (ward.value.ward_no) {
      await axios.put(`/api/user/wards/${ward.value.ward_no}`, ward.value);
    } else {
      ward.value.guardian_name = props.userName;
      await axios.post('/api/user/wards', ward.value);
    }
    hideWardDialog();
    loadWards();
  } catch (error) {
    console.error('피보호자 정보를 저장하는 데 실패했습니다:', error);
  }
};
const editWard = (selectedWard) => {
  ward.value = { ...selectedWard };
  wardDialog.value = true;
};

// --- 신규 추가된 이벤트 핸들러 ---
const viewSupportHistory = (ward) => {
  alert(`'${ward.name}'의 지원 기록 보기 기능은 현재 준비 중입니다.`);
};

const getPriorityClass = (status) => {
  switch (status) {
    case '긴급':
      return 'priority-urgent';
    case '중점':
      return 'priority-important';
    case '준비':
      return 'priority-ready';
    default:
      return '';
  }
};
</script>

<template>
  <div class="card">
    <div
      class="p-d-flex p-jc-between p-mb-3"
      style="display: flex; justify-content: space-between; margin-bottom: 1.5rem"
    >
      <h5>피보호자 관리</h5>
      <Button
        label="신규 등록"
        icon="pi pi-plus"
        class="p-button-success"
        @click="openNewWardDialog"
      />
    </div>
    <DataTable :value="wards" responsiveLayout="scroll">
      <Column field="name" header="이름"></Column>
      <Column field="sex" header="성별"></Column>
      <Column field="age" header="나이"></Column>
      <Column field="address" header="주소"></Column>
      <Column field="guardian_relation" header="관계"></Column>
      <Column field="disabled_level" header="장애 수준"></Column>
      <Column header="서비스 우선순위">
        <template #body="slotProps">
          <Tag :value="slotProps.data.priority_status" :class="getPriorityClass(slotProps.data.priority_status)" />
        </template>
      </Column>
      <Column header="지원 기록">
        <template #body="slotProps">
          <Button
            label="기록보기"
            @click="viewSupportHistory(slotProps.data)"
            class="p-button-text"
          />
        </template>
      </Column>
      <Column header="정보 수정">
        <template #body="slotProps">
          <Button
            label="정보수정"
            @click="editWard(slotProps.data)"
            class="p-button-text"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="wardDialog"
      :style="{ width: '450px' }"
      header="피보호자 정보"
      :modal="true"
      class="p-fluid"
    >
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="ward_rrn">주민등록번호</label>
        <InputText id="ward_rrn" v-model.trim="ward.ward_rrn" required="true" />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="name">이름</label>
        <InputText id="name" v-model.trim="ward.name" required="true" autofocus />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="sex">성별</label>
        <InputText id="sex" v-model.trim="ward.sex" required="true" />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="age">나이</label>
        <InputText id="age" v-model.trim="ward.age" required="true" />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="address">주소</label>
        <InputText id="address" v-model.trim="ward.address" required="true" />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="guardian_relation">관계</label>
        <InputText
          id="guardian_relation"
          v-model.trim="ward.guardian_relation"
          required="true"
        />
      </div>
      <div class="p-field" style="margin-bottom: 1rem">
        <label for="disabled_level">장애 수준</label>
        <InputText id="disabled_level" v-model.trim="ward.disabled_level" required="true" />
      </div>

      <template #footer>
        <Button
          label="취소"
          icon="pi pi-times"
          class="p-button-text"
          @click="hideWardDialog"
        />
        <Button label="저장" icon="pi pi-check" class="p-button-text" @click="saveWard" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.card {
  background: #ffffff;
  padding: 2rem;
  border-radius: 10px;
  box-shadow:
    0 2px 1px -1px rgba(0, 0, 0, 0.2),
    0 1px 1px 0 rgba(0, 0, 0, 0.14),
    0 1px 3px 0 rgba(0, 0, 0, 0.12);
}

.priority-urgent {
  background-color: #ef4444 !important; /* red-500 */
  color: white !important;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.priority-important {
  background-color: #3b82f6 !important; /* blue-500 */
  color: white !important;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
.priority-ready {
  background-color: #22c55e !important; /* green-500 */
  color: white !important;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}
</style>

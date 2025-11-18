<script setup>
import { ref, computed, onMounted } from 'vue';
// api.js에서 staffReservationApi 임포트 (경로는 실제 위치에 맞게 수정)
import { staffReservationApi } from '@/api/api';

// --- Reactive State ---

// 검색 관련
const searchType = ref('date'); // 'date', 'applicant', 'reason'
const searchStartDate = ref('');
const searchEndDate = ref('');
const searchKeyword = ref('');

// 목록 데이터
const reservationList = ref([]); // API 응답으로 채워짐
const isLoading = ref(false);
const error = ref(null);

// 모달 관련
const isModalOpen = ref(false);
const currentReservation = ref(null);
const isCanceling = ref(false); // 취소 API 호출 중 상태
const modalError = ref(null); // 모달 내 에러 메시지

// --- Computed Properties ---

// 검색창 Placeholder
const searchInputPlaceholder = computed(() => {
  if (searchType.value === 'applicant') {
    return '보호자 이름을 입력하세요';
  }
  if (searchType.value === 'reason') {
    return '사유를 입력하세요';
  }
  return '검색어를 입력하세요';
});

// --- Methods ---

// (Helper) 날짜 포맷팅 함수
function formatDateTime(isoString) {
  if (!isoString) return '날짜 정보 없음';
  try {
    const date = new Date(isoString);
    // 'yyyy년 MM월 dd일 HH:mm' 형식
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (e) {
    console.error('Date formatting error:', e);
    return isoString;
  }
}

// (API) 예약 목록 조회 (요구사항 1, 2)
async function fetchReservations() {
  isLoading.value = true;
  error.value = null;

  // 1. 검색 파라미터 구성
  const params = {
    searchType: searchType.value,
  };

  if (searchType.value === 'date') {
    params.startDate = searchStartDate.value || null; // 빈 문자열 대신 null
    params.endDate = searchEndDate.value || null;
  } else {
    params.keyword = searchKeyword.value;
  }

  try {
    // 2. API 호출
    const response = await staffReservationApi.getReservations(params);

    // (참고) 백엔드 응답 구조에 따라 response.data.list 또는 response.data일 수 있음
    reservationList.value = response.data;
  } catch (err) {
    console.error('예약 목록 조회 실패:', err);
    error.value = err;
  } finally {
    isLoading.value = false;
  }
}

// 검색 버튼 클릭
function executeSearch() {
  // fetchReservations 함수가 파라미터를 사용하므로 그냥 호출
  fetchReservations();
}

// 컴포넌트 마운트 시 초기 목록 조회
onMounted(() => {
  // (선택) 초기 날짜 설정 (예: 오늘 날짜)
  // searchStartDate.value = new Date().toISOString().split('T')[0];

  fetchReservations();
});

// 기록 작성 (요구사항 4)
function writeRecord(reservation) {
  console.log(`(Action) 기록 작성 페이지로 이동:`);
  console.log(`Available Time No (at_no): ${reservation.atNo}`); // 백엔드 응답의 at_no 필드명 확인 필요

  // location.href = `/counseling/record/new?at_no=${reservation.atNo}`;
  alert(`'기록 작성' 클릭 (at_no: ${reservation.atNo}). 상담일지 작성 페이지로 이동합니다.`);
}

// 예약 취소 모달 열기
function openCancelModal(reservation) {
  currentReservation.value = reservation;
  modalError.value = null; // 모달 열 때 에러 초기화
  isModalOpen.value = true;
}

// 예약 취소 모달 닫기
function closeCancelModal() {
  isModalOpen.value = false;
  currentReservation.value = null;
  isCanceling.value = false;
}

// 예약 취소 확정 (요구사항 3)
async function confirmCancel() {
  if (!currentReservation.value || isCanceling.value) return;

  const reservationToCancel = currentReservation.value;
  // (중요) 백엔드 API가 /:at_no를 받기로 했으므로, 'atNo' 필드가 필요
  //       응답 데이터에 'atNo' 필드가 없다면 필드명을 맞춰야 함
  const atNo = reservationToCancel.atNo;

  if (!atNo) {
    modalError.value = '취소할 예약 ID(at_no)가 없습니다.';
    return;
  }

  isCanceling.value = true;
  modalError.value = null;

  try {
    // 1. (API) 취소 API 호출
    await staffReservationApi.cancelReservationByStaff(atNo);

    console.log(`(DB) UPDATE available_time SET status = '상담불가' WHERE at_no = ${atNo};`);

    // 2. (UI) 목록에서 제거 (또는 목록 새로고침)
    // (옵션 1: 즉시 제거)
    // reservationList.value = reservationList.value.filter(
    //   (item) => item.atNo !== atNo
    // );

    // (옵션 2: 목록 새로고침 - 추천)
    await fetchReservations();

    // 3. 모달 닫기
    closeCancelModal();
  } catch (err) {
    console.error('예약 취소 실패:', err);
    modalError.value = err.response?.data?.message || err.message || '알 수 없는 오류 발생';
  } finally {
    isCanceling.value = false;
  }
}
</script>

<template>
  <!-- 2-2. 컨텐츠 영역 (스크롤) -->
  <div class="flex-1 overflow-y-auto p-8 bg-gray-100">
    <!-- 검색 및 필터 영역 -->
    <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div class="flex flex-col md:flex-row md:items-end md:space-x-4 gap-4">
        <!-- 검색 조건 선택 -->
        <div class="flex-none">
          <label for="search-type" class="block text-sm font-medium text-gray-700 mb-1"
            >검색 조건</label
          >
          <select
            id="search-type"
            v-model="searchType"
            class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="date">상담일시</option>
            <option value="applicant">보호자이름</option>
            <option value="reason">사유</option>
          </select>
        </div>

        <!-- 검색 값 입력 -->
        <div class="flex-1 min-w-0">
          <label for="search-value" class="block text-sm font-medium text-gray-700 mb-1"
            >검색 값</label
          >

          <!-- 상담일시 검색 -->
          <div v-if="searchType === 'date'" class="flex space-x-2">
            <input
              type="date"
              v-model="searchStartDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span class="flex items-center text-gray-500">~</span>
            <input
              type="date"
              v-model="searchEndDate"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <!-- 텍스트 검색 -->
          <div v-else>
            <input
              type="text"
              v-model="searchKeyword"
              :placeholder="searchInputPlaceholder"
              @keyup.enter="executeSearch"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- 검색 버튼 -->
        <div class="flex-none">
          <button
            @click="executeSearch"
            :disabled="isLoading"
            class="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {{ isLoading ? '검색 중...' : '검색' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 상담 예약 목록 -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <!-- ... (thead columns) ... -->
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                상담 일시
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                신청인(보호자)
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                피보호자
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                요청 사유
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                관리
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- 로딩 중 -->
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                목록을 불러오는 중입니다...
              </td>
            </tr>
            <!-- 에러 발생 -->
            <tr v-else-if="error">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-red-600">
                목록을 불러오는데 실패했습니다: {{ error.message }}
              </td>
            </tr>
            <!-- 데이터 없음 -->
            <tr v-else-if="reservationList.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
                표시할 예약 내역이 없습니다.
              </td>
            </tr>
            <!-- 데이터 있음 -->
            <tr v-else v-for="reservation in reservationList" :key="reservation.id">
              <!-- (백엔드 응답에 따라 key는 reservation.atNo 또는 reservation.resNo 등이 될 수 있습니다) -->
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatDateTime(reservation.start_time) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ reservation.applicantName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ reservation.patientName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                {{ reservation.reason }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                <button
                  @click="writeRecord(reservation)"
                  class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  기록 작성
                </button>
                <button
                  @click="openCancelModal(reservation)"
                  class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  예약 취소
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 (Static) -->
      <div
        class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
      >
        <!-- ... (pagination code) ... -->
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              총 <span class="font-medium">{{ reservationList.length }}</span> 건
            </p>
          </div>
          <div>
            <nav
              class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <a
                href="#"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                aria-current="page"
                class="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                1
              </a>
              <a
                href="#"
                class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg
                  class="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 예약 취소 확인 모달 -->
  <div
    v-if="isModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-medium leading-6 text-gray-900">예약 취소 확인</h3>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-700">정말로 이 예약을 취소하시겠습니까?</p>
        <div v-if="currentReservation" class="mt-2 text-sm text-gray-600">
          <p><strong>일시:</strong> {{ formatDateTime(currentReservation.start_time) }}</p>
          <p><strong>신청인:</strong> {{ currentReservation.applicantName }}</p>
        </div>
        <p class="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
          (요구사항 3) 취소 시, 해당 시간 슬롯은 '상담불가' 상태로 변경되며 신청자에게 알림이
          전송됩니다.
        </p>
        <!-- 취소 API 에러 메시지 -->
        <p v-if="modalError" class="mt-4 text-sm text-red-600">취소 실패: {{ modalError }}</p>
      </div>
      <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
        <button
          type="button"
          @click="closeCancelModal"
          class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          닫기
        </button>
        <button
          type="button"
          @click="confirmCancel"
          :disabled="isCanceling"
          class="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {{ isCanceling ? '취소 중...' : '예약 취소' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* (scoped styles) */
/* Tailwind CSS가 대부분의 스타일을 처리하므로 
   scoped style은 일반적으로 필요하지 않거나 
   특정 컴포넌트 오버라이드에 사용됩니다. */
</style>

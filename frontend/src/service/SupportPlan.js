import axios from 'axios';

export const SupportPlan = {
  getSupportPlan(user_id) {
    return axios
      .get('/api/qna/supportplan', {
        params: { user_id }, // ★ 여기서 userId 전달
      })
      .then((res) => res.data);
  },
};

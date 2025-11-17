// 비즈니스 로직
const db = require("../database/mappers/mapper.js");

// 권한 승인 요청한 목록 가져오기
const getApprovalList = async () => {
  // approval.js에서 작성한 쿼리문 가져오기
  // "selectApproval"와 파라미터 배열을 전달
  const approvals = await db.query("selectApprovalList", []);
  return approvals;
};

// exports 꼭 하기
module.exports = {
  getApprovalList,
};

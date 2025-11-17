// 데이터 베이스 로직을 approvalService.js로 넘김
// vue.js frontend로 부터 HTTP 요청을 받는 역할

const express = require("express");
// 비즈니스 로직을 가져옴
const approvalService = require("../services/approvalService.js");
const router = express.Router();

// 권한 승인 목록을 조회는 GET방식
// app.js 에서 이미 "/approval"을 설정함
router.get("/", async (req, res) => {
  console.log("approvalRouter /approval요청 도착");
  try {
    const list = await approvalService.getApprovalList();
    res.status(200).json(list);
  } catch (error) {
    console.error("approvalRouter.js error", error);
    res.status(500).json({ message: "권한승인 목록 실패" });
  }
});

module.exports = router;

// 데이터 베이스 로직을 institutionService.js로 넘긴다
// vue.js frontend로 부터 HTTP 요청을 받는 역할

const express = require("express");
// 비즈니스 로직을 가져옴
const institutionService = require("../services/institutionService.js");
const router = express.Router();

// 목록 조회는 GET방식
// app.js 에서 이미 "/institution"을 설정했음
router.get("/", async (req, res) => {
  console.log("systemRouter /institutions 요청 도착");
  try {
    const list = await institutionService.getAllInstitutionList();
    res.status(200).json(list);
  } catch (error) {
    console.error("systemRouter.js error", error);
    res.status(500).json({ message: "기관 목록 조회 실패" });
  }
});

// (GET /:id)
router.get("/:id", async (req, res) => {
  try {
    // URL 에서 ID 파라미터를 가져옴
    const id = req.params.id;
    // institutionService.js의 함수를 호출
    const institution = await institutionService.getInstitutionById(id);

    if (institution) {
      res.status(200).json(institution);
    } else {
      res.status(404).json({ message: "해당 기관의 정보가 없습니다" });
    }
  } catch (error) {
    console.error("systemRouter.js 기관상세조회 에러", error);
    res.status(500).json({ message: "기관상세조회 에러" });
  }
});

module.exports = router;

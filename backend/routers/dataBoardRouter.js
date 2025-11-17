// routers/dataBoardRouter.js
const express = require("express");
const router = express.Router();

const { query } = require("../database/mappers/mapper.js");
// 'sql'과 'connectionPool'은 트랜잭션이 필요한 POST에서만 사용되므로 삭제

/**
 * [GET /api/dataBoard] (경로가 dataBoard라고 가정)
 * 자료 게시판 '목록'을 DB에서 조회합니다.
 */
router.get("/", async (req, res) => {
  try {
    // 🚨 [핵심 수정]
    // "dataBoard"가 sqlList.js에 있는 실제 키 이름인지 확인하세요.
    // (예: "getBoardList" 등)
    const rows = await query("dataBoard"); // 👈 22번째 줄
    res.json(rows);
  } catch (err) {
    // 🚨 DB 조회 실패 시 err를 콘솔에 찍어봐야
    // 'sql parameter is mandatory' 같은 에러를 볼 수 있습니다.
    console.error("DB 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

//파일 업로드
router.post("/", async (req, res) => {
  console.log("[fileRouter] POST / 요청 받음");

  // 1. 프론트엔드에서 보낸 데이터 분리
  // (RegistSurveyForm.js에서 보낸 surveyData 객체입니다)
  const { institution_name, write } = req.body;
  r, title, file_no, created_at;
  let conn; // 트랜잭션을 위한 커넥션 객체
  try {
    // 2. 풀(pool)에서 커넥션을 직접 가져옵니다.
    // (mapper.js의 query 함수는 트랜잭션을 지원하지 않으므로)
    conn = await connectionPool.getConnection();

    // 3. [트랜잭션 시작]
    await conn.beginTransaction();

    // 4. 'inquiry' (마스터) 테이블에 INSERT
    // (sqlList.js에 정의된 inquiryInsert 키 사용)
    const fileResult = await conn.query(sql.inquiryInsert, [
      institution_name,
      writer || "시스템 관리자", // (임시) 작성자
      title,
      file_no, // notice_no (null로 가정)
    ]);

    // 5. 방금 생성된 'inquiry_no' (PK) 가져오기
    const newFileNo = fileResult.insertId;

    if (!newFileNo) {
      throw new Error("조사지 ID 생성 실패");
    }

    // 7. [커밋] 모든 쿼리 성공
    await conn.commit();

    console.log("등록 성공! file_no:", newFileNo);
    res.status(201).json({
      message: "조사지가 성공적으로 등록되었습니다.",
      fileNo: newFileNo,
    });
  } catch (err) {
    // 8. [롤백] 하나라도 실패하면 모두 되돌림
    if (conn) await conn.rollback();

    console.error("DB 등록 트랜잭션 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  } finally {
    // 9. [반환] 커넥션을 풀에 반환
    if (conn) conn.release();
  }
});

// 🚨 [삭제]
// dataBoardRouter와 관련 없는 'POST /' (survey 등록) 로직 삭제

// 🚨 [삭제]
// dataBoardRouter와 관련 없는 'GET /detail/:id' (survey 상세) 로직 삭제

module.exports = router;

const db = require("../database/mappers/mapper");

// [v13 수정] KST(서버 로컬 시간) 기준 'HH:MM'
function formatToTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// [v13 수정] KST(서버 로컬 시간) 기준 'YYYY-MM-DD'
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * [v12 수정] 30분 단위 시간 슬롯 생성 로직 (사용자 요구사항 반영)
 */
module.exports.getAvailableSchedules = async (req, res) => {
  // [로그 복원]
  console.log("--- getAvailableSchedules Service ---");
  try {
    // [v12 수정] staff_id도 함께 조회합니다.
    const schedules = await db.query("getAvailableSchedules");
    // [로그 복원]
    console.log("DB Result (getAvailableSchedules):", schedules);

    const formattedSchedules = {};
    const thirtyMinutes = 30 * 60 * 1000; // 30분을 밀리초로

    // 2. 각 스케줄 블록(at_no)을 30분 단위 슬롯으로 분해합니다.
    schedules.forEach((slot) => {
      const startDate = slot.start_time;
      const endDate = slot.end_time;

      // [로그 복원]
      console.log(
        `Processing block at_no ${slot.at_no}: ${startDate} to ${endDate}`
      );

      let currentTime = new Date(startDate.getTime());

      // 3. start_time부터 end_time 30분 전까지 30분 단위로 반복
      while (currentTime < endDate) {
        const dateKey = formatDateToISO(currentTime);
        const timeStr = formatToTime(currentTime);

        const timeObj = {
          time: timeStr, // "10:30"
          at_no: slot.at_no, // 9 (블록 ID)
          staff_id: slot.staff_id, // [v13 추가] staff_id
          // [v12 추가] 이 슬롯의 정확한 시작 시간을 식별자로 사용
          start_time_stamp: currentTime.toISOString(),
        };

        if (!formattedSchedules[dateKey]) {
          formattedSchedules[dateKey] = [];
        }
        formattedSchedules[dateKey].push(timeObj);

        // [v12 수정] 30분 증가 (break 제거)
        currentTime = new Date(currentTime.getTime() + thirtyMinutes);
      }
    });

    // [로그 복원]
    console.log("Formatted Response:", formattedSchedules);
    res.status(200).json(formattedSchedules);
  } catch (error) {
    console.error("스케줄 조회 오류:", error);
    res.status(500).send({ message: "스케줄 조회 중 오류가 발생했습니다." });
  }
};

/**
 * [v13 수정] 신규 상담 예약을 생성 (staff_id 처리)
 */
module.exports.createReservation = async (req, res) => {
  // [로그 복원]
  console.log("--- createReservation Service ---");
  try {
    // [v12 수정] at_no와 특정 start_time을 함께 받습니다.
    const { at_no, start_time_stamp } = req.body;
    // [로그 복원]
    console.log("Request Payload:", req.body);

    const user_id = "test"; // (임시 하드코딩)

    if (!at_no || !start_time_stamp) {
      return res
        .status(400)
        .send({
          message: "필수 정보(at_no, start_time_stamp)가 누락되었습니다.",
        });
    }

    // [v13 수정] 1. at_no로 staff_id를 조회합니다.
    console.log(`Executing Query: getStaffIdByAtNo with at_no = ${at_no}`);
    const staffResult = await db.query("getStaffIdByAtNo", [at_no]);

    if (!staffResult || staffResult.length === 0) {
      console.warn("Staff ID not found for at_no:", at_no);
      return res
        .status(404)
        .send({ message: "유효하지 않은 예약 블록입니다." });
    }

    const staff_id = staffResult[0].staff_id;
    console.log("Found staff_id:", staff_id);

    // [v13 수정] 2. reservation 테이블에 staff_id를 포함하여 삽입
    console.log(
      `Executing Query: createReservation with user_id = ${user_id}, at_no = ${at_no}, staff_id = ${staff_id}`
    );
    await db.query("createReservation", [user_id, at_no, staff_id]);

    // [v13 수정] 3. at_no 블록을 '예약'으로 변경합니다.
    // (참고: 이 로직은 10:00~15:00 블록 전체를 예약 상태로 바꿉니다.
    //  만약 10:30만 예약불가 처리하려면, 별도의 reservation_slot 테이블이 필요합니다.)
    console.log(`Executing Query: updateSlotStatus with at_no = ${at_no}`);
    const updateResult = await db.query("updateSlotStatus", [at_no]);

    if (updateResult.affectedRows === 0) {
      console.warn("Update failed: Slot already taken or does not exist.");
      // (참고: INSERT가 성공했으므로 409 대신 201을 반환하되, 경고를 남깁니다.)
    }

    console.log("Reservation successful (block reserved).");
    res.status(201).send({ message: "상담 예약이 완료되었습니다." });
  } catch (error) {
    console.error("예약 생성 오류:", error);
    res.status(500).send({ message: "예약 처리 중 오류가 발생했습니다." });
  }
};

// instituion 테이블에서 기관 정보를 가져옴

const selectInstitutions = {
  selectInstitutions: `SELECT institution_no, institution_name, phone, road_address, status FROM institution`,

  // 기관 상세보기 페이지
  selectInstitutionById: `SELECT institution_no, institution_name, phone, road_address, detail_address, status, updated_at, closed_at FROM institution WHERE institution_no = ?`,
};

module.exports = {
  selectInstitutions: `SELECT institution_no, institution_name, phone, road_address, status FROM institution`,
  selectInstitutionById: `SELECT institution_no, institution_name, phone, road_address, detail_address, status, updated_at, closed_at FROM institution WHERE institution_no = ?`,
};

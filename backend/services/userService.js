const mapper = require("../database/mappers/mapper");

const formatDate = (date) => {
  // toISOString() 결과: "2025-11-12T07:25:05.000Z"
  const isoString = date.toISOString();

  // T 문자를 기준으로 문자열을 나누어 첫 번째 요소(날짜)만 반환
  const formattedDate = isoString.split("T")[0];

  return formattedDate;
};

const getExpiringNotices = async () => {
  const userNoticesResult = await mapper.query("findExpiringNotices", []);
  const res = userNoticesResult.map((item) => {
    item.business_end = formatDate(item.business_end);
    return item;
  });
  return res;
};

const getSurveyToUserWard = async (userName) => {
  // 1. await로 DB 조회 결과를 '먼저' 받아옵니다. (결과: 배열)
  const surveyResults = await mapper.query("findSurveyToUserWard", userName);

  // 2. 받아온 '배열'에 .map()을 적용합니다.
  const res = surveyResults.map((item) => {
    item.updated_at = formatDate(item.updated_at);
    return item;
  });
  return res;
};
const getBoardList = async (searchParams) => {
  const { term, type } = searchParams;

  // 1. 검색어가 없는 경우, 전체 목록 조회
  if (!term) {
    const res = await mapper.query("findBoardList", []);
    return res;
  }

  // 2. 검색어가 있는 경우
  if (type === "hashtag") {
    // 해시태그 검색: 파라미터를 '%#검색어%' 형태로 가공
    const hashtagTerm = `%#${term}%`;
    const res = await mapper.query("findBoardListByHashtag", [hashtagTerm]);
    return res;
  } else {
    // 일반 검색: 파라미터를 '%검색어%' 형태로 가공
    const searchTerm = `%${term}%`;
    const res = await mapper.query("findBoardListByData", [
      searchTerm,
      searchTerm,
    ]);
    return res;
  }
};

module.exports = { getExpiringNotices, getSurveyToUserWard, getBoardList };

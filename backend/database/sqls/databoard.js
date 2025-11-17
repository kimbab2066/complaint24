const dataBoard = `select 
board_no
, institution_name
, category
, writer
, title
, content
, hashtag
, file_no
, created_at
, updated_at
from board`;

const boardInsert = `
  INSERT INTO board (institution_name, writer, title, file_no, created_at)
  VALUES (?, ?, ?, ?, now())
`;

module.exports = {
  boardInsert,
  dataBoard,
};

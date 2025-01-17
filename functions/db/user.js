const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addUser = async (client, email, username, idFirebase) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    INSERT INTO "user"
    (email, username, id_firebase, created_at, updated_at)
    VALUES
    ($1, $2, $3, $4, $4)
    RETURNING id, username, email, id_firebase, created_at, updated_at
    `,
    [email, username, idFirebase, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByIdFirebase = async (client, idFirebase) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id_firebase = $1
    
    `,
    [idFirebase],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByEmail = async (client, email) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE email = $1
    
    `,
    [email],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const setUserToken = async (client, user, accessToken) => {
  const now = dayjs().add(9, 'hour');
  const { rows: existingRows } = await client.query(
    `
    SELECT * FROM "user"
    WHERE id = $1
    
    `,
    [user.id],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), { accessToken });

  const { rows } = await client.query(
    `
    UPDATE "user" 
    SET access_token = $1, updated_at = $3
    WHERE id = $2
    RETURNING * 
    `,
    [data.accessToken, user.id, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findUserByName = async (client, username) => {
  const { rows } = await client.query(
    `
    SELECT id as member_id, username as member_name FROM "user"
    WHERE username = $1

    `,
    [username],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findUserNameById = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT username FROM "user"
    WHERE id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addUser, findUserById, findUserByIdFirebase, findUserByEmail, setUserToken, findUserByName, findUserNameById };

const dayjs = require('dayjs');
const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const findMember = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT id as group_id, member_id, member_name FROM "send_group"
    WHERE user_id = $1 AND is_okay = true
    ORDER BY created_at
    
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findAllMemberByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT s.id as group_id, s.user_id, u.username, s.is_okay, s.is_send, s.created_at, s.updated_at
    FROM send_group as s
    left join "user" u on u.id = s.user_id
    WHERE s.member_id = $1
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findSendGroup = async (client, senderId, memberId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "send_group"
    WHERE user_id = $1 AND member_id = $2 AND is_okay IS NULL  
    `,
    [senderId, memberId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const findSendGroupBySendGroupId = async (client, sendGroupId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "send_group"
    WHERE id = $1 
    `,
    [sendGroupId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const findSendGroupIsOkay = async (client, senderId, memberId) => {
  const { rows } = await client.query(
    `
    SELECT * FROM "send_group"
    WHERE user_id = $1 AND member_id = $2 AND is_okay = true  
    `,
    [senderId, memberId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const addSendGroup = async (client, senderId, memberId, memberName) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    WITH send_group AS (
      INSERT INTO "send_group"
      (user_id, member_id, member_name, created_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $4) 
      RETURNING *
    ) SELECT
     send_group.id as send_group_id
     , user_id as sender_id, su.username as sender_name
     , member_id, ru.username as member_name
     , is_send, is_okay, send_group.created_at
     FROM send_group
    LEFT JOIN "user" su ON su.id = send_group.user_id
    LEFT JOIN "user" ru ON ru.id = send_group.member_id
    
    `,
    [senderId, memberId, memberName, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateMemberName = async (client, memberName, groupId) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    UPDATE send_group
    SET member_name = $1, updated_at = $2
    WHERE id = $3
    RETURNING id as group_id, user_id, member_id, member_name 
    
    `,
    [memberName, now, groupId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const updateSendGroup = async (client, sendGroupId, isOkay) => {
  const now = dayjs().add(9, 'hour');
  const { rows } = await client.query(
    `
    WITH send_group AS (
      UPDATE "send_group"
      SET is_okay = $1, updated_at = $3
      WHERE id = $2
      RETURNING *
    ) SELECT
     send_group.id as send_group_id
     , user_id as sender_id, su.username as sender_name
     , member_id, ru.username as member_name
     , is_send, is_okay, send_group.updated_at
     FROM send_group
    LEFT JOIN "user" su ON su.id = send_group.user_id
    LEFT JOIN "user" ru ON ru.id = send_group.member_id
    
    `,
    [isOkay, sendGroupId, now],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { findMember, findAllMemberByUserId, updateMemberName, addSendGroup, findSendGroup, findSendGroupBySendGroupId, updateSendGroup, findSendGroupIsOkay };

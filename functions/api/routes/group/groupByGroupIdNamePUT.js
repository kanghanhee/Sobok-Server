const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { groupDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { groupId } = req.params;
  const { memberName } = req.body;

  if (!groupId || !memberName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    // 공유 요청한 사람 id와 유저의 id가 같은지 확인
    const findGroup = await groupDB.findSendGroupBySendGroupId(client, groupId);
    const findGroupUser = findGroup.userId;

    if (findGroupUser !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    const updateMemberName = await groupDB.updateMemberName(client, memberName, groupId);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_MEMBER_NAME, updateMemberName));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};

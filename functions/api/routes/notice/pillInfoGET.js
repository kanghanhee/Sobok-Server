const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');

const { sendPillDB, userDB } = require('../../../db');
const { scheduleDB } = require('../../../db');

module.exports = async (req, res) => {
  const { user } = req.header;
  const { senderId, receiverId, createdAt } = req.query;

  if (!senderId || !receiverId || !createdAt) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const findSendPill = await sendPillDB.getsendPillByCreatedAt(client, senderId, receiverId, createdAt);

    if (findSendPill.length === 0) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_PILL_SEND));

    const findReceiver = findSendPill[0].receiverId;
    if (findReceiver !== user.id) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTHENTICATED));

    if (findSendPill[0].isOkay !== null) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.ALREADY_PILL_ACCEPT));

    const senderName = await userDB.findUserNameById(client, senderId);

    let pillData = [];

    for (let pillCount = 0; pillCount < findSendPill.length; pillCount++) {
      let pillInfo = await scheduleDB.findScheduleByPillId(client, findSendPill[pillCount].pillId);
      let pillTime = await scheduleDB.findScheduleTimeByPillId(client, findSendPill[pillCount].pillId);
      let scheduleTime = [];

      pillData.push(pillInfo[0]);
      for (let timeCount = 0; timeCount < pillTime.length; timeCount++) {
        scheduleTime.push(pillTime[timeCount].scheduleTime);
      }
      scheduleTime.sort();
      pillData[pillCount].scheduleTime = scheduleTime;
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.PILL_GET_SUCCESS, { senderName: senderName[0].username, pillData }));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.header.user ? `uid:${req.header.user.id}` : 'req.user 없음'} ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};

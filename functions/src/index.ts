import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.pass;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPass,
  },
});

export const sendSleepLogReport = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    // ✅ Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const babyId = data.babyId;
    const uid = context.auth.uid;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = admin.firestore.Timestamp.fromDate(today);

    const babyDoc = await db.collection("babies").doc(babyId).get();
    const baby = babyDoc.data();

    if (!baby || !baby.parentEmail) {
      throw new functions.https.HttpsError("not-found", "Baby or parent email not found.");
    }

    const logsSnap = await db
      .collection("sleepChecks")
      .where("babyId", "==", babyId)
      .where("timestamp", ">=", startOfDay)
      .orderBy("timestamp", "asc")
      .get();

    const logs = logsSnap.docs.map((doc) => doc.data());

    if (logs.length === 0) {
      throw new functions.https.HttpsError("not-found", "No sleep logs found for today.");
    }

    const formattedLog = logs
      .map((log: any) => {
        const time = log.timestamp.toDate().toLocaleTimeString();
        const position = log.position || "Unknown";
        return `${time} - ${log.type.toUpperCase()} - Position: ${position}`;
      })
      .join("\n");

    const mailOptions = {
      from: `Sleep Log App <${gmailEmail}>`,
      to: baby.parentEmail,
      subject: `🛏️ Sleep Log for ${baby.name} - ${today.toDateString()}`,
      text: `Hello 👋,\n\nHere is the sleep log for ${baby.name}:\n\n${formattedLog}\n\n— Sleep Log App`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Report sent to ${baby.parentEmail}`);

    return { success: true };
  }
);

export const sendSleepLogReportForDate = functions.https.onCall(
  async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { babyId, date } = data; // date in format 'YYYY-MM-DD'
    const uid = context.auth.uid;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = admin.firestore.Timestamp.fromDate(targetDate);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayTimestamp = admin.firestore.Timestamp.fromDate(endOfDay);

    const babyDoc = await db.collection("babies").doc(babyId).get();
    const baby = babyDoc.data();

    if (!baby || !baby.parentEmail) {
      throw new functions.https.HttpsError("not-found", "Baby or parent email not found.");
    }

    const logsSnap = await db
      .collection("sleepChecks")
      .where("babyId", "==", babyId)
      .where("timestamp", ">=", startOfDay)
      .where("timestamp", "<=", endOfDayTimestamp)
      .orderBy("timestamp", "asc")
      .get();

    const logs = logsSnap.docs.map((doc) => doc.data());

    if (logs.length === 0) {
      throw new functions.https.HttpsError("not-found", `No sleep logs found for ${date}.`);
    }

    const formattedLog = logs
      .map((log: any) => {
        const time = log.timestamp.toDate().toLocaleTimeString();
        const position = log.position || "Unknown";
        return `${time} - ${log.type.toUpperCase()} - Position: ${position}`;
      })
      .join("\n");

    const mailOptions = {
      from: `Sleep Log App <${gmailEmail}>`,
      to: baby.parentEmail,
      subject: `🛏️ Sleep Log for ${baby.name} - ${targetDate.toDateString()}`,
      text: `Hello 👋,\n\nHere is the sleep log for ${baby.name} on ${date}:\n\n${formattedLog}\n\n— Sleep Log App`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Report for ${date} sent to ${baby.parentEmail}`);

    return { success: true };
  }
);

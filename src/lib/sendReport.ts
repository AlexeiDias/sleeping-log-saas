import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase"; // <-- your Firebase app's functions export

export const sendReport = async ({ babyId, date }: { babyId: string; date?: string }) => {
  const callable = httpsCallable(functions, "sendSleepLogReport");
  const result = await callable({ babyId, date });
  return result.data;
};



export async function sendArchivedReport({ babyId, date }: { babyId: string, date: string }) {
  const sendSleepLogReportForDate = httpsCallable(functions, "sendSleepLogReportForDate");
  await sendSleepLogReportForDate({ babyId, date });
}

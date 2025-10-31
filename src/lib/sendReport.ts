import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase"; // <-- your Firebase app's functions export

export const sendReport = async ({ babyId, date }: { babyId: string; date?: string }) => {
  const callable = httpsCallable(functions, "sendSleepLogReport");
  const result = await callable({ babyId, date });
  return result.data;
};



export const sendArchivedReport = async ({
  babyId,
  date,
}: {
  babyId: string;
  date: string;
}) => {
  const send = httpsCallable(functions, "sendArchivedReport");
  const res = await send({ babyId, date });
  return res.data;
};

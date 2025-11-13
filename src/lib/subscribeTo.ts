// src/lib/subscribeTo.ts
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

type Filter = [string, FirebaseFirestore.WhereFilterOp, any];

export function subscribeTo(
  collectionName: string,
  callback: (data: any[]) => void,
  options?: {
    filters?: Filter[];
    order?: string[];
  }
) {
  const ref = collection(db, collectionName);
  let q: any = query(ref);

  if (options?.filters) {
    options.filters.forEach((f) => {
      q = query(q, where(...f));
    });
  }

  if (options?.order) {
    options.order.forEach((field) => {
      q = query(q, orderBy(field, 'desc'));
    });
  }

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
}

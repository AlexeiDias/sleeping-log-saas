import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import  storage  from './firebase';

/**
 * Upload a photo to Firebase Storage and return the download URL.
 * @param file The File object (image)
 * @param folder Optional folder name (e.g. 'feedingLogs')
 * @param userId Optional user or log identifier for filename
 */
export async function uploadPhoto(
  file: File,
  folder = 'logs',
  userId?: string
): Promise<string> {
  if (!file) throw new Error('No file provided');

  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const filename = `${userId || 'anon'}_${timestamp}.${ext}`;
  const storageRef = ref(storage, `${folder}/${filename}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      () => {},
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

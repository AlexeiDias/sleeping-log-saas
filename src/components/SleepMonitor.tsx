'use client';

import { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  babyId: string;
  caretakerId: string;
};

export function SleepMonitor({ babyId, caretakerId }: Props) {
  const [timer, setTimer] = useState(0); // in seconds
  const [running, setRunning] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  // Start timer
  const handleStart = async () => {
    const position = prompt('🛌 What is the baby’s position? (Back / Side / Tummy)');
    if (!position) return;

    setTimer(0);
    setRunning(true);
    setAlarmTriggered(false);

    await logCheck(position, 'start');
  };

  // Restart timer
  const handleRestart = async () => {
    const position = prompt('🛌 Baby checked! What is the position? (Back / Side / Tummy)');
    if (!position) return;

    setTimer(0);
    setAlarmTriggered(false);

    await logCheck(position, 'check');
  };

  // Stop timer
  const handleStop = async () => {
    const position = prompt('👶 Baby is awake. Final position?');
    if (!position) return;

    setRunning(false);
    setTimer(0);
    setAlarmTriggered(false);

    await logCheck(position, 'stop');
  };

  const logCheck = async (position: string, type: 'start' | 'check' | 'stop') => {
    try {
      await addDoc(collection(db, 'sleepChecks'), {
        babyId,
        caretakerId,
        position,
        type,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to log sleep check:', err);
    }
  };

  // Timer logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Alarm trigger after 10 minutes (600 seconds)
  useEffect(() => {
    if (timer >= 600 && !alarmTriggered) {
      setAlarmTriggered(true);
      playAlarm();
    }
  }, [timer, alarmTriggered]);

  const playAlarm = () => {
    if (!alarmAudio.current) {
      alarmAudio.current = new Audio('/alarm.mp3'); // Add your own alert sound here
    }
    alarmAudio.current.play().catch(console.error);
    alert('🚨 CHECK THE BABY! 10 minutes passed since last check.');
  };

  // Format time
  const formatTime = (t: number) => {
    const min = Math.floor(t / 60).toString().padStart(2, '0');
    const sec = (t % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-mono">
        Timer: <span className="text-blue-600">{formatTime(timer)}</span>
      </p>

      <div className="flex gap-4">
        <button
          onClick={handleStart}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ▶️ Start
        </button>
        <button
          onClick={handleRestart}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          🔁 Restart
        </button>
        <button
          onClick={handleStop}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          ⏹️ Stop
        </button>
      </div>
    </div>
  );
}

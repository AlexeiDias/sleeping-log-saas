'use client';

import { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PositionPickerModal from './PositionPickerModal';
import BabyMoodModal from './BabyMoodModal';

type Props = {
  babyId: string;
  caretakerId: string;
};

export function SleepMonitor({ babyId, caretakerId }: Props) {
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [pendingStop, setPendingStop] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<string | null>(null);

  // Ask position and start
  const handleStart = () => {
    setPendingStop(false);
    setShowPositionModal(true);
  };

  const handleRestart = () => {
    setPendingStop(false);
    setShowPositionModal(true);
  };

  const handleStop = () => {
    setPendingStop(true);
    setShowPositionModal(true);
  };

  const handlePositionSelected = async (position: string) => {
    if (!pendingStop) {
      // Start or restart
      if (!running) setRunning(true);
      if (pendingStop === false) setTimer(0);
      setAlarmTriggered(false);
      await logCheck(position, running ? 'check' : 'start');
    } else {
      // Stop requires next step: mood
      setPendingPosition(position);
      setShowMoodModal(true);
    }
    setShowPositionModal(false);
  };

  const handleMoodSelected = async (mood: string) => {
    if (!pendingPosition) return;

    await logCheck(pendingPosition, 'stop', mood);
    setTimer(0);
    setRunning(false);
    setAlarmTriggered(false);

    setPendingPosition(null);
    setPendingStop(false);
  };

  const logCheck = async (position: string, type: 'start' | 'check' | 'stop', mood?: string) => {
    try {
      await addDoc(collection(db, 'sleepChecks'), {
        babyId,
        caretakerId,
        position,
        type,
        mood: mood || null,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to log sleep check:', err);
    }
  };

  // Timer logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Alarm trigger after 10 minutes
  useEffect(() => {
    if (timer >= 600 && !alarmTriggered) {
      setAlarmTriggered(true);
      playAlarm();
    }
  }, [timer, alarmTriggered]);

  const playAlarm = () => {
    if (!alarmAudio.current) {
      alarmAudio.current = new Audio('/alarm.mp3');
    }
    alarmAudio.current.play().catch(console.error);
    alert('🚨 CHECK THE BABY! 10 minutes passed since last check.');
  };

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
        {!running ? (
          <button
            onClick={handleStart}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ▶️ Start
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>

      <PositionPickerModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onSelect={handlePositionSelected}
        positions={
          pendingStop
            ? ['Back', 'Side', 'Tummy', 'Sitting', 'Standing']
            : ['Back', 'Side', 'Tummy']
        }
      />

      <BabyMoodModal
        isOpen={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSelect={handleMoodSelected}
      />
    </div>
  );
}

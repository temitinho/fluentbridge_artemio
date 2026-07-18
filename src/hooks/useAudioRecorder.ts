import { useState, useRef, useEffect } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((value: { blob: Blob; mimeType: string } | null) => void) | null>(null);

  const startRecording = async () => {
    setError(null);
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let message = "Error accessing microphone. Please check your permissions and devices.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = "Microphone access denied. Please click the camera/microphone icon in your browser's address bar to allow access and refresh the page.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = "No microphone found. Please connect a microphone and try again.";
      }
      setError(message);
    }
  };

  const stopRecording = (): Promise<{
    blob: Blob;
    mimeType: string;
  } | null> => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setIsRecording(false);
        setRecordingTime(0);

        // Stop all tracks
        mediaRecorderRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop());
        mediaRecorderRef.current = null;

        resolve({ blob, mimeType });
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, error, recordingTime, startRecording, stopRecording };
}

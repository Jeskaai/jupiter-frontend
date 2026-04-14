import React, { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import './EvaluationRoom.css';

type RecordingState = 'idle' | 'recording' | 'paused';

const EvaluationRoom: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };

        mediaRecorderRef.current = mediaRecorder;
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to access devices');
        setIsLoading(false);
      }
    };
    initializeCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [recordingState]);

  const handleStartRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'idle') {
      chunksRef.current = [];
      setDuration(0);
      mediaRecorderRef.current.start();
      setRecordingState('recording');
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState !== 'idle') {
      mediaRecorderRef.current.stop();
      setRecordingState('idle');
    }
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="evaluation-room loading"><p>Iniciando cámara...</p></div>;
  if (error) return <div className="evaluation-room error"><h2>Error de Acceso</h2><p>{error}</p></div>;

  return (
    <div className="evaluation-room">
      <div className="header">
        <h1>Sala de Evaluación</h1>
        <p>Graba tu presentación aquí</p>
      </div>
      <div className="main-content">
        <div className="video-container">
          <video ref={videoRef} autoPlay muted playsInline className="video-stream" />
          {recordingState !== 'idle' && <div className={`recording-indicator ${recordingState}`}>REC</div>}
        </div>
        <div className="controls-panel">
          <div className="timer"><span className="timer-value">{formatDuration(duration)}</span></div>
          <div className="buttons-group">
            <Button onClick={handleStartRecording} disabled={recordingState !== 'idle'}>▶ Iniciar Grabación</Button>
            <Button onClick={recordingState === 'recording' ? handlePauseRecording : handleResumeRecording} disabled={recordingState === 'idle'}>
              {recordingState === 'recording' ? '⏸ Pausar' : '▶ Reanudar'}
            </Button>
            <Button onClick={handleStopRecording} disabled={recordingState === 'idle'} variant="outline">⏹ Finalizar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationRoom;

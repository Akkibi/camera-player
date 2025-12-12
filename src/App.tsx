import { useState, useRef, useEffect } from 'react';
import { AudioPlayerManager } from './audioPlayerManager';

// Define the type for the camera mode
type CameraMode = 'user' | 'environment';

function App() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  // Default to 'user' (front camera), switchable to 'environment' (back camera)
  const [facingMode, setFacingMode] = useState<CameraMode>('user');
  const [isAudioActive, setIsAudioActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerManagerRef = useRef<AudioPlayerManager>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Use a ref to track audio active state without triggering re-renders
  const isAudioActiveRef = useRef(false);

  useEffect(() => {
    if (!audioPlayerManagerRef.current) {
      audioPlayerManagerRef.current = AudioPlayerManager.getInstance();
    }

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Stop any existing tracks on the video element before starting a new one
        if (videoRef.current && videoRef.current.srcObject) {
            const oldStream = videoRef.current.srcObject as MediaStream;
            oldStream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
            // Update constraints to use the selected facingMode
            video: { facingMode: facingMode },
            audio: false
        });
        stream = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Video play failed:", e));
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
        setIsCameraActive(false);
      }
    };

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !audioPlayerManagerRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error("2D context not supported");
        return;
      }

      // Ensure canvas matches video dimensions
      canvas.width = video.videoWidth || video.clientWidth;

      // Draw a 1px slice from the center of the video or specific line
      ctx.drawImage(video, 0, 0, canvas.width, 1, 0, 0, canvas.width, 1);

      const imageData = ctx.getImageData(0, 0, canvas.width, 1);
      const data = imageData.data;

      const greenChannelData: Uint8ClampedArray = new Uint8ClampedArray(canvas.width);
      for (let i = 0; i < canvas.width; i++) {
        greenChannelData[i] = data[4 * i + 1];
      }

      audioPlayerManagerRef.current.playGreenDataAsAudio(greenChannelData);
    };

    let lastTime = 0;
    const FPS_LIMIT = 30;

    const renderLoop = (time: DOMHighResTimeStamp) => {
      if (!isCameraActive || !isAudioPlaying) {
        animationFrameIdRef.current = null;
        return;
      }

      if (time - lastTime > (1000 / FPS_LIMIT)) {
        // Check the ref instead of state
        if (isAudioActiveRef.current) {
          processFrame();
        }
        lastTime = time;
      }
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    if (isCameraActive) {
      startCamera();
    }

    // Start the loop if both camera and audio are active
    if (isCameraActive && isAudioPlaying && !animationFrameIdRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, isAudioPlaying, facingMode]);

  const handleCameraToggle = () => {
    setIsCameraActive(prev => !prev);
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleAudioPlay = () => {
    if (!audioPlayerManagerRef.current) {
      audioPlayerManagerRef.current = AudioPlayerManager.getInstance();
    }

    if (!isAudioPlaying) {
      audioPlayerManagerRef.current.initializeAudioContext();
    }

    setIsAudioPlaying(prev => !prev);
  };

  // Press and hold handlers
  const handleAudioPressStart = () => {
    isAudioActiveRef.current = true;
    setIsAudioActive(true);
  };

  const handleAudioPressEnd = () => {
    isAudioActiveRef.current = false;
    setIsAudioActive(false);
  };

  return (
    <>
      <div className='absolute inset-0 flex flex-col p-3 gap-3 bg-gray-950'>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className='flex-1 relative border-2 border-solid border-black bg-gray-900 rounded-2xl p-5 overflow-hidden'>
          {isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className='absolute inset-0 object-cover w-full h-full'
            />
          )}
          {!isCameraActive && (
            <div className='flex items-center justify-center h-full text-2xl font-bold opacity-50 text-white'>
              Camera is off
            </div>
          )}

          {/* Controls Container */}
          <div className='absolute bottom-2 left-2 right-2 flex justify-between'>
            {/* Switch Camera Button (Only visible if camera is active) */}
            {isCameraActive && (
                <button
                    onClick={handleSwitchCamera}
                    className='p-3 rounded-md bg-gray-800 text-white border border-gray-700 active:bg-gray-700'
                >
                    {facingMode === 'user' ? 'Switch to Back' : 'Switch to Front'}
                </button>
            )}

            {/* Toggle On/Off Button */}
            <button
                onClick={handleCameraToggle}
                className='p-3 rounded-md bg-gray-800 text-white border border-gray-700 active:bg-gray-700 ml-auto'
            >
                {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>

        {/* Press and hold audio button */}
        <div className='flex flex-col gap-2'>
          <button
            onClick={handleAudioPlay}
            className='flex-none py-4 bg-gray-800 rounded-xl text-xl font-black text-white active:bg-gray-700'
          >
            {isAudioPlaying ? 'Stop Audio' : 'Play Audio'}
          </button>

          <button
            onMouseDown={handleAudioPressStart}
            onMouseUp={handleAudioPressEnd}
            onMouseLeave={handleAudioPressEnd}
            onTouchStart={handleAudioPressStart}
            onTouchEnd={handleAudioPressEnd}
            className={`flex-none py-10 rounded-xl text-2xl font-black text-white transition-colors ${
              isAudioActive
                ? 'bg-green-600 active:bg-green-700'
                : 'bg-gray-800 active:bg-gray-700'
            }`}
            disabled={!isAudioPlaying}
          >
            {isAudioActive ? 'Recording Audio...' : 'Hold to Record'}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;

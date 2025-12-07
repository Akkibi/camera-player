import { useState, useRef, useEffect } from 'react';
import { AudioPlayerManager } from './audioPlayerManager';

function App() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  // 1. Create a ref to attach to the <video> element
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerManagerRef = useRef<AudioPlayerManager>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);


useEffect(() => {
      if (!audioPlayerManagerRef.current) {
        audioPlayerManagerRef.current = AudioPlayerManager.getInstance();
      }

      let stream: MediaStream | null = null;

      const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          stream = mediaStream;

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            // Just play the video, don't initialize audio here anymore
            videoRef.current.play().catch(e => console.error("Video play failed:", e));
          }
        } catch (err) {
          console.error("Error accessing the camera: ", err);
          setIsCameraActive(false);
        }
      };

      const processFrame = () => {
        if (!videoRef.current || !canvasRef.current || !audioPlayerManagerRef.current || !isCameraActive || !isAudioPlaying) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
              console.error("2D context not supported");
              return;
          }

          // 1. Ensure canvas matches video dimensions
          canvas.width = video.videoWidth || video.clientWidth;
          canvas.height = 1; // We only need the first line's height!

          // 2. Draw the current video frame onto the canvas
          ctx.drawImage(video, 0, 0, canvas.width, 1, 0, 0, canvas.width, 1);

          // 3. Get pixel data (The width is the width of the first line)
          const imageData = ctx.getImageData(0, 0, canvas.width, 1);
          const data = imageData.data; // This is a Uint8ClampedArray [R, G, B, A, R, G, B, A, ...]

          // 4. Extract ONLY the Green channel data
          const greenChannelData: Uint8ClampedArray = new Uint8ClampedArray(canvas.width);
          for (let i = 0; i < canvas.width; i++) {
              // Green is at index 4*i + 1 in the RGBA array
              greenChannelData[i] = data[4 * i + 1];
          }

          // 5. Play the extracted data as audio
          audioPlayerManagerRef.current.playGreenDataAsAudio(greenChannelData);
      };

      let lastTime = 0;
      const FPS_LIMIT = 30;

      const renderLoop = (time: DOMHighResTimeStamp) => {
        if (isCameraActive) { // Only continue looping if camera is supposed to be active
          if (time - lastTime > (1000 / FPS_LIMIT)) {
              processFrame(); // processFrame now checks isAudioPlaying
              lastTime = time;
          }
          animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        }
      };

      const startProcessingLoop = () => {
        // Start the loop if BOTH conditions are met AND it's not already running
        if (isCameraActive && isAudioPlaying && !animationFrameIdRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        } else if ((!isAudioPlaying || !isCameraActive) && animationFrameIdRef.current) {
          // Stop the loop if either condition is false AND it's running
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      };

      if (isCameraActive) {
          startCamera();
      }

      startProcessingLoop();

      // Cleanup function
      return () => {
              if (stream) {
                  stream.getTracks().forEach(track => track.stop());
              }
              if (animationFrameIdRef.current !== null) {
                  cancelAnimationFrame(animationFrameIdRef.current);
                  animationFrameIdRef.current = null; // Important to reset
              }
          };
  }, [isCameraActive, isAudioPlaying]);// Re-run the effect only when isCameraActive changes

  const handleCameraToggle = () => {
    setIsCameraActive(prev => !prev);
  };

  const handleAudioPlay = () => {
    // Ensure AudioPlayerManager instance exists
    if (!audioPlayerManagerRef.current) {
        audioPlayerManagerRef.current = AudioPlayerManager.getInstance();
    }

    // *** CRITICAL FIX: Initialize AudioContext on the first user press ***
    if (!isAudioPlaying) {
        audioPlayerManagerRef.current.initializeAudioContext();
    }

    // Toggle the state, which will then trigger the useEffect to start/stop the loop
    setIsAudioPlaying(prev => !prev);
  }

  return (
    <>
      <div className='absolute inset-0 flex flex-col p-3 gap-3 bg-gray-950'>
        {/* The video element to display the camera feed */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className='flex-1 relative border-2 border-solid border-black bg-gray-900 rounded-2xl p-5'>
        {isCameraActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline // Important for some mobile browsers
            className='absolute inset-0 object-center bg-center w-full h-full'
          />
        )}
        {!isCameraActive && (
            <div className='text-2xl font-bold opacity-50'>Camera is off</div>
        )}
        <button onClick={handleCameraToggle} className='flex-none p-3 absolute bottom-2 right-2 rounded-md bg-gray-800'>
        {isCameraActive ? 'Stop Camera' : 'Start Camera'}
      </button>
        </div>
      <button onClick={handleAudioPlay} className='flex-none py-10 bg-gray-800 rounded-xl text-2xl font-black'>
        {isAudioPlaying ? 'Stop' : 'Play'}
      </button>
      </div>
    </>
  );
}

export default App;

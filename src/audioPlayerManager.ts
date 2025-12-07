
interface CustomWindow extends Window {
  webkitAudioContext: {
  new (contextOptions ?: AudioContextOptions): AudioContext;
  prototype: AudioContext;
}
}

export class AudioPlayerManager {
  private static instance: AudioPlayerManager;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null; // Useful for controlling volume

  private constructor() {
    // Initialize AudioContext on first use or when needed
  }

  static getInstance(): AudioPlayerManager {
    if (!AudioPlayerManager.instance) {
      AudioPlayerManager.instance = new AudioPlayerManager();
    }
    return AudioPlayerManager.instance;
  }

  /**
   * Initializes the AudioContext, which often requires user interaction.
   */
  public initializeAudioContext(): void {
    if (!this.audioContext) {
      // Use standard AudioContext constructor or the prefixed one for wider compatibility if needed
      this.audioContext = new (window.AudioContext || (window as Window as CustomWindow).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      // Start with volume low or muted
      this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    }
  }

  /**
     * Generates a sound buffer where the frequency and amplitude are modulated
     * by the green channel data from the camera feed, creating a more 'true' sound
     * based on image brightness/color.
     * @param greenData An array of 8-bit green channel values (0-255).
     */
    public playGreenDataAsAudio(greenData: Uint8ClampedArray): void {
      if (!this.audioContext) {
          console.error("AudioContext not initialized. Call initializeAudioContext() first.");
          return;
      }
      const smoothedData = this.applyMovingAverage(greenData, 3);

      const sampleRate = this.audioContext.sampleRate;
      // Define how many samples represent the data for one pixel's sound.
      // A higher number gives more resolution/duration per pixel.
      const samplesPerPixel = Math.floor(sampleRate * 0.001); // 50ms per pixel for demonstration
      const totalSamples = smoothedData.length * samplesPerPixel;

      const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate); // 1 channel (mono)
      const output = audioBuffer.getChannelData(0);

      // --- Configuration for Sound Mapping ---
      const MIN_FREQUENCY = 100;  // Lowest possible pitch (e.g., for green=0)
      const MAX_FREQUENCY = 1000; // Highest possible pitch (e.g., for green=255)
      const FREQUENCY_RANGE = MAX_FREQUENCY - MIN_FREQUENCY;

      // const MIN_PITCH_LOG = Math.log(MIN_FREQUENCY);
      // const MAX_PITCH_LOG = Math.log(MAX_FREQUENCY * 10);

      // --- Sound Generation Loop ---
      for (let i = 0; i < smoothedData.length; i++) {
          const greenValue = smoothedData[i];

          // 1. Map Green Value to Frequency (Pitch)
          // Map 0-255 to MIN_FREQUENCY to MAX_FREQUENCY
          const frequency = MIN_FREQUENCY + (greenValue / 255.0) * FREQUENCY_RANGE;
          // const frequency = MIN_PITCH_LOG + (greenValue / 255.0) * (MAX_PITCH_LOG - MIN_PITCH_LOG);

          // 2. Map Green Value to Amplitude (Volume)
          // Normalize 0-255 to 0.0-1.0 for volume control
        const amplitude = 1 - (greenValue / 255.0) * 0.5;

          // Calculate the angular increment (how much the sine wave phase changes per sample)
          const phaseIncrement = (frequency * 2 * Math.PI) / sampleRate;

          // Fill the corresponding audio samples
          for (let j = 0; j < samplesPerPixel; j++) {
              const sampleIndex = i * samplesPerPixel + j;

              if (sampleIndex >= totalSamples) break;

              // For this simple loop structure, we can calculate the phase offset based on the loop iteration:
              const currentPhase = (i * samplesPerPixel + j) * phaseIncrement;

              // The actual sample value is Sine(Phase) * Amplitude
              output[sampleIndex] = Math.sin(currentPhase) * amplitude;
          }
      }

      // --- Playback ---
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode!); // Connect to the gain node
      source.start(0); // Start immediately
    }

    /**
     * Applies a simple moving average filter to an array.
     * @param data The input array of numbers.
     * @param windowSize The size of the averaging window (must be an odd number for simple centering, but even works too).
     * @returns A new array with smoothed data.
     */
    applyMovingAverage(data: Uint8ClampedArray, windowSize: number = 3): Uint8ClampedArray {
        const smoothed = new Uint8ClampedArray(data.length);
        const halfWindow = Math.floor(windowSize / 2);

        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;

            // Iterate over the window centered around i
            for (let j = -halfWindow; j <= halfWindow; j++) {
                const neighborIndex = i + j;

                // Check bounds
                if (neighborIndex >= 0 && neighborIndex < data.length) {
                    sum += data[neighborIndex];
                    count++;
                }
            }
            // Calculate the average and store it, ensuring it stays within 0-255
            smoothed[i] = Math.min(255, Math.max(0, Math.round(sum / count)));
        }
        return smoothed;
    }

  public stopAudio(): void {
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
        this.gainNode = null;
      }
  }
}

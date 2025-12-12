
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
    // public playGreenDataAsAudio(greenData: Uint8ClampedArray): void {
    //   if (!this.audioContext) {
    //       console.error("AudioContext not initialized. Call initializeAudioContext() first.");
    //       return;
    //   }
    //   const smoothedData = this.applyMovingAverage(greenData, 3);

    //   const sampleRate = this.audioContext.sampleRate;
    //   // Define how many samples represent the data for one pixel's sound.
    //   // A higher number gives more resolution/duration per pixel.
    //   const samplesPerPixel = Math.floor(sampleRate * 0.001); // 50ms per pixel for demonstration
    //   const totalSamples = smoothedData.length * samplesPerPixel;

    //   const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate); // 1 channel (mono)
    //   const output = audioBuffer.getChannelData(0);

    //   // --- Configuration for Sound Mapping ---
    //   const MIN_FREQUENCY = 100;  // Lowest possible pitch (e.g., for green=0)
    //   const MAX_FREQUENCY = 1000; // Highest possible pitch (e.g., for green=255)
    //   const FREQUENCY_RANGE = MAX_FREQUENCY - MIN_FREQUENCY;

    //   // const MIN_PITCH_LOG = Math.log(MIN_FREQUENCY);
    //   // const MAX_PITCH_LOG = Math.log(MAX_FREQUENCY * 10);

    //   // --- Sound Generation Loop ---
    //   for (let i = 0; i < smoothedData.length; i++) {
    //       const greenValue = smoothedData[i];

    //       // 1. Map Green Value to Frequency (Pitch)
    //       // Map 0-255 to MIN_FREQUENCY to MAX_FREQUENCY
    //       const frequency = MIN_FREQUENCY + (greenValue / 255.0) * FREQUENCY_RANGE;
    //       // const frequency = MIN_PITCH_LOG + (greenValue / 255.0) * (MAX_PITCH_LOG - MIN_PITCH_LOG);

    //       // 2. Map Green Value to Amplitude (Volume)
    //       // Normalize 0-255 to 0.0-1.0 for volume control
    //     const amplitude = 1 - (greenValue / 255.0) * 0.5;

    //       // Calculate the angular increment (how much the sine wave phase changes per sample)
    //       const phaseIncrement = (frequency * 2 * Math.PI) / sampleRate;

    //       // Fill the corresponding audio samples
    //       for (let j = 0; j < samplesPerPixel; j++) {
    //           const sampleIndex = i * samplesPerPixel + j;

    //           if (sampleIndex >= totalSamples) break;

    //           // For this simple loop structure, we can calculate the phase offset based on the loop iteration:
    //           const currentPhase = (i * samplesPerPixel + j) * phaseIncrement;

    //           // The actual sample value is Sine(Phase) * Amplitude
    //           output[sampleIndex] = Math.sin(currentPhase) * amplitude;
    //       }
    //   }

    //   // --- Playback ---
    //   const source = this.audioContext.createBufferSource();
    //   source.buffer = audioBuffer;
    //   source.connect(this.gainNode!); // Connect to the gain node
    //   source.start(0); // Start immediately
    // }


    // public playGreenDataAsAudio(greenData: Uint8ClampedArray): void {
    //     if (!this.audioContext) {
    //         console.error("AudioContext not initialized. Call initializeAudioContext() first.");
    //         return;
    //     }

    //     const sampleRate = this.audioContext.sampleRate;

    //     // --- Edge Detection Configuration ---
    //     const THRESHOLD = 128; // Brightness threshold for dark vs light
    //     const SMOOTHING_WINDOW = 4; // Reduce noise

    //     // Smooth the data first
    //     const smoothedData = this.applyMovingAverage(greenData, SMOOTHING_WINDOW);

    //     // Detect edges (transitions from dark to light or light to dark)
    //     const edges: number[] = [];
    //     let previousState = smoothedData[0] > THRESHOLD;

    //     for (let i = 1; i < smoothedData.length; i++) {
    //         const currentState = smoothedData[i] > THRESHOLD;

    //         // If state changed, we found an edge
    //         if (currentState !== previousState) {
    //             edges.push(i);
    //             previousState = currentState;
    //         }
    //     }

    //     // If no edges detected, create silent buffer
    //     if (edges.length === 0) {
    //         const silentBuffer = this.audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
    //         const source = this.audioContext.createBufferSource();
    //         source.buffer = silentBuffer;
    //         source.connect(this.gainNode!);
    //         source.start(0);
    //         return;
    //     }

    //     // --- Audio Generation Configuration ---
    //     // Map pixel position to time
    //     const pixelsPerSecond = 1000; // Speed of "scanning"
    //     const totalDuration = smoothedData.length / pixelsPerSecond;
    //     const totalSamples = Math.floor(totalDuration * sampleRate);

    //     const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate);
    //     const output = audioBuffer.getChannelData(0);

    //     // --- Generate Click/Beep for Each Edge ---
    //     const CLICK_DURATION = 0.01; // 3ms click (very short!)
    //     const CLICK_FREQUENCY = 2000; // 2kHz beep frequency
    //     const clickSamples = Math.floor(CLICK_DURATION * sampleRate);

    //     for (const edgePosition of edges) {
    //         // Convert pixel position to time, then to sample index
    //         const timePosition = edgePosition / pixelsPerSecond;
    //         const startSample = Math.floor(timePosition * sampleRate);

    //         // Generate a short beep/click at this position
    //         for (let i = 0; i < clickSamples; i++) {
    //             const sampleIndex = startSample + i;
    //             if (sampleIndex >= totalSamples) break;

    //             // Create a click with exponential decay envelope
    //             const t = i / clickSamples;
    //             const envelope = Math.exp(-t * 8); // Quick decay

    //             // Generate sine wave for the beep
    //             const phase = (2 * Math.PI * CLICK_FREQUENCY * i) / sampleRate;

    //             // Add to output (allowing clicks to overlap/accumulate)
    //             output[sampleIndex] += Math.sin(phase) * envelope * 0.3;
    //         }
    //     }

    //     // Normalize to prevent clipping
    //     let maxAmplitude = 0;
    //     for (let i = 0; i < totalSamples; i++) {
    //         maxAmplitude = Math.max(maxAmplitude, Math.abs(output[i]));
    //     }
    //     if (maxAmplitude > 0) {
    //         for (let i = 0; i < totalSamples; i++) {
    //             output[i] /= maxAmplitude;
    //         }
    //     }

    //     // --- Playback ---
    //     const source = this.audioContext.createBufferSource();
    //     source.buffer = audioBuffer;
    //     source.connect(this.gainNode!);
    //     source.start(0);
    // }
    //
    public playGreenDataAsAudio(greenData: Uint8ClampedArray): void {
        if (!this.audioContext) {
            console.error("AudioContext not initialized. Call initializeAudioContext() first.");
            return;
        }

        const sampleRate = this.audioContext.sampleRate;

        // --- Edge Detection Configuration ---
        const THRESHOLD = 128; // Brightness threshold for dark vs light
        const SMOOTHING_WINDOW = 4; // Reduce noise

        // Smooth the data first
        const smoothedData = this.applyMovingAverage(greenData, SMOOTHING_WINDOW);

        // Detect edges and track distance between them
        interface Edge {
            position: number;
            transitionType: 'dark-to-light' | 'light-to-dark';
            pixelsSinceLast: number;
        }

        const edges: Edge[] = [];
        let previousState = smoothedData[0] > THRESHOLD;
        let lastEdgePosition = 0;

        for (let i = 1; i < smoothedData.length; i++) {
            const currentState = smoothedData[i] > THRESHOLD;

            // If state changed, we found an edge
            if (currentState !== previousState) {
                const transitionType = currentState ? 'dark-to-light' : 'light-to-dark';
                const pixelsSinceLast = i - lastEdgePosition;

                edges.push({
                    position: i,
                    transitionType,
                    pixelsSinceLast
                });

                lastEdgePosition = i;
                previousState = currentState;
            }
        }

        // If no edges detected, create silent buffer
        if (edges.length === 0) {
            const silentBuffer = this.audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
            const source = this.audioContext.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(this.gainNode!);
            source.start(0);
            return;
        }

        // --- Audio Generation Configuration ---
        const pixelsPerSecond = 1000;
        const totalDuration = smoothedData.length / pixelsPerSecond;
        const totalSamples = Math.floor(totalDuration * sampleRate);

        const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate);
        const output = audioBuffer.getChannelData(0);

        // --- Pitch Mapping Configuration ---
        const MIN_FREQUENCY = 200;  // Lowest pitch (more pixels)
        const MAX_FREQUENCY = 4000; // Highest pitch (fewer pixels)
        const MIN_PIXELS = 5;       // Minimum distance to consider
        const MAX_PIXELS = 200;     // Maximum distance for mapping

        const CLICK_DURATION = 0.01; // 10ms click
        const clickSamples = Math.floor(CLICK_DURATION * sampleRate);

        // --- Generate Click/Beep for Each Dark-to-Light Edge ---
        for (const edge of edges) {
            // Only generate sound for dark-to-light transitions
            if (edge.transitionType !== 'dark-to-light') continue;

            // Map pixel distance to frequency (inverse relationship)
            // Fewer pixels = higher pitch, more pixels = lower pitch
            const clampedPixels = Math.max(MIN_PIXELS, Math.min(MAX_PIXELS, edge.pixelsSinceLast));

            // Inverse mapping: normalize to 0-1, then invert
            const normalizedDistance = (clampedPixels - MIN_PIXELS) / (MAX_PIXELS - MIN_PIXELS);
            const invertedDistance = 1 - normalizedDistance;

            // Map to frequency range
            const frequency = MIN_FREQUENCY + (invertedDistance * (MAX_FREQUENCY - MIN_FREQUENCY));

            // Convert pixel position to time, then to sample index
            const timePosition = edge.position / pixelsPerSecond;
            const startSample = Math.floor(timePosition * sampleRate);

            // Generate a short beep/click at this position with calculated frequency
            for (let i = 0; i < clickSamples; i++) {
                const sampleIndex = startSample + i;
                if (sampleIndex >= totalSamples) break;

                // Create a click with exponential decay envelope
                const t = i / clickSamples;
                const envelope = Math.exp(-t * 8); // Quick decay

                // Generate sine wave for the beep with variable frequency
                const phase = (2 * Math.PI * frequency * i) / sampleRate;

                // Add to output (allowing clicks to overlap/accumulate)
                output[sampleIndex] += Math.sin(phase) * envelope * 0.3;
            }
        }

        // Normalize to prevent clipping
        let maxAmplitude = 0;
        for (let i = 0; i < totalSamples; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(output[i]));
        }
        if (maxAmplitude > 0) {
            for (let i = 0; i < totalSamples; i++) {
                output[i] /= maxAmplitude;
            }
        }

        // --- Playback ---
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.gainNode!);
        source.start(0);
    }

    // Helper method for moving average smoothing
    // private applyMovingAverage(data: Uint8ClampedArray, windowSize: number): Uint8ClampedArray {
    //     const smoothed = new Uint8ClampedArray(data.length);
    //     const halfWindow = Math.floor(windowSize / 2);

    //     for (let i = 0; i < data.length; i++) {
    //         let sum = 0;
    //         let count = 0;

    //         for (let j = -halfWindow; j <= halfWindow; j++) {
    //             const index = i + j;
    //             if (index >= 0 && index < data.length) {
    //                 sum += data[index];
    //                 count++;
    //             }
    //         }

    //         smoothed[i] = Math.round(sum / count);
    //     }

    //     return smoothed;
    // }

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

/**
 * Utility for handling PCM audio data for the Gemini Live API.
 * The API expects 16-bit PCM mono audio at 16kHz for input.
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;

  async start(onAudioData: (base64Data: string) => void) {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    
    // Load the worklet
    const workletCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const channelData = input[0];
            // Convert Float32 to Int16
            const pcmData = new Int16Array(channelData.length);
            for (let i = 0; i < channelData.length; i++) {
              const s = Math.max(-1, Math.min(1, channelData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
    
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor');
    
    this.processor.port.onmessage = (event) => {
      const arrayBuffer = event.data;
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );
      onAudioData(base64Data);
    };
    
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.source?.disconnect();
    this.processor?.disconnect();
  }
}

export class AudioPlayer {
  private audioContext: AudioContext;
  private nextStartTime: number = 0;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  async playChunk(base64Data: string) {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x8000;
    }
    
    const audioBuffer = this.audioContext.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  stop() {
    this.audioContext.close();
  }
}

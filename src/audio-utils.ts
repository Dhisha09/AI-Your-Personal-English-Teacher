// src/lib/audio-utils.ts

export class AudioProcessor {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start(onData: (base64: string) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext({ sampleRate: 16000 });
    const source = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
      }
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm.buffer)));
      onData(base64);
    };

    source.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.context?.close();
    this.stream?.getTracks().forEach(t => t.stop());
  }
}

export class AudioPlayer {
  private context = new AudioContext();

  async playChunk(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const buffer = await this.context.decodeAudioData(bytes.buffer);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start();
  }

  stop() {
    this.context.close();
  }
}

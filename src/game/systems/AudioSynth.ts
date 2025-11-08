function createWavHeader(sampleLength: number, sampleRate: number, numChannels: number, bytesPerSample: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const blockAlign = numChannels * bytesPerSample;

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + sampleLength * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, sampleLength * bytesPerSample, true);

  return new Uint8Array(buffer);
}

export function synthToneBase64({
  duration = 1,
  frequency = 220,
  sampleRate = 44100,
  volume = 0.4,
  type = 'sine'
}: {
  duration?: number;
  frequency?: number;
  sampleRate?: number;
  volume?: number;
  type?: 'sine' | 'square' | 'sawtooth';
}) {
  const numSamples = Math.floor(duration * sampleRate);
  const samples = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    let wave = Math.sin(2 * Math.PI * frequency * t);
    if (type === 'square') {
      wave = wave >= 0 ? 1 : -1;
    } else if (type === 'sawtooth') {
      wave = 2 * (t * frequency - Math.floor(0.5 + t * frequency));
    }
    samples[i] = Math.max(-1, Math.min(1, wave)) * 32767 * volume;
  }

  const header = createWavHeader(numSamples, sampleRate, 1, 2);
  const wavBuffer = new Uint8Array(header.length + samples.length * 2);
  wavBuffer.set(header, 0);

  for (let i = 0; i < samples.length; i += 1) {
    wavBuffer[44 + i * 2] = samples[i] & 0xff;
    wavBuffer[44 + i * 2 + 1] = (samples[i] >> 8) & 0xff;
  }

  if (typeof window === 'undefined') {
    const base64 = Buffer.from(wavBuffer).toString('base64');
    return `data:audio/wav;base64,${base64}`;
  }

  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < wavBuffer.length; i += chunk) {
    binary += String.fromCharCode(...wavBuffer.subarray(i, i + chunk));
  }

  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
}

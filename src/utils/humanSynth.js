let audioCtx = null;
let masterAnalyser = null;
let schedulerTimer = null;
let nextNoteTime = 0.0;
let step = 0;
let isPlaying = false;
let currentTrackId = null;
let noiseBuffer = null;

// Lazy initialization of AudioContext
export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Create a single analyzer for visualizer mapping
export const getMasterAnalyser = () => {
  const ctx = getAudioContext();
  if (!masterAnalyser) {
    masterAnalyser = ctx.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterAnalyser.connect(ctx.destination);
  }
  return masterAnalyser;
};

// Noise buffer for synth hi-hats
const getNoiseBuffer = (ctx) => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
};

// --- SYNTH INSTRUMENT SOUND GENERATORS ---

// 1. Kick Drum (thump)
const playKick = (ctx, time, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(output);

  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  osc.start(time);
  osc.stop(time + 0.16);
};

// 2. Hi-Hat (noise burst)
const playHiHat = (ctx, time, output) => {
  const bufferSource = ctx.createBufferSource();
  bufferSource.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);

  const gain = ctx.createGain();

  bufferSource.connect(filter);
  filter.connect(gain);
  gain.connect(output);

  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  bufferSource.start(time);
  bufferSource.stop(time + 0.09);
};

// 3. Bass Synth
const playBassNote = (ctx, time, freq, duration, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, time);
  filter.frequency.exponentialRampToValueAtTime(600, time + 0.1);
  filter.Q.setValueAtTime(3, time);

  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(output);

  osc.start(time);
  osc.stop(time + duration);
};

// 4. Lead Synth (melodic beep)
const playLeadNote = (ctx, time, freq, duration, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const delay = ctx.createDelay();
  const delayGain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  // Soft pitch slide
  osc.frequency.exponentialRampToValueAtTime(freq * 1.01, time + duration);

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);

  // Echo effect
  delay.delayTime.setValueAtTime(0.15, time);
  delayGain.gain.setValueAtTime(0.3, time);

  osc.connect(gain);
  gain.connect(output);

  // Connect echo loop
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(output);

  osc.start(time);
  osc.stop(time + duration);
};

// 5. Heartbeat Thump
const playHeartbeat = (ctx, time, output) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.setValueAtTime(60, time);
  osc.frequency.linearRampToValueAtTime(20, time + 0.2);

  gain.gain.setValueAtTime(1.2, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

  osc.connect(gain);
  gain.connect(output);

  osc.start(time);
  osc.stop(time + 0.26);
};

// 6. Drone synthesizer (Warm Pad)
const playDroneChord = (ctx, time, freqList, duration, output) => {
  freqList.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, time);
    // Slow sweeping filter
    filter.frequency.linearRampToValueAtTime(800, time + duration / 2);
    filter.frequency.linearRampToValueAtTime(300, time + duration);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.linearRampToValueAtTime(0.06, time + duration - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(output);

    osc.start(time);
    osc.stop(time + duration);
  });
};

// --- SEQUENCER PATTERNS ---

const schedulePlay = (trackId, stepIndex, time, ctx, output) => {
  if (trackId === 'synth-earth-radio') {
    // Standard 4/4 funny Earth Radio Beat: simple beeps & boops
    // Step is 0 to 15 (16th notes)

    // Kick on downbeats (0, 4, 8, 12)
    if (stepIndex % 4 === 0) {
      playKick(ctx, time, output);
    }

    // Hi-hat on offbeats (2, 6, 10, 14) or every 2nd step
    if (stepIndex % 4 === 2) {
      playHiHat(ctx, time, output);
    } else if (stepIndex % 8 === 6) {
      playHiHat(ctx, time, output);
    }

    // Bass notes (8th notes length)
    // Progression: C2 (step 0-3), Eb2 (step 4-7), G2 (step 8-11), F2 (step 12-15)
    const bassNotes = [65.41, 65.41, 77.78, 77.78, 97.99, 97.99, 87.31, 87.31];
    const bassFreq = bassNotes[Math.floor(stepIndex / 2)];
    if (stepIndex % 2 === 0) {
      playBassNote(ctx, time, bassFreq, 0.2, output);
    }

    // Lead melody pattern
    // Plays on specific steps
    const leadPattern = {
      0: 261.63,  // C4
      2: 329.63,  // E4
      4: 392.00,  // G4
      6: 440.00,  // A4
      8: 523.25,  // C5
      10: 440.00, // A4
      12: 392.00, // G4
      14: 329.63  // E4
    };
    if (leadPattern[stepIndex] !== undefined) {
      // 16th note beep
      playLeadNote(ctx, time, leadPattern[stepIndex], 0.12, output);
    }
  }

  else if (trackId === 'synth-heartbeat') {
    // Heartbeat double thump: step 0 (thump-thump), step 8 (thump-thump)
    if (stepIndex === 0 || stepIndex === 8) {
      playHeartbeat(ctx, time, output);
      playHeartbeat(ctx, time + 0.15, output);
    }

    // Slow sweeping pad chord on step 0
    if (stepIndex === 0) {
      // C Major 7 chord (C3, E3, G3, B3) -> 130.81, 164.81, 196.00, 246.94
      playDroneChord(ctx, time, [130.81, 164.81, 196.00, 246.94], 3.8, output);
    }
  }

  else if (trackId === 'synth-brainwaves') {
    // Brainwaves: Ambient drone & random humming
    if (stepIndex === 0) {
      // Warm chord: F minor 9 chord (F2, Ab2, C3, Eb3, G3) -> 87.31, 103.83, 130.81, 155.56, 196.00
      playDroneChord(ctx, time, [87.31, 103.83, 130.81, 155.56], 3.9, output);
    }
    // Ambient lead chime randomly on steps
    if (stepIndex % 5 === 0) {
      // Random harmonic scale note
      const harmonics = [261.63, 311.13, 349.23, 392.00, 466.16]; // C4 minor pentatonic
      const freq = harmonics[Math.floor(Math.random() * harmonics.length)];
      playLeadNote(ctx, time, freq * 1.5, 0.4, output);
    }
  }
};

// Scheduler loop
const scheduler = (trackId, ctx, output) => {
  const tempo = trackId === 'synth-earth-radio' ? 115.0 : 80.0;
  const secondsPerBeat = 60.0 / tempo;
  const stepLength = secondsPerBeat / 4; // 16th notes

  while (nextNoteTime < ctx.currentTime + 0.1) {
    schedulePlay(trackId, step, nextNoteTime, ctx, output);

    // Increment step
    nextNoteTime += stepLength;
    step = (step + 1) % 16;
  }

  schedulerTimer = setTimeout(() => scheduler(trackId, ctx, output), 25);
};

// --- MAIN SYNTH ACTIONS ---

let synthGainNode = null;

export const setSynthVolume = (vol) => {
  if (synthGainNode) {
    synthGainNode.gain.setValueAtTime(vol, getAudioContext().currentTime);
  }
};

export const playSynthTrack = (trackId, volume = 1.0) => {
  const ctx = getAudioContext();
  const analyser = getMasterAnalyser();

  stopSynthTrack();

  isPlaying = true;
  currentTrackId = trackId;
  step = 0;
  nextNoteTime = ctx.currentTime + 0.05;

  // Create gain node for active synth loop
  synthGainNode = ctx.createGain();
  synthGainNode.gain.setValueAtTime(volume, ctx.currentTime);
  synthGainNode.connect(analyser);

  scheduler(trackId, ctx, synthGainNode);
};

export const stopSynthTrack = () => {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
  if (synthGainNode) {
    try {
      synthGainNode.disconnect();
    } catch {
      // Ignore disconnection errors
    }
    synthGainNode = null;
  }
  isPlaying = false;
  currentTrackId = null;
};

export const isSynthPlaying = () => isPlaying;
export const getActiveSynthTrackId = () => currentTrackId;

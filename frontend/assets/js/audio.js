// ---------- generative ambient soundtrack (Web Audio API, no audio files) ----------
const musicToggle = document.getElementById('musicToggle');
let audioCtx, masterGain, noiseGain, musicTimer, isPlaying = false;
const SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C - pentatonic, lo-fi mood

function initAudio(){
audioCtx = new (window.AudioContext || window.webkitAudioContext)();

masterGain = audioCtx.createGain();
masterGain.gain.value = 0.045;
const warmth = audioCtx.createBiquadFilter();
warmth.type = 'lowpass';
warmth.frequency.value = 1400;
masterGain.connect(warmth);
warmth.connect(audioCtx.destination);
masterGain._out = warmth;

// soft vinyl-style noise bed for lo-fi character
const bufferSize = 2 * audioCtx.sampleRate;
const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
const data = buffer.getChannelData(0);
for(let i = 0; i < bufferSize; i++){ data[i] = (Math.random() * 2 - 1) * 0.025; }
const noise = audioCtx.createBufferSource();
noise.buffer = buffer;
noise.loop = true;
const noiseFilter = audioCtx.createBiquadFilter();
noiseFilter.type = 'highpass';
noiseFilter.frequency.value = 2800;
noiseGain = audioCtx.createGain();
noiseGain.gain.value = 0.35;
noise.connect(noiseFilter);
noiseFilter.connect(noiseGain);
noiseGain.connect(masterGain);
noise.start();
}

function playNote(freq, time, dur, gainAmt){
const osc = audioCtx.createOscillator();
osc.type = 'sine';
osc.frequency.value = freq;
const g = audioCtx.createGain();
g.gain.setValueAtTime(0, time);
g.gain.linearRampToValueAtTime(gainAmt, time + 0.08);
g.gain.exponentialRampToValueAtTime(0.001, time + dur);
osc.connect(g);
g.connect(masterGain);
osc.start(time);
osc.stop(time + dur + 0.05);
}

function scheduleLoop(){
const now = audioCtx.currentTime;
const noteDur = 1.1;
for(let i = 0; i < 4; i++){
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
    playNote(freq, now + i * noteDur, noteDur * 0.95, 0.5);
    // occasional soft bass note underneath
    if(i === 0) playNote(freq / 2, now, noteDur * 3.8, 0.25);
}
musicTimer = setTimeout(scheduleLoop, noteDur * 4 * 1000);
}

function toggleMusic(){
if(!audioCtx) initAudio();
if(isPlaying){
    clearTimeout(musicTimer);
    audioCtx.suspend();
    isPlaying = false;
} else {
    audioCtx.resume();
    scheduleLoop();
    isPlaying = true;
}
musicToggle.classList.toggle('playing', isPlaying);
musicToggle.setAttribute('aria-pressed', String(isPlaying));
}
musicToggle.addEventListener('click', toggleMusic);

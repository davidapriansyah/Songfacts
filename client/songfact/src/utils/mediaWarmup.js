let warmEl = null;
let warmed = false;

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// A ~50ms silent 16-bit mono PCM WAV. Playing it (muted) on the first real
// user gesture tells the browser this page actively uses media, so a later
// unmuted play() that lands after an async stream-URL resolve is not blocked.
function createSilentWavUrl() {
  const sampleRate = 16000;
  const samples = Math.floor(sampleRate * 0.05);
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export function warmUpMedia() {
  if (warmed) return true;
  try {
    if (!warmEl) {
      warmEl = new Audio(createSilentWavUrl());
      warmEl.muted = true;
      warmEl.volume = 0;
      warmEl.preload = "auto";
    }
    const p = warmEl.play();
    if (p) p.catch(() => {});
    warmed = true;
  } catch {}
  return warmed;
}

export function hasWarmedUpMedia() {
  return warmed;
}
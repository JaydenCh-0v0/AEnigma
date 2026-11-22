/** 程序化海浪氛围音：无需音频文件，首次用户手势后解锁。 */

export function createAmbient() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let enabled = false;
  let night = 0;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // 低沉海浪噪声
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.22;
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(master);
    noise.start();
    nodes.push({ filter, waveGain });

    // 轻风层
    const windBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const w = windBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) w[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = windBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 900;
    windFilter.Q.value = 0.4;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.04;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    wind.start();
    nodes.push({ windGain });
  }

  async function setEnabled(on) {
    ensure();
    if (!ctx) return false;
    if (ctx.state === 'suspended') await ctx.resume();
    enabled = on;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.linearRampToValueAtTime(on ? 0.55 : 0, now + 0.45);
    return enabled;
  }

  function setNight(n) {
    night = n;
    if (!nodes[0]?.filter) return;
    nodes[0].filter.frequency.value = 380 + (1 - n) * 120;
    if (nodes[0].waveGain) nodes[0].waveGain.gain.value = 0.18 + n * 0.08;
    if (nodes[1]?.windGain) nodes[1].windGain.gain.value = 0.03 + n * 0.05;
  }

  function toggle() {
    return setEnabled(!enabled);
  }

  return {
    get enabled() {
      return enabled;
    },
    setEnabled,
    toggle,
    setNight,
  };
}

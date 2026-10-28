export const SOUND_EFFECTS = Object.freeze({
  attack: '/lingye-youyouji/assets/audio/sfx/attack.wav',
  hurt: '/lingye-youyouji/assets/audio/sfx/hurt.wav',
  capture: '/lingye-youyouji/assets/audio/sfx/capture.wav',
  victory: '/lingye-youyouji/assets/audio/sfx/victory.wav',
});
export const SFX_PREFERENCE_KEY = 'idle-journey-sfx-v1';
// 单声峰值不超过0.62，最多四声相加留出满音量混音余量。
export const SFX_MIX_HEADROOM = .4;
const LIMITS = { attack: 140, hurt: 320, capture: 600, victory: 1000 };
const PRIORITY = { attack: 0, hurt: 1, capture: 2, victory: 3 };

// 与音乐使用不同的偏好、上下文和增益；事件不排队，资源就绪后只播放新事件。
export function createSoundEffects(options = {}) {
  const createContext = options.createContext ?? (() => new (globalThis.AudioContext ?? globalThis.webkitAudioContext)());
  const request = options.fetch ?? globalThis.fetch?.bind(globalThis);
  const now = options.now ?? (() => performance.now());
  let storage;
  try { storage = options.storage ?? globalThis.localStorage; } catch { /* 禁止存储时仍可使用当前设置。 */ }
  let enabled = false, volume = .35;
  try {
    const saved = JSON.parse(storage?.getItem(SFX_PREFERENCE_KEY) ?? 'null');
    if (typeof saved?.enabled === 'boolean' && Number.isFinite(saved.volume) && saved.volume >= 0 && saved.volume <= 1) {
      enabled = saved.enabled; volume = saved.volume;
    }
  } catch { /* 损坏偏好回退为默认安静。 */ }
  let status = enabled ? 'waiting' : 'off', unlocked = false, hidden = false, destroyed = false;
  let context = null, gain = null, controller = null, pending = null, revision = 0;
  const buffers = new Map(), voices = new Map(), lastPlayed = new Map();
  let failed = [];
  const snapshot = () => ({ enabled, volume, status, failed: [...failed], voices: voices.size, buffers: buffers.size });
  const emit = () => options.onChange?.(snapshot());
  const save = () => { try { storage?.setItem(SFX_PREFERENCE_KEY, JSON.stringify({ enabled, volume })); } catch { /* 偏好写入失败不打断声音。 */ } };
  function removeVoice(source, stop = false) {
    if (!voices.has(source)) return;
    voices.delete(source); source.onended = null;
    if (stop) { try { source.stop(); } catch { /* 已自然结束的短声无需再停止。 */ } }
    source.disconnect(); source.buffer = null;
  }
  function stopVoices() { for (const source of voices.keys()) removeVoice(source, true); }
  function release() {
    revision++; controller?.abort(); controller = null; pending = null;
    stopVoices(); buffers.clear(); lastPlayed.clear(); failed = [];
    gain?.disconnect(); gain = null;
    if (context) { try { Promise.resolve(context.close()).catch(() => {}); } catch { /* 页面销毁时允许上下文已关闭。 */ } }
    context = null;
  }
  async function prepare() {
    if (destroyed || !enabled || !unlocked || hidden || status === 'error') return;
    if (pending) return pending;
    const ticket = revision;
    status = 'loading'; emit();
    const work = async () => {
      try {
        if (!context) { context = createContext(); gain = context.createGain(); gain.connect(context.destination); }
        const current = context;
        gain.gain.value = volume * SFX_MIX_HEADROOM;
        // 在交互调用栈中立即resume，然后才等待网络与解码。
        const resumed = current.resume();
        controller = new AbortController();
        const signal = controller.signal;
        const tasks = Object.entries(SOUND_EFFECTS).map(async ([kind, url]) => {
          if (buffers.has(kind) || failed.includes(kind)) return;
          try {
            const response = await request(url, { signal });
            if (!response.ok) throw Error();
            const bytes = await response.arrayBuffer();
            if (ticket !== revision) return;
            const buffer = await current.decodeAudioData(bytes);
            if (ticket === revision) buffers.set(kind, buffer);
          } catch { if (ticket === revision && !signal.aborted) failed.push(kind); }
        });
        await Promise.all([resumed, ...tasks]);
        if (ticket !== revision) return;
        status = hidden ? 'paused' : current.state !== 'running' ? 'waiting' : buffers.size ? 'ready' : 'error';
      } catch {
        if (ticket !== revision) return;
        release(); status = 'error';
      }
      if (ticket === revision || status === 'error') emit();
    };
    pending = work();
    const operation = pending;
    await operation;
    if (pending === operation) pending = null;
  }
  return {
    snapshot,
    async enable() {
      if (destroyed) return;
      if (status === 'error' || failed.length) { release(); status = 'waiting'; }
      enabled = true; unlocked = true; save(); await prepare(); emit();
    },
    disable() { if (destroyed) return; enabled = false; release(); status = 'off'; save(); emit(); },
    async unlock() { if (destroyed || !enabled || unlocked) return; unlocked = true; await prepare(); },
    play(kind) {
      if (destroyed || !enabled || !unlocked || hidden || volume === 0 || status !== 'ready' || context?.state !== 'running' || !buffers.has(kind)) return false;
      const at = now();
      if (at - (lastPlayed.get(kind) ?? -Infinity) < LIMITS[kind]) return false;
      if (voices.size >= 4) {
        const candidate = [...voices.entries()].find(([, active]) => PRIORITY[active] <= PRIORITY[kind]);
        if (!candidate) return false;
        removeVoice(candidate[0], true);
      }
      try {
        const source = context.createBufferSource(); source.buffer = buffers.get(kind); source.connect(gain);
        voices.set(source, kind); source.onended = () => removeVoice(source);
        source.start(); lastPlayed.set(kind, at); options.onPlayed?.(kind); return true;
      } catch { stopVoices(); status = 'error'; emit(); return false; }
    },
    setVolume(nextVolume) {
      if (destroyed || !Number.isFinite(nextVolume)) return;
      volume = Math.max(0, Math.min(1, nextVolume));
      if (gain) gain.gain.value = volume * SFX_MIX_HEADROOM;
      if (volume === 0) stopVoices(); save(); emit();
    },
    async setHidden(nextHidden) {
      if (destroyed || hidden === nextHidden) return;
      hidden = nextHidden;
      if (hidden) {
        stopVoices();
        if (enabled && status !== 'error') status = 'paused';
        try { await context?.suspend(); } catch { /* 无活动上下文时保持安静。 */ }
        emit();
      } else if (enabled && unlocked && status !== 'error') {
        const ticket=revision,current=context;
        const valid=()=>ticket===revision&&!destroyed&&enabled&&!hidden&&context===current;
        try { await current?.resume(); } catch { if(valid()){status = 'waiting'; emit();} return; }
        if(!valid())return;
        await prepare();
      }
    },
    destroy() { if (destroyed) return; release(); destroyed = true; status = 'off'; },
  };
}

export const MUSIC_TRACKS = Object.freeze({
  camp: '/lingye-youyouji/assets/audio/camp.mp3',
  adventure: '/lingye-youyouji/assets/audio/adventure.mp3',
  guardian: '/lingye-youyouji/assets/audio/guardian.mp3',
});
export const MUSIC_PREFERENCE_KEY = 'idle-journey-music-v1';

export function musicTrackFor(page, horde = {}, training = false) {
  if (page !== 'adventure') return 'camp';
  return horde.bossStarted && !horde.finished && !training ? 'guardian' : 'adventure';
}

// 仅管理表现层；音频偏好不参与游戏存档、计时和离线结算。
export function createMusicPlayer(options = {}) {
  const createAudio = options.createAudio ?? (() => new Audio());
  const schedule = options.schedule ?? (fn => setTimeout(fn, 30));
  const cancel = options.cancel ?? clearTimeout;
  let storage;
  try { storage = options.storage ?? globalThis.localStorage; } catch { /* 禁止本地存储时仍可播放。 */ }
  let enabled = false, volume = .2;
  try {
    const saved = JSON.parse(storage?.getItem(MUSIC_PREFERENCE_KEY) ?? 'null');
    if (typeof saved?.enabled === 'boolean' && Number.isFinite(saved.volume) && saved.volume >= 0 && saved.volume <= 1) {
      enabled = saved.enabled; volume = saved.volume;
    }
  } catch { /* 旧偏好或损坏偏好使用默认安静设置。 */ }
  let track = 'adventure', loadedTrack = null, audio = null, timer = null;
  let unlocked = false, hidden = false, destroyed = false, revision = 0;
  let status = enabled ? 'waiting' : 'off';
  const snapshot = () => ({ enabled, volume, track, status });
  const emit = () => options.onChange?.(snapshot());
  const save = () => { try { storage?.setItem(MUSIC_PREFERENCE_KEY, JSON.stringify({ enabled, volume })); } catch { /* 存储失败不影响当前播放。 */ } };
  const stopFade = () => { if (timer !== null) cancel(timer); timer = null; revision++; };
  function release() {
    if (!audio) return;
    audio.pause(); audio.onerror = null; audio.removeAttribute('src'); audio.load(); loadedTrack = null;
  }
  function fail(ticket) {
    if (ticket !== revision || destroyed) return;
    stopFade(); release(); status = 'error'; emit();
  }
  function fade(target, steps, done, ticket = revision) {
    const start = audio.volume;
    let step = 0;
    const advance = () => {
      timer = null;
      if (ticket !== revision || destroyed) return;
      audio.volume = Math.min(volume, start + (target - start) * (++step / steps));
      if (step < steps) timer = schedule(advance);
      else done?.();
    };
    timer = schedule(advance);
  }
  function start(ticket) {
    if (ticket !== revision || hidden || !enabled || destroyed) return;
    if (!audio) { audio = createAudio(); audio.loop = true; audio.preload = 'none'; }
    audio.muted = volume === 0;
    audio.volume = 0;
    audio.onerror = () => fail(ticket);
    if (loadedTrack !== track) {
      audio.pause();
      audio.src = MUSIC_TRACKS[track];
      loadedTrack = track; audio.load();
    }
    status = 'loading'; emit();
    try {
      const playingAudio = audio;
      Promise.resolve(audio.play()).then(() => {
        if (ticket !== revision || destroyed) {
          if (hidden || !enabled || destroyed) playingAudio.pause();
          return;
        }
        status = 'playing'; emit(); fade(volume, 10, null, ticket);
      }, () => fail(ticket));
    } catch { fail(ticket); }
  }
  function resume() {
    stopFade();
    if (destroyed || !enabled || !unlocked || hidden || status === 'error') return;
    const ticket = revision;
    if (audio && !audio.paused && loadedTrack !== track) {
      status = 'loading'; emit(); fade(0, 6, () => start(ticket), ticket);
    } else start(ticket);
  }
  return {
    snapshot,
    select(nextTrack) {
      if (destroyed || !MUSIC_TRACKS[nextTrack] || track === nextTrack) return;
      track = nextTrack; resume(); emit();
    },
    enable() {
      if (destroyed) return;
      enabled = true; unlocked = true; status = hidden ? 'paused' : 'waiting'; save(); resume(); emit();
    },
    disable() {
      if (destroyed) return;
      enabled = false; stopFade(); release(); status = 'off'; save(); emit();
    },
    unlock() {
      if (destroyed || unlocked || !enabled) return;
      unlocked = true; resume();
    },
    setVolume(nextVolume) {
      if (destroyed || !Number.isFinite(nextVolume)) return;
      volume = Math.max(0, Math.min(1, nextVolume)); save();
      if (audio) audio.muted = volume === 0;
      // 不取消正在换曲的任务；后续淡入从最新音量读取目标。
      if (audio && status === 'playing') { stopFade(); audio.onerror = () => fail(revision); audio.volume = volume; }
      if (audio && volume === 0) audio.volume = 0;
      emit();
    },
    setHidden(nextHidden) {
      if (destroyed || hidden === nextHidden) return;
      hidden = nextHidden;
      if (hidden) { stopFade(); audio?.pause(); if (enabled && status !== 'error') status = 'paused'; emit(); }
      else resume();
    },
    destroy() { if (destroyed) return; stopFade(); release(); audio = null; destroyed = true; status = 'off'; },
  };
}

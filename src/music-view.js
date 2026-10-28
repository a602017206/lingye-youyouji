export function musicSettingsMarkup(tr) {
  return `<label class="settings-row"><div><strong>${tr('musicTitle')}</strong><p>${tr('musicDesc')}</p></div><input id="music-enabled" type="checkbox" aria-label="${tr('musicTitle')}"></label>
    <div class="settings-row music-volume-row"><div><label for="music-volume"><strong>${tr('musicVolume')}</strong></label><p>${tr('musicVolumeDesc')}</p></div><div class="music-volume-control"><input id="music-volume" type="range" min="0" max="100" step="1" aria-label="${tr('musicVolume')}"><output id="music-volume-value" for="music-volume"></output></div></div>
    <div class="music-status-row"><p id="music-status" role="status" aria-live="polite"></p><button class="text-button" data-action="music-retry" hidden>${tr('musicRetry')}</button></div><p class="music-origin">${tr('musicOrigin')}</p>`;
}

export function updateMusicControls(state, tr) {
  const retry = state.status === 'error' || state.status === 'waiting';
  const label = tr(state.enabled && !retry ? 'musicDisable' : state.status === 'error' ? 'musicRetry' : 'musicEnable');
  const toggle = document.querySelector('[data-action="music-toggle"]');
  if (toggle) {
    toggle.title = label; toggle.setAttribute('aria-label', label); toggle.setAttribute('aria-pressed', String(state.enabled));
    toggle.dataset.status = state.status;
    toggle.classList.toggle('music-on', state.enabled && state.status !== 'error');
  }
  const checkbox = document.querySelector('#music-enabled');
  if (checkbox) checkbox.checked = state.enabled;
  const slider = document.querySelector('#music-volume');
  if (slider && document.activeElement !== slider) slider.value = String(Math.round(state.volume * 100));
  const output = document.querySelector('#music-volume-value');
  if (output) output.textContent = `${Math.round(state.volume * 100)}%`;
  const status = document.querySelector('#music-status');
  if (status) status.textContent = tr(`musicStatus${state.status}`, { track: tr(`musicTrack${state.track}`) });
  const retryButton = document.querySelector('[data-action="music-retry"]');
  if (retryButton) retryButton.hidden = state.status !== 'error' && state.status !== 'waiting';
}

export function soundEffectSettingsMarkup(tr) {
  return `<section class="sfx-settings" aria-label="${tr('sfxTitle')}"><label class="settings-row"><div><strong>${tr('sfxTitle')}</strong><p>${tr('sfxDesc')}</p></div><input id="sfx-enabled" type="checkbox" aria-label="${tr('sfxTitle')}"></label>
    <div class="settings-row music-volume-row"><div><label for="sfx-volume"><strong>${tr('sfxVolume')}</strong></label><p>${tr('sfxVolumeDesc')}</p></div><div class="music-volume-control"><input id="sfx-volume" type="range" min="0" max="100" step="1" aria-label="${tr('sfxVolume')}"><output id="sfx-volume-value" for="sfx-volume"></output></div></div>
    <div class="music-status-row"><p id="sfx-status" role="status" aria-live="polite"></p><button class="text-button" data-action="sfx-retry" hidden>${tr('sfxRetry')}</button></div>
    <p class="sfx-preview-hint">${tr('sfxPreviewHint')}</p><div class="sfx-preview-buttons">${['attack','hurt','capture','victory'].map(kind=>`<button class="secondary-button" data-sfx-preview="${kind}">${tr('sfxPreview',{kind:tr('sfxKind'+kind)})}</button>`).join('')}</div></section>`;
}

export function updateSoundEffectControls(state,tr) {
  const checkbox=document.querySelector('#sfx-enabled');if(checkbox)checkbox.checked=state.enabled;
  const slider=document.querySelector('#sfx-volume');if(slider&&document.activeElement!==slider)slider.value=String(Math.round(state.volume*100));
  const output=document.querySelector('#sfx-volume-value');if(output)output.textContent=`${Math.round(state.volume*100)}%`;
  const status=document.querySelector('#sfx-status');
  if(status){status.dataset.status=state.status;status.textContent=tr(state.enabled&&state.volume===0?'sfxMuted':state.failed.length?'sfxPartial':'sfxStatus'+state.status,{kinds:state.failed.map(kind=>tr('sfxKind'+kind)).join('、')});}
  const retry=document.querySelector('[data-action="sfx-retry"]');if(retry)retry.hidden=!(state.status==='error'||state.status==='waiting'||state.failed.length);
  for(const button of document.querySelectorAll('[data-sfx-preview]'))button.disabled=!state.enabled||state.volume===0||state.status!=='ready'||state.failed.includes(button.dataset.sfxPreview);
}

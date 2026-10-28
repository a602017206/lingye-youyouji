// 只观察现有瞬时表现与结果；不写入玩法、随机数或存档。
export function createBattleSoundObserver() {
  let source = null, healthLost = 0, cleared = false;
  const seen = new Map();
  return (h, audible = true) => {
    if (!h) { source = null; seen.clear(); return []; }
    const changed = source !== h;
    if (changed) { source = h; seen.clear(); }
    const loss = h.sustainMetrics?.healthLost ?? 0;
    const victory = !changed && !cleared && h.bossCleared && h.finished && !h.defeated && !h.training;
    const hurt = !changed && loss > healthLost;
    healthLost = loss; cleared = !!h.bossCleared;
    let attack = false;
    const actions = h.creatureActions ?? {};
    for (const id of seen.keys()) if (!actions[id]) seen.delete(id);
    for (const [id, action] of Object.entries(actions)) {
      const key = `${action.start}|${action.species}|${action.skill ?? ''}`;
      const age = h.elapsed - action.start, windup = action.windup ?? .13;
      if (changed || !audible) { seen.set(id, key); continue; }
      if (age + 1e-6 >= windup && seen.get(id) !== key) {
        seen.set(id, key);
        const released = !action.skill || (h.familySkillEvents ?? []).some(event => event.ownerId === id && event.skill === action.skill && event.start === action.start);
        if (age < windup + .47 && released) attack = true;
      }
    }
    if (changed || !audible) return [];
    if (victory) return ['victory'];
    return [...(hurt ? ['hurt'] : []), ...(attack && !h.finished ? ['attack'] : [])];
  };
}

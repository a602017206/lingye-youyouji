import { REGIONS } from './data.js';
export const THEMES = {
  forest: { id: 'forest', accent: '#3e664b', deep: '#274c38', background: '#f0f5ed', panel: '#fbfdf7', ink: '#29483c', muted: '#71856b', line: '#dce5d4', soft: '#e9f0e0', glow: '#c7d99e' },
  desert: { id: 'desert', accent: '#98623a', deep: '#70432b', background: '#faf1e6', panel: '#fffbf4', ink: '#624431', muted: '#9a7c62', line: '#ead9c3', soft: '#f4e7d5', glow: '#e8c584' },
  coast: { id: 'coast', accent: '#357e87', deep: '#285d68', background: '#eaf5f5', panel: '#f8fdfb', ink: '#2d5660', muted: '#6d9498', line: '#cfe4e3', soft: '#e0eeee', glow: '#a7d7d6' },
  snow: { id: 'snow', accent: '#5d7e9b', deep: '#3b5d7d', background: '#edf3fa', panel: '#fbfdff', ink: '#37536f', muted: '#7e95ac', line: '#d7e2ef', soft: '#e5eef7', glow: '#c1d9eb' },
  mushroom: { id: 'mushroom', accent: '#81618f', deep: '#634872', background: '#f2edf6', panel: '#fdf9ff', ink: '#594363', muted: '#9782a2', line: '#e4d9ec', soft: '#eae0f1', glow: '#d2b9df' },
  sky: { id: 'sky', accent: '#536d9b', deep: '#374f7d', background: '#ecf0f9', panel: '#fafbff', ink: '#394d75', muted: '#8492af', line: '#d9dff0', soft: '#e1e7f6', glow: '#b6c5e5' },
};
export function themeFor(state) { return THEMES[state.settings.theme === 'auto' ? REGIONS[state.region].theme : state.settings.theme] ?? THEMES.forest; }
export function applyTheme(state, element = document.documentElement) {
  const theme = themeFor(state);
  element.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme)) if (key !== 'id') element.style.setProperty(`--theme-${key}`, value);
  element.style.setProperty('--motion-speed', state.settings.speed === 2 ? '.5' : '1');
  return theme;
}

/**
 * Link slots for whoever imports this page into another site.
 *
 * Every interactive element reads its destination from here. Leave a value as an
 * empty string ("") and the element renders as a <button>; fill it with a path or
 * URL (e.g. "/combat", "https://app.armadanexus.com/play") and the very same
 * element renders as an <a href="...">. Nothing else has to change.
 *
 * You can also override them at mount time:
 *   <App links={{ combat: "/combat" }} onAction={(id) => analytics(id)} />
 */
export type LinkMap = Record<string, string>;

export const LINKS: LinkMap = {
  /* chrome */
  brand: "",
  scenario: "",
  theme: "",
  undo: "",
  party: "",
  home: "",
  settings: "",
  profile: "",

  /* left rail */
  scenes: "",
  character: "",
  combat: "",
  inventory: "",
  sheets: "",
  journal: "",
  macros: "",
  config: "",

  /* map controls */
  zoomIn: "",
  zoomOut: "",
  fullscreen: "",
  centerMap: "",

  /* roster / initiative */
  group: "",
  initiative: "",

  /* character sheet */
  saves: "",
  skills: "",
  equipment: "",
  hotkeys: "",
  hotkey1: "",
  hotkey2: "",
  hotkey3: "",
  hotkey4: "",
  hotkey5: "",

  /* combat */
  tabActions: "",
  tabSheet: "",
  tabInventory: "",
  tabPowers: "",
  actionMove: "",
  actionAct: "",
  actionMagic: "",
  actionItems: "",
  actionCondition: "",
  actionWait: "",

  /* roll table */
  rollFilter: "",
  rollSearch: "",
  rollBookmark: "",
  rollClear: "",
};

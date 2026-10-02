/* ════════════════════════════════════════════════════════════════════
   tactics.js — Camada de COMBATE TÁTICO portada do "Tactics" para o VTT
   atual, SEM substituir app.js, SEM segundo canvas/estado/ficha.

   - Reusa BOARD (mapa, tokens, paredes, portas, fog, câmera) e o canvas
     existente (boardCanvas). A visão isométrica é OUTRA PROJEÇÃO de
     render do mesmo estado, no mesmo canvas.
   - Reusa a ficha oficial (CharacterSheet) via resolveFichaToken /
     getModernRpgCharacter para ações, deslocamento, Defesa e resistências.
   - Reusa broadcast()/addMsg() (PeerJS/chat) para sincronização.
   - Exploração ↔ Combate: o botão só muda o modo de interação; nada é
     copiado, recarregado ou recriado (contrato 03-INTEGRACAO-MODOS).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  /* ────────────────────────────── Estado ───────────────────────────── */
  const TAC = window.TACTICS = {
    active: false,          // modo tático ligado
    iso: false,             // apresentação isométrica (mesmo canvas)
    round: 0,
    order: [],              // [{ id, name, init }]
    turnIdx: -1,
    moved: false, acted: false,
    focusId: null,          // token inspecionado no menu
    pending: null,          // { kind:'move'|'attack'|'spell'|'item', ... }
    paint: null,            // 'difficult' | 'elev' | 'erase'
    paints: { difficult: {}, elev: {} },
    log: [],                // mesa de rolagens
    isoScale: 1,
  };
  const GS = () => (BOARD && BOARD.gridSize) || 50;
  const key = (x, y) => x + ',' + y;
  const parseKey = (k) => k.split(',').map(Number);
  const d = (n) => 1 + Math.floor(Math.random() * n);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function rollFormula(f) {
    // "2d6+3" | "1d8" | "d6+1" | número
    let total = 0; const rolls = [];
    const m = String(f || '').match(/(\d*)d(\d+)([+-]\d+)?/i);
    if (m) {
      const n = Math.max(1, parseInt(m[1] || '1', 10)); const faces = parseInt(m[2], 10);
      for (let i = 0; i < n; i++) { const r = d(faces); rolls.push(r); total += r; }
      if (m[3]) total += parseInt(m[3], 10);
    } else { total = parseInt(f, 10) || 0; }
    return { total, rolls, formula: f };
  }

  /* ─────────────── Dados de personagem (fonte: ficha oficial) ─────────────── */
  function fichaDe(token) {
    let sheet = null;
    if (token && token.modernRpgCharacterId && typeof getModernRpgCharacter === 'function') {
      sheet = getModernRpgCharacter(token.modernRpgCharacterId);
    }
    let legacy = null;
    if (typeof resolveFichaToken === 'function') legacy = (resolveFichaToken(token) || {}).fullData || null;
    if (!legacy && sheet && typeof characterSheetToLegacyFullData === 'function') legacy = characterSheetToLegacyFullData(sheet);
    return { sheet, legacy };
  }

  function statsFor(token) {
    const { sheet, legacy } = fichaDe(token);
    const level = parseInt(legacy && legacy.charLevel, 10) || (sheet && sheet.level) || 1;
    const halfLevel = Math.floor(level / 2);
    const trainBonus = level >= 15 ? 6 : level >= 7 ? 4 : 2;
    const attrs = (legacy && legacy.attrs) || {};
    const attr = (sh) => parseInt(attrs[sh], 10) || 0;
    const skillTotal = (name) => {
      const s = legacy && (legacy.skills || []).find((x) => x.n === name);
      if (!s) return halfLevel; // sem ficha: só meio nível
      return halfLevel + attr(s.a) + (s.trained ? trainBonus : 0) + (parseInt(s.other, 10) || 0);
    };
    const saveTotal = (sh) => attr(sh) + halfLevel; // Fortitude/Reflexos/Vontade
    const defense = (token && token.defense != null && token.defense !== '') ? parseInt(token.defense, 10)
      : (sheet && typeof modernRpgDefenseTotal === 'function') ? modernRpgDefenseTotal(sheet)
      : 10 + attr('DES') + halfLevel;
    const speed = (sheet && sheet.speed) || 9;
    const attacks = (legacy && legacy.attacks) || [];
    const spells = sheet ? (sheet.spells || []).map((sp) => ({
      name: sp.name, pm: sp.cost || 0, range: sp.range || '', res: sp.resistance || '',
      effect: sp.effect || '', desc: sp.description || '', type: sp.type || '', circle: sp.circle,
    })) : ((legacy && legacy.spells && legacy.spells.list) || []).map((sp) => ({
      name: sp.name, pm: sp.pm || 0, range: sp.range || '', res: sp.res || '',
      effect: (String(sp.desc || '').match(/\d+d\d+(?:[+-]\d+)?/) || [null])[0] || '', desc: sp.desc || '', type: '', circle: sp.circle,
    }));
    const items = sheet ? (sheet.equipment || []).filter((i) => /po[çc][ãa]o|kit de cura|bandagem/i.test(i.name))
      .map((i) => ({ name: i.name, heal: (String(i.description || '').match(/\d+d\d+(?:[+-]\d+)?/) || ['1d8'])[0] })) : [];
    return {
      sheet, legacy, level, halfLevel, attrs, attr, skillTotal, saveTotal, defense, speed, attacks, spells, items,
      des: attr('DES'),
      cdMagia: (sh) => 10 + halfLevel + attr(sh), // CD = 10 + ½ nível + atributo-chave
    };
  }

  /* ─────────────────────────── Grade / geometria ─────────────────────────── */
  function mapCells() {
    const gs = GS();
    const img = BOARD && BOARD.mapImg;
    const w = img && img.naturalWidth ? Math.ceil(img.naturalWidth / gs) : 24;
    const h = img && img.naturalHeight ? Math.ceil(img.naturalHeight / gs) : 16;
    return { w, h, gs };
  }
  function cellAtEvent(e) {
    const { x, y } = getBoardXY(e);
    const gs = GS();
    return { gx: Math.floor(x / gs), gy: Math.floor(y / gs) };
  }
  function tokenAtCell(gx, gy) {
    return (BOARD.tokens || []).find((t) => gx >= t.gx && gx < t.gx + (t.size || 1) && gy >= t.gy && gy < t.gy + (t.size || 1));
  }
  const elevAt = (gx, gy) => TAC.paints.elev[key(gx, gy)] || 0;
  const difficultAt = (gx, gy) => !!TAC.paints.difficult[key(gx, gy)];

  /* Movimento tático: orçamento = deslocamento(m)/1,5; difícil ×2; subida +1. */
  function reachableFrom(token) {
    const st = statsFor(token);
    const budget = Math.max(1, Math.round(st.speed / 1.5));
    const { w, h } = mapCells();
    const cost = { [key(token.gx, token.gy)]: 0 };
    const q = [[token.gx, token.gy]];
    for (let qi = 0; qi < q.length; qi++) {
      const [cx, cy] = q[qi]; const c = cost[key(cx, cy)];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (typeof checkMoveBlocked === 'function') {
          if (checkMoveBlocked(token, cx, cy, nx, ny)) continue;
          // diagonal: exige as duas arestas ortogonais livres (sem "escapar pelo canto")
          if (dx && dy && (checkMoveBlocked(token, cx, cy, nx, cy) || checkMoveBlocked(token, cx, cy, cx, ny))) continue;
        }
        const occ = tokenAtCell(nx, ny);
        if (occ && occ.id !== token.id) continue;
        const up = Math.max(0, elevAt(nx, ny) - elevAt(cx, cy));
        const nc = c + 1 + (difficultAt(nx, ny) ? 1 : 0) + up;
        if (nc > budget) continue;
        const k = key(nx, ny);
        if (cost[k] === undefined || nc < cost[k]) { cost[k] = nc; q.push([nx, ny]); }
      }
    }
    delete cost[key(token.gx, token.gy)];
    return cost;
  }

  /* Alcance em casas para ataques/magias (1 casa = 1,5 m). */
  function rangeCellsOf(atk) {
    if (atk && atk.skill === 'Pontaria') {
      const m = String(atk.range || '').match(/(\d+)\s*m/);
      return Math.round((m ? parseInt(m[1], 10) : 9) / 1.5);
    }
    if (atk && atk.rangeM) return Math.round(atk.rangeM / 1.5);
    return 1; // corpo a corpo: adjacente
  }
  function cellsInRange(token, cells) {
    const out = [];
    const { w, h } = mapCells();
    for (let gx = 0; gx < w; gx++) for (let gy = 0; gy < h; gy++) {
      const dist = Math.max(Math.abs(gx - token.gx), Math.abs(gy - token.gy));
      if (dist >= 1 && dist <= cells) out.push(key(gx, gy));
    }
    return out;
  }

  /* Cobertura: linhas até os 4 cantos do alvo; paredes/portas fechadas bloqueiam. */
  function coverBonus(att, tgt) {
    if (typeof segmentsIntersect !== 'function' || typeof wallBlocksVision !== 'function') return 0;
    const gs = GS();
    const ax = (att.gx + 0.5) * gs, ay = (att.gy + 0.5) * gs;
    const corners = [[tgt.gx, tgt.gy], [tgt.gx + 1, tgt.gy], [tgt.gx, tgt.gy + 1], [tgt.gx + 1, tgt.gy + 1]]
      .map(([x, y]) => [x * gs, y * gs]);
    let blocked = 0;
    for (const [cx2, cy2] of corners) {
      const hit = (BOARD.walls || []).some((wl) => wallBlocksVision(wl) &&
        segmentsIntersect(ax, ay, cx2, cy2, wl.x1, wl.y1, wl.x2, wl.y2));
      if (hit) blocked++;
    }
    if (blocked === 4) return 5;   // cobertura total
    if (blocked >= 1) return 2;    // cobertura parcial
    return 0;
  }
  /* Flanqueamento: aliado do atacante na casa oposta ao alvo → +2. */
  function flankBonus(att, tgt) {
    const ox = 2 * tgt.gx - att.gx, oy = 2 * tgt.gy - att.gy;
    const ally = (BOARD.tokens || []).find((t) => t.id !== att.id && t.id !== tgt.id &&
      t.gx === ox && t.gy === oy && (t.hpMax || 0) > 0 && (t.hp || 0) > 0 && !isEnemyOf(att, t));
    return ally ? 2 : 0;
  }
  function isEnemyOf(a, b) {
    // heuristic da mesa: tokens controlados/da mesma "equipe herói" vs bestiário
    const hero = (t) => !!(t.modernRpgCharacterId || t.controlledBy || t.isHero);
    return hero(a) !== hero(b);
  }

  /* ─────────────────────────── Iniciativa ─────────────────────────── */
  function combatants() { return (BOARD.tokens || []).filter((t) => (t.hpMax || 0) > 0); }
  function buildOrder() {
    const list = combatants().map((t) => {
      let init = null;
      if (typeof combatState !== 'undefined' && combatState && combatState.combatants) {
        const c = combatState.combatants.find((x) => x.name === t.name || (t.controlledBy && x.controlledBy === t.controlledBy));
        if (c && c.init != null) init = parseInt(c.init, 10);
      }
      if (init == null) { const st = statsFor(t); init = d(20) + st.des; }
      return { id: t.id, name: t.name, init };
    }).sort((a, b) => b.init - a.init);
    TAC.order = list; TAC.round = 1; TAC.turnIdx = 0; TAC.moved = false; TAC.acted = false;
    logRoll('Sistema', '—', 'Iniciativa', null, null, null, null, 'Ordem: ' + list.map((o) => `${o.name} (${o.init})`).join(', '));
  }
  const turnToken = () => TAC.order[TAC.turnIdx] && (BOARD.tokens || []).find((t) => t.id === TAC.order[TAC.turnIdx].id);

  function endTurn(silent) {
    TAC.pending = null; TAC.moved = false; TAC.acted = false;
    TAC.turnIdx++;
    if (TAC.turnIdx >= TAC.order.length) { TAC.turnIdx = 0; TAC.round++; if (!silent) logRoll('Sistema', '—', 'Rodada', null, null, null, null, `── Rodada ${TAC.round} ──`); }
    const t = turnToken();
    if (t && !silent) logRoll('Sistema', '—', 'Vez', null, null, null, null, `Vez de ${t.name}.`);
    syncTac(); renderAll(); boardRender();
  }

  /* ─────────────────────── Mesa de rolagens (aberta) ─────────────────────── */
  function logRoll(ator, alvo, acao, nat, mod, total, defesaCD, resultado) {
    TAC.log.push({ ator, alvo, acao, nat, mod, total, defesaCD, resultado, ts: Date.now() });
    if (TAC.log.length > 80) TAC.log.shift();
    if (typeof addMsg === 'function') {
      addMsg({ type: 'system', text: `⚔ [Tático] ${ator}${alvo && alvo !== '—' ? ' → ' + alvo : ''} · ${acao}${total != null ? ` · ${nat != null ? 'nat ' + nat : ''}${mod != null ? (mod >= 0 ? '+' : '') + mod : ''} = ${total}${defesaCD != null ? ' vs ' + defesaCD : ''}` : ''} — ${resultado}` });
    }
    renderLog();
  }

  /* ────────────────────────────── Ações ────────────────────────────── */
  function beginMove() {
    const t = turnToken(); if (!t) return toast('Sem turno ativo.');
    if (TAC.acted) return toast('Este turno já agiu — resta mover? Não: a ação encerrou o turno.');
    if (TAC.moved) return toast('Este token já moveu neste turno.');
    TAC.pending = { kind: 'move', reach: reachableFrom(t) };
    renderAll(); boardRender();
  }
  function doMove(token, gx, gy) {
    token.gx = gx; token.gy = gy;
    TAC.moved = true; TAC.pending = null;
    if (typeof broadcast === 'function') broadcast({ type: 'board-tokens', tokens: BOARD.tokens }, null);
    logRoll(token.name, '—', 'Mover', null, null, null, null, `moveu para (${gx},${gy}).`);
    syncTac(); renderAll(); boardRender();
    if (TAC.acted) endTurn(true);
  }

  function beginAttack(i) {
    const t = turnToken(); if (!t) return toast('Sem turno ativo.');
    if (TAC.acted) return toast('Este turno já usou sua ação.');
    const st = statsFor(t); const atk = st.attacks[i]; if (!atk) return;
    const range = rangeCellsOf(atk);
    const targets = combatants().filter((o) => o.id !== t.id && isEnemyOf(t, o) && (o.hp || 0) > 0 &&
      Math.max(Math.abs(o.gx - t.gx), Math.abs(o.gy - t.gy)) <= range * (o.size || 1) + (range === 1 ? 0 : 0));
    TAC.pending = { kind: 'attack', i, range, cells: cellsInRange(t, range), targetIds: targets.map((o) => o.id) };
    renderAll(); boardRender();
  }
  function beginSpell(i) {
    const t = turnToken(); if (!t) return toast('Sem turno ativo.');
    if (TAC.acted) return toast('Este turno já usou sua ação.');
    const st = statsFor(t); const sp = st.spells[i]; if (!sp) return;
    if ((t.pm || 0) < (sp.pm || 0)) return toast(`PM insuficiente para ${sp.name} (${sp.pm} PM).`);
    const m = String(sp.range || '').match(/(\d+)\s*m/);
    const range = Math.max(1, Math.round((m ? parseInt(m[1], 10) : 9) / 1.5));
    const healish = /cura|recupera|restaura/i.test(sp.desc + sp.name) && !/\d+d\d+.*dano/i.test(sp.desc);
    const targets = combatants().filter((o) => o.id !== t.id &&
      (healish ? !isEnemyOf(t, o) : isEnemyOf(t, o)) && (o.hp || 0) > 0 &&
      Math.max(Math.abs(o.gx - t.gx), Math.abs(o.gy - t.gy)) <= range);
    TAC.pending = { kind: 'spell', i, range, healish, cells: cellsInRange(t, range), targetIds: targets.map((o) => o.id) };
    renderAll(); boardRender();
  }
  function beginItem(i) {
    const t = turnToken(); if (!t) return toast('Sem turno ativo.');
    if (TAC.acted) return toast('Este turno já usou sua ação.');
    const st = statsFor(t); const it = st.items[i]; if (!it) return;
    TAC.pending = { kind: 'item', i, cells: cellsInRange(t, 1), targetIds: [t.id, ...combatants().filter((o) => !isEnemyOf(t, o)).map((o) => o.id)] };
    renderAll(); boardRender();
  }

  function applyDamage(target, amount) {
    target.hp = Math.max(0, (parseInt(target.hp, 10) || 0) - amount);
    if (typeof _persistTokenVitalsToSheet === 'function') _persistTokenVitalsToSheet(target);
    if (typeof broadcast === 'function') broadcast({ type: 'board-tokens', tokens: BOARD.tokens }, null);
  }
  function applyHeal(target, amount) {
    target.hp = Math.min(parseInt(target.hpMax, 10) || amount, (parseInt(target.hp, 10) || 0) + amount);
    if (typeof _persistTokenVitalsToSheet === 'function') _persistTokenVitalsToSheet(target);
    if (typeof broadcast === 'function') broadcast({ type: 'board-tokens', tokens: BOARD.tokens }, null);
  }

  function confirmPending(targetId) {
    const t = turnToken(); const p = TAC.pending; if (!t || !p) return;
    const target = (BOARD.tokens || []).find((x) => x.id === targetId); if (!target) return;
    const st = statsFor(t);

    if (p.kind === 'attack') {
      const atk = st.attacks[p.i];
      const skillName = atk.skill === 'Pontaria' ? 'Pontaria' : 'Luta';
      const skill = st.skillTotal(skillName);
      const cov = coverBonus(t, target);
      const flk = flankBonus(t, target);
      const mod = skill + parseInt(atk.bonus, 10) + flk;
      const nat = d(20);
      const total = nat + mod;
      const def = (statsFor(target).defense) + cov;
      const critBase = parseInt(atk.critRange || 20, 10) || 20;
      let resultado;
      if (nat === 1) resultado = 'ERROU (natural 1).';
      else if (nat === 20 || (nat >= critBase && total >= def)) {
        const mult = Math.max(2, parseInt(atk.crit || 2, 10) || 2);
        const dmgRolls = []; let dmg = 0;
        for (let i = 0; i < mult; i++) { const r = rollFormula(atk.dmg); dmg += r.total; }
        dmg += parseInt(atk.dmgExtra, 10) || 0;
        dmg += st.attr(atk.dmgAttr || 'FOR');
        applyDamage(target, dmg);
        resultado = `CRÍTICO! Dano ${dmg} (×${mult}). ${target.name} cai para ${target.hp} PV.`;
      } else if (total >= def) {
        const r = rollFormula(atk.dmg);
        const dmg = r.total + (parseInt(atk.dmgExtra, 10) || 0) + st.attr(atk.dmgAttr || 'FOR');
        applyDamage(target, dmg);
        resultado = `ACERTOU. Dano ${dmg} (${r.rolls.join('+')}${atk.dmgExtra ? '+' + atk.dmgExtra : ''}+${st.attr(atk.dmgAttr || 'FOR')}). ${target.name}: ${target.hp} PV.`;
      } else resultado = `ERROU (${total} vs Defesa ${def}${cov ? ` c/ cobertura +${cov}` : ''}).`;
      logRoll(t.name, target.name, `${atk.name} (${skillName})`, nat, mod, total, def,
        (cov ? `Cobertura +${cov}. ` : '') + (flk ? 'Flanqueando +2. ' : '') + resultado);
      TAC.acted = true; TAC.pending = null;
      endTurn(true);
    }

    if (p.kind === 'spell') {
      const sp = st.spells[p.i];
      t.pm = Math.max(0, (parseInt(t.pm, 10) || 0) - (sp.pm || 0));
      if (typeof _persistTokenVitalsToSheet === 'function') _persistTokenVitalsToSheet(t);
      if (p.healish || !sp.effect) {
        if (sp.effect) { const r = rollFormula(sp.effect); applyHeal(target, r.total); logRoll(t.name, target.name, `Magia ${sp.name}`, null, null, r.total, null, `cura ${r.total} PV (${target.hp} PV).`); }
        else logRoll(t.name, target.name, `Magia ${sp.name}`, null, null, null, null, 'efeito aplicado (sem dano numérico).');
      } else {
        const cd = st.cdMagia(/divina/i.test(sp.type) ? 'SAB' : 'INT');
        const saveName = /reflex/i.test(sp.res) ? 'REF' : /vont/i.test(sp.res) ? 'SAB' : /fort/i.test(sp.res) ? 'CON' : 'REF';
        const tSt = statsFor(target);
        const saveMod = tSt.saveTotal(saveName);
        const snat = d(20); const stot = snat + saveMod;
        const r = rollFormula(sp.effect);
        let dmg = r.total; let txt;
        if (stot >= cd) { dmg = Math.floor(dmg / 2); txt = `resistiu (${stot} vs CD ${cd}) → metade: ${dmg}.`; }
        else txt = `falhou na resistência (${stot} vs CD ${cd}) → dano ${dmg}.`;
        applyDamage(target, dmg);
        logRoll(t.name, target.name, `Magia ${sp.name} (${sp.res || 'sem resist.'})`, snat, saveMod, stot, cd, txt + ` ${target.name}: ${target.hp} PV.`);
      }
      if (typeof broadcast === 'function') broadcast({ type: 'board-tokens', tokens: BOARD.tokens }, null);
      TAC.acted = true; TAC.pending = null;
      endTurn(true);
    }

    if (p.kind === 'item') {
      const it = st.items[p.i];
      const r = rollFormula(it.heal);
      applyHeal(target, r.total);
      logRoll(t.name, target.name, `Item ${it.name}`, null, null, r.total, null, `cura ${r.total} PV (${target.hp} PV).`);
      TAC.acted = true; TAC.pending = null;
      endTurn(true);
    }
    syncTac(); renderAll(); boardRender();
  }

  /* ─────────────────────────── Entrada / saída ─────────────────────────── */
  function enterTactics() {
    TAC.active = true;
    if (!TAC.order.length) buildOrder();
    syncTac(); renderAll(); boardRender();
    if (typeof toast === 'function') toast('⚔ Modo tático ativo — mesmo mapa, mesmos tokens.');
  }
  function leaveTactics() {
    TAC.active = false; TAC.pending = null; TAC.paint = null;
    syncTac(); boardRender();
    if (typeof toast === 'function') toast('↩ Exploração — nada foi copiado ou perdido.');
  }

  /* ─────────────────────────────── Sincronização ─────────────────────────────── */
  let applyingRemote = false;
  function syncTac() {
    if (applyingRemote) return;
    if (typeof broadcast !== 'function' || typeof myRole === 'undefined' || myRole !== 'mestre') return;
    broadcast({
      type: 'tactics-sync',
      state: {
        active: TAC.active, iso: TAC.iso, round: TAC.round, order: TAC.order, turnIdx: TAC.turnIdx,
        moved: TAC.moved, acted: TAC.acted, log: TAC.log.slice(-40), paints: TAC.paints, pending: null,
      },
    }, null);
  }
  window.tacticsApplyRemote = function (s) {
    if (!s) return;
    applyingRemote = true;
    const wasActive = TAC.active;
    Object.assign(TAC, {
      active: !!s.active, iso: !!s.iso, round: s.round || 0, order: s.order || [], turnIdx: s.turnIdx ?? -1,
      moved: !!s.moved, acted: !!s.acted, log: s.log || TAC.log, paints: s.paints || TAC.paints,
    });
    if (TAC.active || wasActive) { renderAll(); boardRender(); }
    applyingRemote = false;
  };

  /* Persistência por cena (pinturas táticas) */
  const paintStoreKey = () => 'vtt_tactics_paint_' + (typeof cenaAtualId !== 'undefined' && cenaAtualId ? cenaAtualId : 'live');
  function loadPaints() { try { const raw = localStorage.getItem(paintStoreKey()); if (raw) TAC.paints = JSON.parse(raw); } catch (e) { /* noop */ } }
  let saveTimer = null;
  function savePaints() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(paintStoreKey(), JSON.stringify(TAC.paints)); } catch (e) { /* noop */ } }, 300); }

  /* Interface visual removida: este arquivo permanece somente como adapter
     headless do VTT antigo. A interface oficial de combate vive em React e
     consome BOARD/combatState pelos módulos TypeScript. */
  function renderAll() { /* compatibilidade para chamadas internas sem DOM próprio */ }
  function renderLog() { /* o log continua no chat/runtime oficial */ }

  /* ═══════════════════ Render: overlay 2D + isométrico ═══════════════════ */
  function projIso(K, dx, dy, wx, wy, h) {
    return [dx + (wx - wy) * K, dy + (wx + wy) * K * 0.5 - (h || 0)];
  }
  function isoFit() {
    const dpr = window.devicePixelRatio || 1;
    const cw = BOARD.canvas.width / dpr, ch = BOARD.canvas.height / dpr;
    const { gs } = mapCells();
    const img = BOARD.mapImg;
    const Wpx = img && img.naturalWidth ? img.naturalWidth : 24 * gs;
    const Hpx = img && img.naturalHeight ? img.naturalHeight : 16 * gs;
    let K = Math.min((cw * 0.86) / (Wpx + Hpx), (ch * 0.8) / ((Wpx + Hpx) * 0.5));
    K *= TAC.isoScale;
    const dx = cw / 2 - (Wpx - Hpx) * K * 0.5;
    const dy = ch * 0.12;
    return { K, dx, dy, cw, ch, dpr };
  }

  function renderIso() {
    const ctx = BOARD.ctx; if (!ctx) return;
    const { K, dx, dy, cw, ch, dpr } = isoFit();
    const gs = GS();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#171310'; ctx.fillRect(0, 0, cw, ch);
    const { w, h } = mapCells();
    const eh = gs * K * 0.5; // altura visual de 1 nível
    const img = BOARD.mapImg;
    // superfície célula a célula (contínua), com faces laterais p/ elevação
    for (let s = 0; s <= w + h - 2; s++) {
      for (let gx = Math.max(0, s - h + 1); gx <= Math.min(w - 1, s); gx++) {
        const gy = s - gx; const e = elevAt(gx, gy);
        const x0 = gx * gs, y0 = gy * gs;
        // faces laterais (bordas frontais +x e +y) quando o vizinho é mais baixo
        const eR = elevAt(gx + 1, gy), eD = elevAt(gx, gy + 1);
        const c0 = projIso(K, dx, dy, x0 + gs, y0, e * eh), c1 = projIso(K, dx, dy, x0 + gs, y0 + gs, e * eh);
        const c2 = projIso(K, dx, dy, x0, y0 + gs, e * eh);
        if (e > eR) {
          const b0 = projIso(K, dx, dy, x0 + gs, y0, eR * eh), b1 = projIso(K, dx, dy, x0 + gs, y0 + gs, eR * eh);
          ctx.fillStyle = '#4a3221';
          ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...c1); ctx.lineTo(...b1); ctx.lineTo(...b0); ctx.closePath(); ctx.fill();
        }
        if (e > eD) {
          const b1 = projIso(K, dx, dy, x0 + gs, y0 + gs, eD * eh), b2 = projIso(K, dx, dy, x0, y0 + gs, eD * eh);
          ctx.fillStyle = '#33241a';
          ctx.beginPath(); ctx.moveTo(...c1); ctx.lineTo(...c2); ctx.lineTo(...b2); ctx.lineTo(...b1); ctx.closePath(); ctx.fill();
        }
        // topo (fatia da textura do mapa — projeção linear contínua)
        if (img && img.naturalWidth) {
          ctx.save();
          ctx.translate(dx, dy - e * eh);
          ctx.transform(K, K * 0.5, -K, K * 0.5, 0, 0);
          ctx.drawImage(img, x0, y0, gs, gs, x0 - 0.25, y0 - 0.25, gs + 0.5, gs + 0.5);
          ctx.restore();
        } else {
          const p0 = projIso(K, dx, dy, x0, y0, e * eh), p1 = projIso(K, dx, dy, x0 + gs, y0, e * eh);
          const p2 = projIso(K, dx, dy, x0 + gs, y0 + gs, e * eh), p3 = projIso(K, dx, dy, x0, y0 + gs, e * eh);
          ctx.fillStyle = ((gx + gy) % 2 ? '#5b4a33' : '#66553c');
          ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.fill();
        }
        if (difficultAt(gx, gy)) {
          const p0 = projIso(K, dx, dy, x0, y0, e * eh), p1 = projIso(K, dx, dy, x0 + gs, y0, e * eh);
          const p2 = projIso(K, dx, dy, x0 + gs, y0 + gs, e * eh), p3 = projIso(K, dx, dy, x0, y0 + gs, e * eh);
          ctx.fillStyle = 'rgba(120,80,20,0.45)';
          ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.fill();
        }
      }
    }
    // destaques (alcance / movimento / alvo)
    const hl = (kset, color) => {
      for (const k of Object.keys(kset || {})) {
        const [gx, gy] = parseKey(k); const e = elevAt(gx, gy);
        const x0 = gx * gs, y0 = gy * gs;
        const p0 = projIso(K, dx, dy, x0, y0, e * eh), p1 = projIso(K, dx, dy, x0 + gs, y0, e * eh);
        const p2 = projIso(K, dx, dy, x0 + gs, y0 + gs, e * eh), p3 = projIso(K, dx, dy, x0, y0 + gs, e * eh);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.fill();
      }
    };
    if (TAC.pending) {
      if (TAC.pending.kind === 'move') hl(TAC.pending.reach, 'rgba(60,160,80,0.35)');
      else { hl(Object.fromEntries((TAC.pending.cells || []).map((k) => [k, 1])), 'rgba(40,120,200,0.25)'); }
    }
    // paredes como fitas verticais
    for (const wl of BOARD.walls || []) {
      const hw = gs * K * 0.9;
      const a = projIso(K, dx, dy, wl.x1, wl.y1, (elevAt(Math.floor(wl.x1 / gs), Math.floor(wl.y1 / gs))) * eh);
      const b = projIso(K, dx, dy, wl.x2, wl.y2, (elevAt(Math.floor(wl.x2 / gs), Math.floor(wl.y2 / gs))) * eh);
      ctx.fillStyle = wl.type === 'door' ? (wl.open ? 'rgba(120,90,40,0.35)' : 'rgba(160,60,40,0.8)')
        : wl.type === 'window' ? 'rgba(80,140,200,0.5)' : 'rgba(40,30,25,0.85)';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - hw); ctx.lineTo(a[0], a[1] - hw); ctx.closePath(); ctx.fill();
    }
    // tokens (billboards, ordenados por profundidade)
    const toks = (BOARD.tokens || []).slice().sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    for (const t of toks) {
      const e = elevAt(t.gx, t.gy);
      const [sx, sy] = projIso(K, dx, dy, (t.gx + 0.5) * gs, (t.gy + 0.5) * gs, e * eh);
      const r = gs * K * 0.42;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      const isTurn = turnToken() && turnToken().id === t.id;
      ctx.beginPath(); ctx.arc(sx, sy - r * 1.1, r, 0, Math.PI * 2);
      ctx.fillStyle = (t.hp || 0) <= 0 ? '#555' : isTurn ? '#c8a24a' : '#8a3040';
      ctx.fill();
      ctx.lineWidth = isTurn ? 3 : 1.5; ctx.strokeStyle = isTurn ? '#ffe9a8' : '#2a2020'; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(9, r)}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((t.name || '?').charAt(0).toUpperCase(), sx, sy - r * 1.1);
      ctx.font = `${Math.max(8, r * 0.62)}px Verdana`; ctx.fillStyle = '#f4e9d0';
      ctx.fillText(`${t.hp ?? ''}`, sx, sy + r * 0.9);
    }
    // overlays 2D-agnostic: alvo escolhido
    if (TAC.pending && TAC.pending.chosen) {
      const t = (BOARD.tokens || []).find((x) => x.id === TAC.pending.chosen);
      if (t) {
        const [sx, sy] = projIso(K, dx, dy, (t.gx + 0.5) * gs, (t.gy + 0.5) * gs, elevAt(t.gx, t.gy) * eh);
        ctx.strokeStyle = '#ff5040'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy - gs * K * 0.42 * 1.1, gs * K * 0.55, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  function drawOverlay2D() {
    const ctx = BOARD.ctx; if (!ctx) return;
    const gs = GS(); const z = BOARD.zoom || 1; const ox = BOARD.offsetX || 0, oy = BOARD.offsetY || 0;
    const cell = (gx, gy, fill, stroke) => {
      ctx.fillStyle = fill || 'transparent';
      ctx.fillRect(gx * gs * z + ox, gy * gs * z + oy, gs * z, gs * z);
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(gx * gs * z + ox, gy * gs * z + oy, gs * z, gs * z); }
    };
    // pinturas táticas visíveis no 2D
    for (const k of Object.keys(TAC.paints.difficult)) { const [x, y] = parseKey(k); cell(x, y, 'rgba(120,80,20,0.30)'); }
    for (const k of Object.keys(TAC.paints.elev)) {
      const [x, y] = parseKey(k); cell(x, y, 'rgba(200,160,60,0.22)');
      ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 11px Verdana'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('+' + TAC.paints.elev[k], x * gs * z + ox + 3, y * gs * z + oy + 3);
    }
    if (TAC.pending) {
      if (TAC.pending.kind === 'move') { for (const k of Object.keys(TAC.pending.reach)) { const [x, y] = parseKey(k); cell(x, y, 'rgba(60,160,80,0.30)', 'rgba(60,160,80,0.7)'); } }
      else for (const k of TAC.pending.cells || []) { const [x, y] = parseKey(k); cell(x, y, 'rgba(40,120,200,0.20)', 'rgba(40,120,200,0.55)'); }
      if (TAC.pending.targetIds) {
        for (const id of TAC.pending.targetIds) {
          const t = (BOARD.tokens || []).find((x) => x.id === id); if (!t) continue;
          ctx.strokeStyle = '#ff5040'; ctx.lineWidth = 2.5;
          ctx.strokeRect(t.gx * gs * z + ox + 2, t.gy * gs * z + oy + 2, (t.size || 1) * gs * z - 4, (t.size || 1) * gs * z - 4);
        }
      }
      if (TAC.pending.chosen) {
        const t = (BOARD.tokens || []).find((x) => x.id === TAC.pending.chosen);
        if (t) { ctx.strokeStyle = '#ff2010'; ctx.lineWidth = 3.5; ctx.strokeRect(t.gx * gs * z + ox + 1, t.gy * gs * z + oy + 1, (t.size || 1) * gs * z - 2, (t.size || 1) * gs * z - 2); }
      }
    }
    const tt = turnToken();
    if (tt) {
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc((tt.gx + (tt.size || 1) / 2) * gs * z + ox, (tt.gy + (tt.size || 1) / 2) * gs * z + oy, ((tt.size || 1) * gs * z) / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* hook no render do app.js — mesmo canvas, nunca um segundo canvas */
  const _origBoardRender = window.boardRender;
  window.boardRender = function (...a) {
    if (TAC.active && TAC.iso) { renderIso(); return; }
    const r = _origBoardRender ? _origBoardRender.apply(this, a) : undefined;
    if (TAC.active) drawOverlay2D();
    return r;
  };

  /* ═══════════════════════════ Input no board ═══════════════════════════ */
  let painting = false;
  function paintCell(gx, gy) {
    const k = key(gx, gy);
    if (TAC.paint === 'difficult') TAC.paints.difficult[k] = 1;
    else if (TAC.paint === 'elev') TAC.paints.elev[k] = Math.min(3, (TAC.paints.elev[k] || 0) + 1);
    else if (TAC.paint === 'erase') { delete TAC.paints.difficult[k]; delete TAC.paints.elev[k]; }
    else return false;
    savePaints(); syncTac(); boardRender();
    return true;
  }
  window.addEventListener('mousedown', (e) => {
    if (!TAC.active || e.button !== 0) return;
    if (!(e.target && e.target.id === 'boardCanvas')) return;
    e.stopPropagation(); // tático assume o clique; app.js não arrasta token agora
    const { gx, gy } = cellAtEvent(e);
    if (TAC.paint) { painting = true; paintCell(gx, gy); return; }
    if (TAC.pending) {
      if (TAC.pending.kind === 'move') {
        if (TAC.pending.reach[key(gx, gy)] !== undefined) { doMove(turnToken(), gx, gy); }
        return;
      }
      const t = tokenAtCell(gx, gy);
      if (t && (TAC.pending.targetIds || []).includes(t.id)) { TAC.pending.chosen = t.id; renderAll(); boardRender(); }
      return;
    }
    const t = tokenAtCell(gx, gy);
    TAC.focusId = t ? t.id : null;
    renderAll();
  }, true);
  window.addEventListener('mousemove', (e) => {
    if (!TAC.active || !painting || !TAC.paint) return;
    if (!(e.target && e.target.id === 'boardCanvas')) return;
    const { gx, gy } = cellAtEvent(e); paintCell(gx, gy);
  }, true);
  window.addEventListener('mouseup', () => { painting = false; }, true);
  window.addEventListener('dblclick', (e) => { if (TAC.active && e.target && e.target.id === 'boardCanvas') e.stopPropagation(); }, true);
  window.addEventListener('contextmenu', (e) => {
    if (TAC.active && e.target && e.target.id === 'boardCanvas') { e.preventDefault(); e.stopPropagation(); TAC.pending = null; renderAll(); boardRender(); }
  }, true);
  window.addEventListener('keydown', (e) => {
    if (TAC.active && e.key === 'Escape') { TAC.pending = null; TAC.paint = null; renderAll(); boardRender(); }
  }, true);
  /* roda no ISO = zoom da projeção (câmera 2D continua com o app.js) */
  window.addEventListener('wheel', (e) => {
    if (TAC.active && TAC.iso && e.target && e.target.id === 'boardCanvas') {
      e.stopPropagation();
      TAC.isoScale = Math.min(3, Math.max(0.4, TAC.isoScale * (e.deltaY < 0 ? 1.1 : 0.9)));
      boardRender();
    }
  }, { capture: true, passive: true });

  /* Sem botão ou interface próprios: apenas API de compatibilidade headless. */
  window.tacticsEnter = enterTactics;
  window.tacticsLeave = leaveTactics;
  window.tacticsRender = renderAll;
  loadPaints();
})();

// js/ui.js

// Lightweight audio access — uses window.__audio set by AudioManager.
function _sfx(id, opts) {
  if (typeof window !== 'undefined' && window.__audio) {
    window.__audio.playSfx(id, opts);
  }
}

// Track current click handler per button so a re-wire (e.g. fallback path
// creates a new Game) replaces the old handler instead of stacking.
const _btnHandlers = new Map();

function wireOne(id, handler) {
  const btn = document.getElementById(id);
  if (!btn) return false;
  const prev = _btnHandlers.get(id);
  if (prev) btn.removeEventListener('click', prev);
  btn.addEventListener('click', handler);
  _btnHandlers.set(id, handler);
  return true;
}

const ACTION_BUTTONS = [
  'btnMove', 'btnWait', 'btnAttack', 'btnMagic',
  'btnConfirm', 'btnAttackConfirm', 'btnMagicConfirm', 'btnCancel',
];

function buildHandlers(game) {
  return {
    btnMove: () => game.actionSystem?.activateMoveMode(),
    btnWait: () => game.actionSystem?.wait(),
    btnAttack: () => game.actionSystem?.activateAttackMode('physical'),
    btnMagic: () => game.actionSystem?.activateAttackMode('magic'),
    btnConfirm: () => game.actionSystem?.wait(),
    btnAttackConfirm: () => game.actionSystem?.activateAttackMode('physical'),
    btnMagicConfirm: () => game.actionSystem?.activateAttackMode('magic'),
    btnCancel: () => game.actionSystem?.cancelAction(),
  };
}

// Defers wiring until the StaticUI buttons are in DOM. Useful when called
// during async init paths where React's render may not yet be committed.
export function setupActionMenu(game, attempt = 0) {
  const handlers = buildHandlers(game);
  const allWired = ACTION_BUTTONS.every(id => wireOne(id, handlers[id]));
  if (allWired) return;
  // Some buttons missing — retry on next frame, up to ~10 frames (~150ms)
  if (attempt < 10) {
    requestAnimationFrame(() => setupActionMenu(game, attempt + 1));
  } else {
    const missing = ACTION_BUTTONS.filter(id => !document.getElementById(id));
    console.warn('[ui] setupActionMenu gave up after retries — missing:', missing);
  }
}

export function updateProfileStatus(unit) {
  if (!unit) return;

  const portrait = document.getElementById('heroPortrait');
  const nameEl = document.querySelector('.heroName');
  const starsEl = document.querySelector('.stars');
  const hpFill = document.querySelector('.hpFill');
  const hpValue = document.querySelector('.hpValue');
  const stats = document.querySelectorAll('.stat');
  const levelTag = document.querySelector('.levelTag');

  // Update Portrait
  if (unit.portraitUrl) {
    portrait.src = unit.portraitUrl;
  } else {
    portrait.src = '';
  }

  // Update Level
  if (levelTag) {
    levelTag.textContent = `LV ${String(unit.level || 1).padStart(2, '0')}`;
  }

  // Update Name
  nameEl.textContent = unit.name;

  // Update Stars (Rarity)
  starsEl.innerHTML = '';
  const rarity = unit.rarity || 3;
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('img');
    star.classList.add('star');
    star.src = 'assets/Star.png';
    if (i >= rarity) {
      star.classList.add('off');
    }
    starsEl.appendChild(star);
  }

  // Update HP
  const maxHP = unit.maxHealth || 100;
  const currentHP = Math.max(0, unit.health);
  const hpPercent = (currentHP / maxHP) * 100;

  hpFill.style.width = `${hpPercent}%`;
  hpValue.textContent = `${currentHP} / ${maxHP}`;

  // Update Stats
  if (stats.length >= 4) {
    stats[0].textContent = `ATK : ${unit.attack || 0}`;
    stats[1].textContent = `DEF : ${unit.def || 0}`;
    stats[2].textContent = `SPD : ${unit.speed || 0}`;
    stats[3].textContent = `RES : ${unit.res || 0}`;
  }
}

export function showTurnOverlay(text) {
  const overlay = document.getElementById('turnOverlay');
  if (!overlay) return;
  const turnText = overlay.querySelector('.turnText');
  if (!turnText) return;

  turnText.textContent = text;

  // Auto-shrink long titles so they always fit on one line
  overlay.classList.toggle('longTitle', text.length > 14);

  // Clear any inline display that would override CSS class-based visibility
  overlay.style.display = '';
  overlay.classList.remove('fadeOut');

  // Force reflow so re-adding .active restarts the animations cleanly
  void overlay.offsetWidth;

  requestAnimationFrame(() => {
    overlay.classList.add('active');
    _sfx('turnBanner');
  });

  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.classList.add('fadeOut');

    setTimeout(() => {
      overlay.classList.remove('fadeOut');
    }, 420);
  }, 1700);
}

// =============================================================================
// EXP / Level-up Summary (Brigandine-style)
// =============================================================================
//
// Animation sequence:
//   1. Card slides up from bottom (200ms)
//   2. EXP bar animates fill toward final value (~600ms)
//   3. If level-up(s): flash + reveal stat chips (300ms each, staggered)
//   4. Wait for tap or auto-dismiss after 3.5s
//   5. onClose callback fires, action continues
//
// Multiple level-ups in one gain are concatenated into the chips section.

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function getExpEl(id) {
  return document.getElementById(id);
}

let _expSummaryTimer = null;
let _expSummaryDismiss = null;

export function showExpSummary({
  hero,
  beforeExp = 0,
  beforeLevel,
  hits = [],
  levelUps = [],
  onClose,
}) {
  const overlay = document.getElementById('expSummary');
  if (!overlay) {
    onClose?.();
    return;
  }

  // Cancel any in-flight summary
  if (_expSummaryTimer) clearTimeout(_expSummaryTimer);
  if (_expSummaryDismiss) _expSummaryDismiss();

  const totalExp = hits.reduce((s, h) => s + h.amount, 0);
  const hasLevelUp = levelUps.length > 0;
  const finalLevel = levelUps.length > 0
    ? levelUps[levelUps.length - 1].newLevel
    : hero.level;

  // Visible EXP after gain (mod 100 for the bar)
  const visibleExp = hero.exp ?? 0;

  // === Header ===
  const portraitImg = getExpEl('expPortraitImg');
  if (portraitImg) {
    portraitImg.src = hero.portraitUrl || '';
    portraitImg.style.display = hero.portraitUrl ? 'block' : 'none';
  }
  setText('expCardName', hero.name);
  setText('expCardTitle', hasLevelUp ? 'LEVEL UP' : 'EXP GAINED');
  setText('expLevelBadge', `LV ${String(finalLevel).padStart(2, '0')}`);

  // === Breakdown ===
  const breakdown = getExpEl('expBreakdown');
  if (breakdown) {
    breakdown.innerHTML = '';
    hits.forEach(h => {
      const li = document.createElement('li');
      const label = h.source === 'kill' ? 'Defeat enemy' : 'Hit landed';
      li.innerHTML = `<span class="expHitLabel">${label}</span><span class="expHitValue">+${h.amount} EXP</span>`;
      breakdown.appendChild(li);
    });
    if (hits.length > 1) {
      const total = document.createElement('li');
      total.className = 'expHitTotal';
      total.innerHTML = `<span class="expHitLabel">Total</span><span class="expHitValue">+${totalExp} EXP</span>`;
      breakdown.appendChild(total);
    }
  }

  // === Level-up block ===
  const lvBlock = getExpEl('expLevelUpBlock');
  const lvArrow = getExpEl('expLvArrow');
  const chipsEl = getExpEl('expStatChips');
  if (lvBlock && chipsEl) {
    if (hasLevelUp) {
      lvBlock.classList.add('visible');
      if (lvArrow) lvArrow.textContent = `Lv ${beforeLevel} ➜ Lv ${finalLevel}`;
      chipsEl.innerHTML = '';
      // Aggregate gains across multiple level-ups
      const totalGains = { hp: 0, atk: 0, spd: 0, def: 0, res: 0 };
      levelUps.forEach(lu => {
        if (lu.gains) {
          totalGains.hp += lu.gains.hp || 0;
          totalGains.atk += lu.gains.atk || 0;
          totalGains.spd += lu.gains.spd || 0;
          totalGains.def += lu.gains.def || 0;
          totalGains.res += lu.gains.res || 0;
        }
      });
      const order = [
        { key: 'hp', label: 'HP', color: '#7adf8d' },
        { key: 'atk', label: 'ATK', color: '#ff6b73' },
        { key: 'def', label: 'DEF', color: '#9d8aff' },
        { key: 'spd', label: 'SPD', color: '#5cb8ff' },
        { key: 'res', label: 'RES', color: '#ffb84d' },
      ];
      let anyGain = false;
      order.forEach((s, i) => {
        const v = totalGains[s.key];
        if (v <= 0) return;
        anyGain = true;
        const li = document.createElement('li');
        li.className = 'expStatChip';
        li.style.setProperty('--chip-color', s.color);
        li.style.animationDelay = `${0.55 + i * 0.07}s`;
        li.innerHTML = `<span class="chipLabel">${s.label}</span><span class="chipPlus">+${v}</span>`;
        chipsEl.appendChild(li);
      });
      if (!anyGain) {
        const li = document.createElement('li');
        li.className = 'expStatChip neutral';
        li.style.animationDelay = '0.55s';
        li.textContent = 'No stat gains this level';
        chipsEl.appendChild(li);
      }
    } else {
      lvBlock.classList.remove('visible');
      chipsEl.innerHTML = '';
    }
  }

  // === EXP bar fill animation ===
  const fillEl = getExpEl('expBarFill');
  const valueEl = getExpEl('expBarValue');
  if (fillEl) {
    // If level-up happened, we visualize as: fill 0→100 then "reset" to visibleExp
    const startPct = Math.max(0, Math.min(100, beforeExp));
    fillEl.style.transition = 'none';
    fillEl.style.width = `${startPct}%`;
    if (valueEl) valueEl.textContent = `${beforeExp} / 100`;

    // Force reflow then animate
    void fillEl.offsetWidth;
    fillEl.style.transition = 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)';

    requestAnimationFrame(() => {
      if (hasLevelUp) {
        fillEl.style.width = '100%';
        if (valueEl) valueEl.textContent = `100 / 100`;
        // After fill completes, snap to remaining exp
        setTimeout(() => {
          fillEl.style.transition = 'none';
          fillEl.style.width = '0%';
          requestAnimationFrame(() => {
            fillEl.style.transition = 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
            fillEl.style.width = `${visibleExp}%`;
            if (valueEl) valueEl.textContent = `${visibleExp} / 100`;
          });
        }, 720);
      } else {
        const targetPct = Math.max(0, Math.min(100, visibleExp));
        fillEl.style.width = `${targetPct}%`;
        if (valueEl) valueEl.textContent = `${visibleExp} / 100`;
      }
    });
  }

  // === Show overlay ===
  overlay.classList.toggle('hasLevelUp', hasLevelUp);
  overlay.classList.remove('fadeOut');
  void overlay.offsetWidth;
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
  if (typeof window !== 'undefined') window.gameOverlayActive = true;

  // Dismiss handler — used by tap and timer alike
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.remove('active');
    overlay.classList.add('fadeOut');
    overlay.removeEventListener('click', dismiss);
    overlay.removeEventListener('pointerdown', dismiss);
    if (_expSummaryTimer) {
      clearTimeout(_expSummaryTimer);
      _expSummaryTimer = null;
    }
    setTimeout(() => {
      overlay.classList.remove('fadeOut');
      if (typeof window !== 'undefined') window.gameOverlayActive = false;
      onClose?.();
    }, 320);
  };
  _expSummaryDismiss = dismiss;

  // Allow tap-to-dismiss after a short grace period (so anim plays a bit)
  setTimeout(() => {
    overlay.addEventListener('click', dismiss);
    overlay.addEventListener('pointerdown', dismiss);
  }, 500);

  // Auto-dismiss
  const autoMs = hasLevelUp ? 3500 : 2200;
  _expSummaryTimer = setTimeout(dismiss, autoMs);
}

// =============================================================================
// Compact victory banner — slides down from top, holds briefly, fades.
// Used at the start of the victory cinematic.
// =============================================================================

let _bannerTimer = null;

export function showVictoryBanner({ stageName, bonusExp }) {
  const el = document.getElementById('victoryBanner');
  if (!el) return;

  if (_bannerTimer) clearTimeout(_bannerTimer);

  const exp = document.getElementById('vbExpText');
  if (exp) {
    const stage = stageName ? `${stageName} · ` : '';
    exp.textContent = `${stage}+${bonusExp} EXP BONUS`;
  }

  el.classList.remove('fadeOut');
  void el.offsetWidth;
  requestAnimationFrame(() => el.classList.add('active'));

  _bannerTimer = setTimeout(() => {
    el.classList.remove('active');
    el.classList.add('fadeOut');
    setTimeout(() => el.classList.remove('fadeOut'), 320);
    _bannerTimer = null;
  }, 1300);
}

// =============================================================================
// (Legacy) Victory Bonus Summary — full-modal, retained for reference.
// =============================================================================

let _victoryDismiss = null;
let _victoryTimer = null;

export function showVictoryBonus({ stageName, heroResults, onClose }) {
  const overlay = document.getElementById('victoryBonus');
  if (!overlay) {
    onClose?.();
    return;
  }

  if (_victoryTimer) clearTimeout(_victoryTimer);
  if (_victoryDismiss) _victoryDismiss();

  setText('victoryStageName', stageName || 'Stage Cleared');

  const list = document.getElementById('victoryHeroList');
  if (list) {
    list.innerHTML = '';
    heroResults.forEach((res, i) => {
      const card = document.createElement('div');
      card.className = 'victoryHeroCard';
      if (res.levelUps?.length) card.classList.add('hasLevelUp');
      card.style.animationDelay = `${0.15 + i * 0.08}s`;

      // Portrait
      const portrait = document.createElement('div');
      portrait.className = 'victoryHeroPortrait';
      if (res.hero.portraitUrl) {
        const img = document.createElement('img');
        img.src = res.hero.portraitUrl;
        img.alt = '';
        portrait.appendChild(img);
      }
      card.appendChild(portrait);

      // Info
      const info = document.createElement('div');
      info.className = 'victoryHeroInfo';

      const nameRow = document.createElement('div');
      nameRow.className = 'victoryHeroNameRow';
      const name = document.createElement('span');
      name.className = 'victoryHeroName';
      name.textContent = res.hero.name;
      nameRow.appendChild(name);
      const lvBadge = document.createElement('span');
      lvBadge.className = 'victoryHeroLv';
      lvBadge.textContent = `LV ${String(res.hero.level).padStart(2, '0')}`;
      nameRow.appendChild(lvBadge);
      info.appendChild(nameRow);

      const expRow = document.createElement('div');
      expRow.className = 'victoryHeroExpRow';
      expRow.innerHTML = `<span class="victoryHeroExpLabel">+ EXP</span><span class="victoryHeroExpValue">+${res.expGained}</span>`;
      info.appendChild(expRow);

      if (res.levelUps?.length) {
        const lvBlock = document.createElement('div');
        lvBlock.className = 'victoryHeroLvBlock';
        const lvHeader = document.createElement('div');
        lvHeader.className = 'victoryHeroLvHeader';
        const lvCount = res.levelUps.length;
        lvHeader.innerHTML = `<span class="lvBadge">★</span> LEVEL UP${lvCount > 1 ? ` ×${lvCount}` : ''}`;
        lvBlock.appendChild(lvHeader);

        // Aggregate gains
        const total = { hp: 0, atk: 0, spd: 0, def: 0, res: 0 };
        res.levelUps.forEach(lu => {
          if (!lu.gains) return;
          total.hp += lu.gains.hp || 0;
          total.atk += lu.gains.atk || 0;
          total.spd += lu.gains.spd || 0;
          total.def += lu.gains.def || 0;
          total.res += lu.gains.res || 0;
        });
        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'victoryStatChips';
        const order = [
          { k: 'hp', l: 'HP', c: '#7adf8d' },
          { k: 'atk', l: 'ATK', c: '#ff6b73' },
          { k: 'def', l: 'DEF', c: '#9d8aff' },
          { k: 'spd', l: 'SPD', c: '#5cb8ff' },
          { k: 'res', l: 'RES', c: '#ffb84d' },
        ];
        order.forEach(s => {
          if (!total[s.k]) return;
          const chip = document.createElement('span');
          chip.className = 'victoryStatChip';
          chip.style.setProperty('--chip-color', s.c);
          chip.innerHTML = `<span class="chipLabel">${s.l}</span><span class="chipPlus">+${total[s.k]}</span>`;
          chipsWrap.appendChild(chip);
        });
        if (chipsWrap.children.length === 0) {
          const none = document.createElement('span');
          none.className = 'victoryStatChip neutral';
          none.textContent = 'No stat gain';
          chipsWrap.appendChild(none);
        }
        lvBlock.appendChild(chipsWrap);
        info.appendChild(lvBlock);
      }

      card.appendChild(info);
      list.appendChild(card);
    });
  }

  overlay.classList.remove('fadeOut');
  void overlay.offsetWidth;
  requestAnimationFrame(() => overlay.classList.add('active'));
  if (typeof window !== 'undefined') window.gameOverlayActive = true;

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.remove('active');
    overlay.classList.add('fadeOut');
    overlay.removeEventListener('click', dismiss);
    overlay.removeEventListener('pointerdown', dismiss);
    if (_victoryTimer) {
      clearTimeout(_victoryTimer);
      _victoryTimer = null;
    }
    setTimeout(() => {
      overlay.classList.remove('fadeOut');
      // overlay stays hidden via classes; gameOverlayActive remains true if cinematic continues
      onClose?.();
    }, 380);
  };
  _victoryDismiss = dismiss;

  setTimeout(() => {
    overlay.addEventListener('click', dismiss);
    overlay.addEventListener('pointerdown', dismiss);
  }, 700);

  // Auto-dismiss after a generous pause (4–5s scaled by hero count)
  const baseMs = 3200;
  const perHeroMs = 350;
  _victoryTimer = setTimeout(dismiss, baseMs + perHeroMs * heroResults.length);
}

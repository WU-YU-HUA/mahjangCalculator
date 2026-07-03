/* Mahjong shanten & ukeire calculator — ported from cal.py */

const TILE_NAMES = [
  ['1w', '2w', '3w', '4w', '5w', '6w', '7w', '8w', '9w'],
  ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
  ['1t', '2t', '3t', '4t', '5t', '6t', '7t', '8t', '9t'],
  ['1z', '2z', '3z', '4z', '5z', '6z', '7z'],
];

const SUIT_LABELS = ['萬', '索', '筒', '大字'];
const SUIT_SUFFIX = ['w', 's', 't', 'z'];
const DESKTOP_SUIT_ORDER = [0, 2, 1, 3];
const MAX_COPIES = 4;
const MAX_HAND = 17;
const TILE_IMAGE_EXT = '.png';

const suitMap = new Map();

// 觸發微小震動的輔助函式
function triggerHaptic() {
  // 檢查使用者的裝置與瀏覽器是否支援震動 API
  if (navigator.vibrate) {
    // 10 毫秒的短暫震動，模擬實體按鍵的「喀噠」手感
    navigator.vibrate(10); 
  }
}

function cloneSuit(suit) {
  return suit.slice();
}

function cloneHand(hand) {
  return hand.map(cloneSuit);
}

function suitToStr(suit, isHonour) {
  if (isHonour) {
    const count = [0, 0, 0, 0];
    for (const tileCount of suit) {
      if (tileCount > 0) {
        count[tileCount - 1] += 1;
      }
    }
    return '0' + count.join('');
  }
  return suit.join('').replace(/0/g, ' ').trim();
}

function suitLen(suit) {
  return suit.reduce((sum, n) => sum + n, 0);
}

function removeGroups(state, i = 0) {
  const { suit, isHonour } = state;

  if (state.groups > state.maxGroups) {
    state.maxGroups = state.groups;
    state.residuals = [cloneSuit(suit)];
  } else if (state.groups === state.maxGroups) {
    state.residuals.push(cloneSuit(suit));
  }

  if (i >= suit.length - 2) {
    return;
  }

  while (i < suit.length - 2 && suit[i] === 0) {
    i += 1;
  }

  if (i >= suit.length - 2) {
    return;
  }

  if (suit[i] >= 3) {
    state.groups += 1;
    suit[i] -= 3;
    removeGroups(state, i);
    suit[i] += 3;
    state.groups -= 1;
  }

  if (
    !isHonour &&
    suit[i + 1] > 0 &&
    suit[i + 2] > 0 &&
    i + 2 < suit.length - 2
  ) {
    state.groups += 1;
    suit[i] -= 1;
    suit[i + 1] -= 1;
    suit[i + 2] -= 1;
    removeGroups(state, i);
    suit[i] += 1;
    suit[i + 1] += 1;
    suit[i + 2] += 1;
    state.groups -= 1;
  }

  removeGroups(state, i + 1);
}

function removeTaatsus(state, i = 0) {
  const { suit, isHonour } = state;

  if (state.taatsus > state.maxTaatsus) {
    state.maxTaatsus = state.taatsus;
  }

  if (state.pairs > 0 && state.taatsus > state.maxTaatsusWithPair) {
    state.maxTaatsusWithPair = state.taatsus;
  }

  if (i >= suit.length - 2) {
    return;
  }

  while (i < suit.length - 2 && suit[i] === 0) {
    i += 1;
  }

  if (i >= suit.length - 2) {
    return;
  }

  if (suit[i] >= 2) {
    state.taatsus += 1;
    state.pairs += 1;
    suit[i] -= 2;
    removeTaatsus(state, i);
    suit[i] += 2;
    state.taatsus -= 1;
    state.pairs -= 1;
  }

  if (!isHonour && i + 1 < suit.length - 2) {
    if (suit[i + 1] > 0) {
      state.taatsus += 1;
      suit[i] -= 1;
      suit[i + 1] -= 1;
      removeTaatsus(state, i);
      suit[i] += 1;
      suit[i + 1] += 1;
      state.taatsus -= 1;
    }

    if (suit[i + 2] > 0) {
      state.taatsus += 1;
      suit[i] -= 1;
      suit[i + 2] -= 1;
      removeTaatsus(state, i);
      suit[i] += 1;
      suit[i + 2] += 1;
      state.taatsus -= 1;
    }
  }

  removeTaatsus(state, i + 1);
}

function calOptimalSuitCombination(suitInput, isHonour = false) {
  const suitStr = suitToStr(suitInput, isHonour);
  if (suitMap.has(suitStr)) {
    return suitMap.get(suitStr);
  }

  const suit = cloneSuit(suitInput);
  const groupState = {
    suit,
    isHonour,
    i: 0,
    groups: 0,
    maxGroups: 0,
    residuals: [],
  };

  removeGroups(groupState);

  let maxTaatsus = 0;
  let maxTaatsusWithPair = 0;

  for (const residual of groupState.residuals) {
    const taatsuState = {
      suit: cloneSuit(residual),
      isHonour,
      i: 0,
      taatsus: 0,
      pairs: 0,
      maxTaatsus: 0,
      maxTaatsusWithPair: 0,
    };

    removeTaatsus(taatsuState);

    if (taatsuState.maxTaatsus > maxTaatsus) {
      maxTaatsus = taatsuState.maxTaatsus;
    }
    if (taatsuState.maxTaatsusWithPair > maxTaatsusWithPair) {
      maxTaatsusWithPair = taatsuState.maxTaatsusWithPair;
    }

    if (suitLen(taatsuState.suit) <= 1 && taatsuState.pairs > 0) {
      break;
    }
  }

  const result = [groupState.maxGroups, maxTaatsus, maxTaatsusWithPair];
  suitMap.set(suitStr, result);
  return result;
}

function menzuTarget(hand) {
  const length = hand.reduce((sum, suit) => sum + suitLen(suit), 0);
  return Math.floor(length / 3);
}

function menzuFormula(deficit, taatsu, pairExists) {
  if (taatsu < deficit + 1) {
    return 2 * deficit - taatsu;
  }
  return deficit - (pairExists ? 1 : 0);
}

function calShantenMenzu(hand, target = null) {
  const stats = [
    calOptimalSuitCombination(hand[0], false),
    calOptimalSuitCombination(hand[1], false),
    calOptimalSuitCombination(hand[2], false),
    calOptimalSuitCombination(hand[3], true),
  ];

  const resolvedTarget = target ?? menzuTarget(hand);
  const deficit =
    resolvedTarget -
    (stats[0][0] + stats[1][0] + stats[2][0] + stats[3][0]);
  const maxTaatsus = stats[0][1] + stats[1][1] + stats[2][1] + stats[3][1];

  let shanten = menzuFormula(deficit, maxTaatsus, false);

  for (const suitStat of stats) {
    if (suitStat[2] > 0) {
      const taatsus = maxTaatsus - suitStat[1] + suitStat[2];
      const shantenAssignedPair = menzuFormula(deficit, taatsus, true);
      shanten = Math.min(shanten, shantenAssignedPair);
    }
  }

  return shanten;
}

function calUkeire(hand) {
  const ukeire = {};
  let totalUkeire = 0;
  const originalShanten = calShantenMenzu(hand);

  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < hand[i].length - 2; j += 1) {
      const remainingCount = MAX_COPIES - hand[i][j];
      if (remainingCount > 0) {
        hand[i][j] += 1;
        const newShanten = calShantenMenzu(hand);
        hand[i][j] -= 1;

        if (newShanten < originalShanten) {
          ukeire[TILE_NAMES[i][j]] = remainingCount;
          totalUkeire += remainingCount;
        }
      }
    }
  }

  return [originalShanten, ukeire, totalUkeire];
}

function createEmptyHand() {
  return [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
}

function parseTiles(tilesStr) {
  const hand = createEmptyHand();
  const normalized = tilesStr.trim().toLowerCase();

  for (let i = 0; i < normalized.length; i += 2) {
    const num = parseInt(normalized[i], 10);
    const kind = normalized[i + 1];
    const suitIndex = SUIT_SUFFIX.indexOf(kind);

    if (Number.isNaN(num) || suitIndex === -1) {
      throw new Error(`無效的牌：${normalized.slice(i, i + 2)}`);
    }

    const maxNum = suitIndex === 3 ? 7 : 9;
    if (num < 1 || num > maxNum) {
      throw new Error(`無效的牌：${normalized.slice(i, i + 2)}`);
    }

    hand[suitIndex][num - 1] += 1;
    if (hand[suitIndex][num - 1] > MAX_COPIES) {
      throw new Error(`同一張牌最多 ${MAX_COPIES} 枚：${normalized.slice(i, i + 2)}`);
    }
  }

  return hand;
}

function handToTiles(hand) {
  const tiles = [];
  for (let suit = 0; suit < 4; suit += 1) {
    const limit = suit === 3 ? 7 : 9;
    for (let rank = 0; rank < limit; rank += 1) {
      for (let c = 0; c < hand[suit][rank]; c += 1) {
        tiles.push(`${rank + 1}${SUIT_SUFFIX[suit]}`);
      }
    }
  }
  return tiles;
}

function tilesToString(tiles) {
  return tiles.join('');
}

function handCount(hand) {
  return hand.reduce((sum, suit) => sum + suitLen(suit), 0);
}

function analyzeHand(tilesStr) {
  suitMap.clear();
  const hand = parseTiles(tilesStr);
  const count = handCount(hand);

  if (count === 0) {
    throw new Error('請至少選擇一張牌');
  }

  if (count % 3 === 0) {
    throw new Error('相公咯~~');
  }

  if (count % 3 === 1) {
    const uk = calUkeire(cloneHand(hand));
    return {
      mode: 'draw',
      shanten: uk[0],
      ukeire: uk[1],
      total: uk[2],
    };
  }

  const tileList = handToTiles(hand);
  const results = [];

  for (let i = 0; i < tileList.length; i += 1) {
    const remaining = tileList.slice(0, i).concat(tileList.slice(i + 1));
    const uk = calUkeire(parseTiles(tilesToString(remaining)));
    results.push({
      discard: tileList[i],
      shanten: uk[0],
      ukeire: uk[1],
      total: uk[2],
    });
  }

  results.sort((a, b) => {
    // 條件 1：幾進聽 (越少越好，向聽數低的排前面)
    if (a.shanten !== b.shanten) return a.shanten - b.shanten;
    
    // 條件 2：進張牌類數 (越多越好，例如聽 1,4,7 萬就是 3 類)
    const aTypes = Object.keys(a.ukeire).length;
    const bTypes = Object.keys(b.ukeire).length;
    if (aTypes !== bTypes) return bTypes - aTypes;
    
    // 條件 3：總進張張數 (越多越好)
    return b.total - a.total;
  });
  const uniqueResults = [];
  const discardSet = new Set();
  for (const result of results) {
    if (!discardSet.has(result.discard)) {
      uniqueResults.push(result);
      discardSet.add(result.discard);
    }
  }

  const hu = uniqueResults.some(
    (result) =>
      result.shanten === 0 && result.ukeire[result.discard] !== undefined,
  );

  if (hu) {
    return { mode: 'win', results: uniqueResults };
  }

  return { mode: 'discard', results: uniqueResults };
}

function formatTileLabel(tileCode) {
  const num = tileCode[0];
  const kind = tileCode[1];
  const suitIndex = SUIT_SUFFIX.indexOf(kind);
  if (suitIndex === -1) {
    return tileCode;
  }
  if (suitIndex === 3) {
    const honourNames = ['東', '南', '西', '北', '白', '發', '中'];
    return honourNames[parseInt(num, 10) - 1] || tileCode;
  }
  return `${num}${SUIT_LABELS[suitIndex]}`;
}

function ukeireTileList(ukeire) {
  return Object.keys(ukeire).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

function getTileImageSrc(tileCode) {
  return `assets/${tileCode}${TILE_IMAGE_EXT}`;
}

function createTileImage(tileCode, className = 'tile-img') {
  const img = document.createElement('img');
  img.className = className;
  img.src = getTileImageSrc(tileCode);
  img.alt = formatTileLabel(tileCode);
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    const fallback = document.createElement('span');
    fallback.className = `${className} fallback`;
    fallback.textContent = formatTileLabel(tileCode);
    fallback.title = tileCode;
    img.replaceWith(fallback);
  });
  return img;
}

function appendTileImages(container, tileCodes) {
  container.replaceChildren();
  if (tileCodes.length === 0) {
    return;
  }
  for (const code of tileCodes) {
    container.appendChild(createTileImage(code));
  }
}

function shantenLabel(shanten) {
  if (shanten < 0) {
    return '和牌';
  }
  if (shanten === 0) {
    return '聽牌';
  }
  return `${shanten} 進聽`;
}

/* ── UI ── */

const state = {
  hand: createEmptyHand(),
  mobileSuit: 0,
};

const els = {};

function $(id) {
  return document.getElementById(id);
}

function currentTileCount() {
  return handCount(state.hand);
}

function getSuitTileCount(suit, rank) {
  return state.hand[suit][rank];
}

function canAddTile(suit, rank) {
  if (currentTileCount() >= MAX_HAND) {
    return false;
  }
  return getSuitTileCount(suit, rank) < MAX_COPIES;
}

function addTile(suit, rank) {
  if (!canAddTile(suit, rank)) {
    return;
  }
  triggerHaptic();
  state.hand[suit][rank] += 1;
  renderAll();
}

function removeTileFromHand(suit, rank) {
  if (state.hand[suit][rank] <= 0) {
    return;
  }
  state.hand[suit][rank] -= 1;
  renderAll();
}

function removeLastTile() {
  const tiles = handToTiles(state.hand);
  if (tiles.length === 0) {
    return;
  }
  const last = tiles[tiles.length - 1];
  const suit = SUIT_SUFFIX.indexOf(last[1]);
  const rank = parseInt(last[0], 10) - 1;
  removeTileFromHand(suit, rank);
}

function clearHand() {
  state.hand = createEmptyHand();
  renderAll();
  renderResult('');
}

function renderHandDisplay() {
  els.handDisplay.replaceChildren(); // 清空舊畫面
  const tiles = handToTiles(state.hand);
  els.handDisplay.classList.toggle('empty', tiles.length === 0);

  if (tiles.length > 0) {
    for (const tileCode of tiles) {
      // 這裡加上我們剛剛在 CSS 寫的 hand-clickable class
      const img = createTileImage(tileCode, 'tile-img hand-clickable'); 
      
      // 綁定點擊移除事件
      img.addEventListener('click', () => {
        const suit = SUIT_SUFFIX.indexOf(tileCode[1]);
        const rank = parseInt(tileCode[0], 10) - 1;
        removeTileFromHand(suit, rank);
      });
      
      els.handDisplay.appendChild(img);
    }
  }
  els.handCount.textContent = `${tiles.length} / ${MAX_HAND}`;
}

function renderResult(content) {
  els.resultPanel.replaceChildren();
  if (!content) {
    return;
  }
  if (typeof content === 'string') {
    const wrap = document.createElement('div');
    wrap.innerHTML = content;
    els.resultPanel.append(...wrap.childNodes);
    return;
  }
  els.resultPanel.appendChild(content);
}

function buildUkeireRow(label, ukeire) {
  const row = document.createElement('div');
  row.className = 'result-row';

  const text = document.createElement('span');
  text.className = 'result-label';
  text.textContent = label;
  row.appendChild(text);

  const tilesWrap = document.createElement('div');
  tilesWrap.className = 'tile-row';
  const tiles = ukeireTileList(ukeire);
  if (tiles.length === 0) {
    tilesWrap.textContent = '無';
  } else {
    appendTileImages(tilesWrap, tiles);
  }
  row.appendChild(tilesWrap);
  return row;
}

function buildResultBlock(titleText, ukeire, discardCode = null) {
  const block = document.createElement('div');
  block.className = 'result-block';

  const title = document.createElement('p');
  title.className = 'result-title';
  if (discardCode) {
    title.append('丟棄：');
    title.appendChild(createTileImage(discardCode));
    title.append(`（${titleText}）`);
  } else {
    title.textContent = titleText;
  }
  block.appendChild(title);
  block.appendChild(buildUkeireRow('進張：', ukeire));
  return block;
}

function buildTileButton(suit, rank, extraClass = '') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `tile-btn ${extraClass}`.trim();
  btn.dataset.suit = String(suit);
  btn.dataset.rank = String(rank);
  btn.setAttribute('aria-label', formatTileLabel(`${rank + 1}${SUIT_SUFFIX[suit]}`));

  const tileCode = `${rank + 1}${SUIT_SUFFIX[suit]}`;
  const count = getSuitTileCount(suit, rank);
  btn.appendChild(createTileImage(tileCode));
  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'tile-count';
    badge.textContent = String(count);
    btn.appendChild(badge);
  }
  btn.disabled = !canAddTile(suit, rank) && count === 0;

  btn.addEventListener('click', () => addTile(suit, rank));
  btn.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    removeTileFromHand(suit, rank);
  });

  return btn;
}

function renderDesktopBoard() {
  els.desktopTileRows.innerHTML = '';

  for (const suit of DESKTOP_SUIT_ORDER) {
    const row = document.createElement('div');
    row.className = 'suit-row';

    const label = document.createElement('div');
    label.className = 'suit-label';
    label.textContent = SUIT_LABELS[suit];
    row.appendChild(label);

    const tilesWrap = document.createElement('div');
    tilesWrap.className = 'tile-group';

    const limit = suit === 3 ? 7 : 9;
    for (let rank = 0; rank < limit; rank += 1) {
      tilesWrap.appendChild(buildTileButton(suit, rank));
    }

    row.appendChild(tilesWrap);
    els.desktopTileRows.appendChild(row);
  }
}

function renderMobileBoard() {
  els.mobileTileGrid.innerHTML = '';
  const limit = state.mobileSuit === 3 ? 7 : 9;

  for (let cell = 0; cell < 9; cell += 1) {
    if (cell < limit) {
      els.mobileTileGrid.appendChild(
        buildTileButton(state.mobileSuit, cell, 'mobile-tile'),
      );
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'tile-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      els.mobileTileGrid.appendChild(placeholder);
    }
  }

  els.mobileSuitBtns.forEach((btn) => {
    btn.classList.toggle(
      'active',
      Number(btn.dataset.mobileSuit) === state.mobileSuit,
    );
  });
}

function renderAll() {
  renderHandDisplay();
  renderDesktopBoard();
  renderMobileBoard();
}

function runCalculation() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  try {
    const tilesStr = tilesToString(handToTiles(state.hand));
    const result = analyzeHand(tilesStr);

    if (result.mode === 'win') {
      const win = document.createElement('p');
      win.className = 'result-win';
      win.textContent = '你已經胡了!!';
      renderResult(win);
      return;
    }

    if (result.mode === 'draw') {
      const block = buildResultBlock(shantenLabel(result.shanten), result.ukeire);
      renderResult(block);
      return;
    }

    const fragment = document.createDocumentFragment();
    
    //收縮其他選項，僅顯示最佳選擇
    if (result.results.length > 0) {
      const firstItem = result.results[0];
      fragment.appendChild(
        buildResultBlock(shantenLabel(firstItem.shanten), firstItem.ukeire, firstItem.discard)
      );
    }

    // 如果有超過一種打法，就把剩下的包裝進一個可收合的容器裡
    if (result.results.length > 1) {
      const moreContainer = document.createElement('div');
      moreContainer.className = 'more-results-container';
      moreContainer.style.display = 'none'; // 預設隱藏

      for (let i = 1; i < result.results.length; i++) {
        const item = result.results[i];
        moreContainer.appendChild(
          buildResultBlock(shantenLabel(item.shanten), item.ukeire, item.discard)
        );
      }

      // 建立「展開/收合」按鈕
      const toggleBtn = document.createElement('div');
      toggleBtn.className = 'toggle-more-btn';
      toggleBtn.innerHTML = `
        <span>顯示其餘 ${result.results.length - 1} 種打法</span>
        <svg class="chevron-icon" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
      `;

      // 點擊按鈕時切換顯示狀態
      toggleBtn.addEventListener('click', () => {
        if (typeof triggerHaptic === 'function') triggerHaptic(); // 如果有加震動的話
        
        const isHidden = moreContainer.style.display === 'none';
        if (isHidden) {
          moreContainer.style.display = 'block';
          toggleBtn.classList.add('expanded');
          toggleBtn.querySelector('span').textContent = '收合其餘打法';
        } else {
          moreContainer.style.display = 'none';
          toggleBtn.classList.remove('expanded');
          toggleBtn.querySelector('span').textContent = `顯示其餘 ${result.results.length - 1} 種打法`;
        }
      });

      fragment.appendChild(toggleBtn);
      fragment.appendChild(moreContainer);
    }

    renderResult(fragment);
  } catch (error) {
    const err = document.createElement('p');
    err.className = 'result-error';
    err.textContent = error.message;
    renderResult(err);
  }
}

function init() {
  els.handDisplay = $('hand-display');
  els.handCount = $('hand-count');
  els.resultPanel = $('result-panel');
  els.desktopTileRows = $('desktop-tile-rows');
  els.mobileTileGrid = $('mobile-tile-grid');
  els.mobileSuitBtns = Array.from(document.querySelectorAll('[data-mobile-suit]'));

  $('btn-clear').addEventListener('click', clearHand);
  $('btn-calc').addEventListener('click', runCalculation);
  $('btn-backspace').addEventListener('click', removeLastTile);
  $('btn-clear-mobile').addEventListener('click', clearHand);
  $('btn-calc-mobile').addEventListener('click', runCalculation);
  $('btn-backspace-mobile').addEventListener('click', removeLastTile);

  els.mobileSuitBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mobileSuit = Number(btn.dataset.mobileSuit);
      renderMobileBoard();
    });
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);

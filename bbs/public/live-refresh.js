export function createPoller({ interval, retry, timeout, isVisible, refresh, setTimer = setTimeout, clearTimer = clearTimeout, onError = () => {} }) {
  let timer = null;
  let controller = null;
  let stopped = false;
  let paused = false;
  let failures = 0;
  let wakePending = false;
  const clear = () => { if (timer !== null) clearTimer(timer); timer = null; };
  const schedule = delay => { clear(); if (!stopped && !paused && isVisible()) timer = setTimer(poll, delay); };
  async function poll() {
    clear();
    if (stopped || paused || !isVisible() || controller) return;
    const active = new AbortController();
    controller = active;
    const deadline = setTimer(() => active.abort(new Error('Refresh timed out.')), timeout);
    try {
      await refresh(active.signal);
      if (!active.signal.aborted) failures = 0;
    } catch (error) {
      if (!paused && !stopped) { failures++; onError(error); }
    } finally {
      clearTimer(deadline);
      controller = null;
      if (wakePending && !stopped && !paused && isVisible()) { wakePending = false; void poll(); }
      else schedule(failures ? retry[Math.min(failures - 1, retry.length - 1)] : interval);
    }
  }
  return {
    start() { paused = !isVisible(); schedule(interval); },
    wake() { if (stopped) return; paused = false; clear(); if (controller) { if (controller.signal.aborted) wakePending = true; return; } return poll(); },
    pause() { paused = true; wakePending = false; clear(); controller?.abort(); },
    stop() { stopped = true; wakePending = false; clear(); controller?.abort(); },
  };
}

function nodeKey(node) {
  if (node.nodeType !== 1) return null;
  return node.id || node.getAttribute('data-live-preserve') || (node.getAttribute('class') ? `${node.tagName}.${node.getAttribute('class')}` : null);
}

export function patchNode(current, next) {
  if (current.nodeType === 3 || current.nodeType === 8) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  if (current.hasAttribute('data-live-preserve') || current.isEqualNode(next)) return;
  for (const attr of [...current.attributes]) if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
  for (const attr of [...next.attributes]) if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
  const original = [...current.childNodes];
  const proposedChildren = [...next.childNodes];
  const proposedKeys = new Set(proposedChildren.map(nodeKey).filter(Boolean));
  const keyed = new Map();
  for (const node of original) {
    const key = nodeKey(node);
    if (key) { const list = keyed.get(key) ?? []; list.push(node); keyed.set(key, list); }
  }
  const used = new Set();
  let cursor = current.firstChild;
  for (const proposed of proposedChildren) {
    const key = nodeKey(proposed);
    let node = key ? keyed.get(key)?.find(candidate => !used.has(candidate) && candidate.tagName === proposed.tagName)
      : original.find(candidate => !used.has(candidate) && !nodeKey(candidate) && candidate.nodeType === proposed.nodeType && candidate.tagName === proposed.tagName);
    if (node) patchNode(node, proposed);
    else node = proposed.cloneNode(true);
    used.add(node);
    // Keep the existing composer in its position even when a lock hides it in the snapshot.
    while (cursor?.nodeType === 1 && cursor.hasAttribute('data-live-preserve') && !proposedKeys.has(nodeKey(cursor)) && cursor !== node) cursor = cursor.nextSibling;
    if (node !== cursor) current.insertBefore(node, cursor);
    cursor = node.nextSibling;
  }
  for (const node of original) if (!used.has(node) && !(node.nodeType === 1 && node.hasAttribute('data-live-preserve'))) node.remove();
}

export function startLivePage(doc = document, win = window, fetchPage = fetch) {
  const config = doc.body.dataset;
  if (!config.liveKind) return null;
  const interval = Number(config.liveInterval);
  const viewerId = config.liveViewer ? Number(config.liveViewer) : null;
  let displayed = Number(config.liveLastPost);
  let acknowledged = displayed;
  let etag = '';
  const hashes = new Map();
  const status = doc.getElementById('live-status');
  const content = doc.getElementById('live-content');
  const query = new URLSearchParams({ kind: config.liveKind, key: config.liveKey });
  const replyTo = new URL(win.location.href).searchParams.get('reply_to');
  if (replyTo) query.set('reply_to', replyTo);
  const showStatus = message => { status.textContent = message; status.hidden = false; };
  const disableComposers = unavailable => {
    for (const composer of content.querySelectorAll('[data-live-preserve]')) {
      const deleted = composer.closest('[data-post-deleted]')?.dataset.postDeleted === '1';
      const disabled = unavailable || config.liveLocked === '1' || deleted;
      for (const button of composer.querySelectorAll('button[type="submit"]')) if (button.disabled !== disabled) button.disabled = disabled;
      let notice = composer.querySelector('[data-live-composer-notice]');
      if (disabled && !notice) { notice = doc.createElement('p'); notice.dataset.liveComposerNotice = ''; notice.className = 'notice'; composer.appendChild(notice); }
      if (notice) {
        if (notice.hidden !== !disabled) notice.hidden = !disabled;
        const message = 'Replying is no longer available. Your draft has been kept.';
        if (notice.textContent !== message) notice.textContent = message;
      }
    }
  };
  const stop = (message, hideContent = false) => {
    poller.stop(); disableComposers(true);
    for (const link of content.querySelectorAll('a[href*="reply_to="],a[href$="/edit"],a[href$="/new"]')) {
      link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true');
    }
    if (hideContent) content.hidden = true;
    showStatus(message);
  };
  async function acknowledge(signal) {
    if (viewerId === null || config.liveKind !== 'thread' || displayed <= acknowledged) return;
    const response = await fetchPage(`/thread/${encodeURIComponent(config.liveKey)}/read`, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastPostId: displayed, csrf_token: config.liveCsrf }),
    });
    if ([401, 403, 404].includes(response.status)) { stop('Reading progress could not be saved. Reload the page to check your access.', response.status === 404); return; }
    if (!response.ok) throw new Error('Reading progress could not be saved.');
    acknowledged = displayed;
  }
  async function refresh(signal) {
    const response = await fetchPage(`/api/live?${query}`, {
      credentials: 'same-origin', cache: 'no-store', signal,
      headers: etag ? { 'If-None-Match': etag } : {},
    });
    if (signal.aborted || doc.hidden) return;
    if (response.status === 404) { stop('This page is no longer available.', true); return; }
    if (!response.ok && response.status !== 304) throw new Error('Updates could not be checked.');
    if (response.status !== 304) {
      const snapshot = await response.json();
      if (signal.aborted || doc.hidden) return;
      if (snapshot.viewerId !== viewerId) { stop('Your login status has changed. Reload the page to continue.'); return; }
      const parser = new DOMParser();
      const patches = snapshot.regions.map(region => {
        const target = doc.getElementById(region.id);
        const next = parser.parseFromString(region.html, 'text/html').getElementById(region.id);
        if (!target || !next) throw new Error('The page update could not be applied.');
        return { ...region, target, next };
      });
      const scrollX = win.scrollX;
      const scrollY = win.scrollY;
      const anchors = [...content.querySelectorAll('[id^="post-"],[id^="live-topic-"],[id^="live-board-"]')];
      const anchor = anchors.find(node => {
        const rect = node.getBoundingClientRect();
        return rect.top >= 0 && rect.top < win.innerHeight;
      }) ?? anchors.reverse().find(node => {
        const rect = node.getBoundingClientRect();
        return rect.top < 0 && rect.bottom > 0;
      });
      const offset = anchor?.getBoundingClientRect().top;
      for (const region of patches) {
        if (hashes.get(region.id) !== region.hash) patchNode(region.target, region.next);
        hashes.set(region.id, region.hash);
      }
      const title = `${snapshot.title} — Bitcoin Purity BBS`;
      if (doc.title !== title) doc.title = title;
      const locked = snapshot.locked ? '1' : '0';
      if (config.liveLocked !== locked) config.liveLocked = locked;
      disableComposers(false);
      if (anchor?.isConnected) {
        const delta = anchor.getBoundingClientRect().top - offset;
        if (delta) win.scrollTo(scrollX, win.scrollY + delta);
      } else if (win.scrollY !== scrollY) win.scrollTo(scrollX, scrollY);
      if (config.liveKind === 'thread' && snapshot.lastPostId > displayed) {
        const lastPost = doc.getElementById(`post-${snapshot.lastPostId}`);
        if (!lastPost || !content.contains(lastPost)) throw new Error('New replies could not be displayed.');
        displayed = snapshot.lastPostId;
      }
      etag = response.headers.get('ETag') ?? '';
    }
    await acknowledge(signal);
    if (!signal.aborted && !status.hidden) status.hidden = true;
  }
  const poller = createPoller({ interval, retry: config.liveRetry.split(',').map(Number), timeout: Number(config.liveTimeout),
    isVisible: () => !doc.hidden, refresh, onError: () => showStatus('Updates could not be checked. Retrying automatically.') });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) poller.pause(); else void poller.wake(); });
  win.addEventListener('pagehide', () => poller.pause());
  win.addEventListener('pageshow', event => { if (event.persisted && !doc.hidden) void poller.wake(); });
  poller.start();
  return poller;
}

if (typeof document !== 'undefined') startLivePage();

'use strict';

const ui = (() => {
  const pick = (root, selector) => root.querySelector(selector);
  const picks = (root, selector) => Array.from(root.querySelectorAll(selector));
  const numberES = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
  const fmt = value => numberES.format(value);
  const ms = value => `${fmt(value)} ms`;
  const chip = (label, tone) => `<span class="chip tone-${tone}">${label}</span>`;
  const metric = (value, label) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;

  function entityButton(id, tone, selected, attribute = 'data-entity') {
    return `<button class="entity-choice" type="button" ${attribute}="${id}" aria-pressed="${selected}">
      <span class="entity-key tone-${tone}" aria-hidden="true"></span>${id}
    </button>`;
  }

  function setTalk(root, spoken) {
    pick(root, '[data-say]').textContent = spoken;
  }

  function describe(root, detail, spoken = detail) {
    pick(root, '[data-status]').textContent = detail;
    setTalk(root, spoken);
  }

  function timeline(segments, end, options = {}) {
    const { compact = false, active = -1, units = 'ms', name = 'Línea de tiempo', focusId = null } = options;
    const block = (segment, i) => {
      const css = segment.kind === 'work' ? `tone-${segment.tone}` : segment.kind;
      const details = `${segment.label}, de ${segment.start} a ${segment.end} ${units}`;
      const width = 100 * (segment.end - segment.start) / end;
      const highlight = focusId && segment.kind === 'work'
        ? segment.id === focusId ? 'focused-segment' : 'dimmed-segment' : '';
      return `<span class="segment ${css} ${highlight} ${i === active ? 'active-segment' : ''}"
        style="--segment-offset:${100 * segment.start / end}%;--segment-width:${width}%"
        title="${details}">${width >= 3 || end < 34 ? segment.label : ''}</span>`;
    };
    const tickStep = end <= 12 ? 1 : end <= 24 ? 2 : Math.ceil(end / 10);
    const ticks = [0];
    for (let t = tickStep; t <= end - Math.ceil(tickStep / 2); t += tickStep) ticks.push(t);
    ticks.push(end);
    return `<div class="time-scroll"><div class="time-plot" style="--min-chart:${Math.max(280, end * 10)}px">
      <div role="img" aria-label="${name}${focusId ? ', con ' + focusId + ' destacado' : ''}, ${segments.length ? segments.map(s => `${s.label} de ${s.start} a ${s.end}`).join(', ') : 'sin tramos mostrados'}"
        class="track ${compact ? 'compact' : ''}">${segments.map(block).join('')}</div>
      <div aria-hidden="true" class="time-axis">${ticks.map(t => `<span style="--tick-position:${100 * t / end}%">${t}</span>`).join('')}</div>
    </div></div>`;
  }

  function workSegments(ids) {
    return ids.map((id, i) => ({
      id, label: id, kind: 'work', start: i, end: i + 1,
      tone: Number(id.slice(-1)) - 1
    }));
  }

  function setPressed(root, selector, key, value) {
    picks(root, selector).forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset[key] === String(value)));
    });
  }

  function useChoice(root, selector, key, onChoose) {
    picks(root, selector).forEach(button => {
      button.addEventListener('click', () => onChoose(button.dataset[key]));
    });
  }

  function stepStory(root, scenes, render, speak) {
    let index = 0;
    const next = pick(root, '[data-step]');
    const back = pick(root, '[data-back]');
    const restart = pick(root, '[data-reset]');
    const container = pick(root, '[data-scene]');
    function draw() {
      container.innerHTML = render(scenes[index], index);
      if (speak) setTalk(root, speak(scenes[index], index));
      next.disabled = index >= scenes.length - 1;
      next.textContent = next.disabled ? 'Recorrido completo' : scenes[index].action ?? 'Siguiente paso';
      if (back) back.disabled = index === 0;
      pick(root, '[data-scene-count]').textContent = `Paso ${index + 1} de ${scenes.length}`;
    }
    next.onclick = () => { index = Math.min(index + 1, scenes.length - 1); draw(); };
    restart.onclick = () => { index = 0; draw(); };
    if (back) back.onclick = () => { index = Math.max(index - 1, 0); draw(); };
    draw();
  }

  function storyBoard({ showPrevious = true } = {}) {
    return `<div class="stack">
      <div data-scene aria-live="polite"></div>
      <div class="between">
        <div class="actions">
          <button type="button" data-step class="primary">Siguiente paso</button>
          ${showPrevious ? '<button type="button" data-back>Paso anterior</button>' : ''}
          <button type="button" data-reset>Reiniciar recorrido</button>
        </div>
        <span class="small" data-scene-count></span>
      </div>
    </div>`;
  }

  return { pick, picks, fmt, ms, chip, metric, entityButton, setTalk, describe, timeline, workSegments, setPressed, useChoice, stepStory, storyBoard };
})();

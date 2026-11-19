'use strict';

const threadModels = (() => {
  const { processDiagram, threadName } = threadDiagrams;
  const { pick, setTalk, describe, setPressed, useChoice } = ui;

  let selectedThreadModel = 'many';

  function mountThreadModels(root) {
    const diagram = pick(root, '[data-thread-models]');
    let selection = { process: 2, index: processDiagram.active };

    function processMap(process, count, many) {
      const threads = Array.from({ length: count }, (_, index) => {
        const active = selection.process === process && selection.index === index;
        return `<div class="mapping-port">
          <button type="button" class="mapping-node" data-user-thread="${process}:${index}"
            aria-label="${threadName(index)} de P${process}" aria-pressed="${active}">${threadName(index)}</button>
          <span class="mapping-wire ${active ? 'lit' : ''}" aria-hidden="true"></span>
        </div>`;
      }).join('');
      const kernels = Array.from({ length: many ? 1 : count }, (_, index) => {
        const active = selection.process === process && (many || index === selection.index);
        return `<div class="mapping-port">
          <span class="mapping-wire ${active ? 'lit' : ''}" aria-hidden="true"></span>
          <span class="mapping-node kernel-node ${active ? 'lit' : ''}">K${process}.${index + 1}</span>
        </div>`;
      }).join('');
      return `<section class="process-envelope mapping-process" aria-label="Mapeo de P${process}" style="--nodes:${count}">
        <h3>Proceso P${process}</h3>
        <div class="mapping-layer">
          <div class="mapping-caption">Modo usuario</div>
          <div class="mapping-nodes" role="group" aria-label="Hilos de usuario de P${process}">${threads}</div>
          ${many ? '<div class="mapping-library">Librería de hilos</div>' : ''}
        </div>
        <div class="mapping-layer mapping-kernel">
          <div class="mapping-nodes" style="--nodes:${many ? 1 : count}" aria-label="Hilos que ve el planificador">${kernels}</div>
          <div class="mapping-caption">Modo núcleo · ${many ? '1 hilo planificable' : count + (count === 1 ? ' hilo planificable' : ' hilos planificables')}</div>
        </div>
      </section>`;
    }

    function draw() {
      const many = selectedThreadModel === 'many';
      const id = 'P' + selection.process + ' · ' + threadName(selection.index);
      const kernel = `K${selection.process}.${many ? 1 : selection.index + 1}`;
      setPressed(root, '[data-thread-model]', 'threadModel', selectedThreadModel);
      diagram.innerHTML = processMap(1, 2, many) + processMap(2, processDiagram.threads.length, many);
      describe(root, `${id} → ${many ? 'librería → ' : ''}${kernel}`,
        many
          ? `Los hilos del proceso usan el mismo hilo de núcleo, ${kernel}. La librería decide cuál ejecuta.`
          : `${id} tiene su propio hilo de núcleo, ${kernel}. El planificador puede darle un turno por separado.`);
    }
    useChoice(root, '[data-thread-model]', 'threadModel', mode => { selectedThreadModel = mode; draw(); });
    diagram.onclick = event => {
      const button = event.target.closest('[data-user-thread]');
      if (!button) return;
      const [process, index] = button.dataset.userThread.split(':').map(Number);
      selection = { process, index };
      draw();
      pick(diagram, '[aria-pressed="true"]')?.focus({ preventScroll: true });
    };
    draw();
  }

  function mountThreadSequence(root) {
    const diagram = pick(root, '[data-read-sequence]');
    const next = pick(root, '[data-sequence-next]');
    const back = pick(root, '[data-sequence-back]');
    const labels = ['H1', 'Librería', 'H2', 'Núcleo', 'Dispositivo'];
    let current = 0;

    function draw() {
      const many = selectedThreadModel === 'many';
      const scheduler = many ? 1 : 3;
      const events = [
        { from: 0, to: 0, label: 'Ejecuta H1', action: 'Ceder turno', h1: 'Ejecutando', h2: 'Preparado', cpu: 'H1',
          talk: 'H1 usa la CPU. H2 espera su turno.' },
        { from: 0, to: scheduler, label: many ? 'yield()' : 'Cede al núcleo', action: 'Dar turno a H2', h1: 'Cede el turno', h2: 'Preparado', cpu: 'Cambio de turno',
          talk: many ? 'H1 cede el turno. La librería elige el siguiente hilo.'
            : 'H1 cede el turno. El núcleo elige el siguiente hilo.' },
        { from: scheduler, to: 2, label: 'Selecciona H2', action: 'Solicitar read()', h1: 'Preparado', h2: 'Ejecutando', cpu: 'H2',
          talk: 'H2 recibe la CPU y puede iniciar la lectura.' },
        { from: 2, to: 3, label: 'read()', action: 'Iniciar lectura', h1: many ? 'Sin hilo de núcleo disponible' : 'Puede recibir CPU', h2: 'Bloqueado', cpu: many ? 'P2 no ejecuta' : 'Puede ejecutar H1',
          talk: many ? 'La lectura bloquea el único hilo de núcleo de P2. H1 también queda sin CPU.'
            : 'La lectura bloquea H2. H1 tiene su propio hilo de núcleo y puede ejecutar.' },
        { from: 3, to: 4, label: 'Inicia la E/S', action: 'Completar lectura', h1: many ? 'Sin hilo de núcleo disponible' : 'Puede recibir CPU', h2: 'Bloqueado', cpu: many ? 'P2 no ejecuta' : 'Puede ejecutar H1',
          talk: many ? 'Ningún hilo de P2 ejecuta mientras dura la lectura.'
            : 'H2 espera los datos. H1 puede usar la CPU durante esa espera.' },
        { from: 4, to: 3, label: 'Datos listos', action: 'Reanudar H2', h1: 'Puede recibir CPU', h2: 'Preparado', cpu: 'El planificador elige',
          talk: 'Llegan los datos. H2 puede volver a recibir CPU.' },
        { from: 3, to: 2, label: 'Retoma H2', h1: 'Preparado', h2: 'Ejecutando', cpu: 'H2',
          talk: many ? 'P2 vuelve a recibir CPU y H2 continúa con los datos de la lectura.'
            : 'El núcleo da un turno a H2, que continúa con los datos de la lectura.' }
      ];
      setPressed(root, '[data-read-model]', 'readModel', selectedThreadModel);
      const header = `<div class="sequence-head"><span class="small sequence-time">Tiempo ↓</span>
        ${labels.map(name => `<strong>${name}</strong>`).join('')}</div>`;
      const rows = events.map((event, index) => {
        const start = Math.min(event.from, event.to);
        const end = Math.max(event.from, event.to);
        const direction = event.from === event.to ? 'stationary' : event.from < event.to ? 'rightward' : 'leftward';
        const state = index === current ? 'current' : index < current ? 'past' : 'future';
        return `<div class="sequence-row ${state}">
          <button type="button" data-sequence-event="${index}" class="sequence-step"
            ${index === current ? 'aria-current="step"' : ''} aria-label="Paso ${index + 1}: ${event.label}">${index + 1}</button>
          ${labels.map((_, lane) => `<span class="lifeline" style="--lane:${lane + 2}" aria-hidden="true"></span>`).join('')}
          <span class="sequence-hop ${direction}" style="--first-lane:${start + 2};--end-lane:${end + 3};--span:${end - start + 1}"
            title="${labels[event.from]} → ${labels[event.to]}"><b>${event.label}</b><i aria-hidden="true"></i></span>
        </div>`;
      }).join('');
      diagram.innerHTML = header + rows;
      const step = events[current];
      const waiting = current === 3 || current === 4;
      pick(root, '[data-read-states]').innerHTML = `<div class="flow-cell ${waiting && many ? 'active' : ''}"><strong>H1</strong><span>${step.h1}</span></div>
        <div class="flow-cell ${waiting ? 'active' : ''}"><strong>H2</strong><span>${step.h2}</span></div>
        <div class="flow-cell"><strong>Turno de CPU del ejemplo</strong><span>${step.cpu}</span></div>`;
      next.disabled = current === events.length - 1;
      next.textContent = step.action ?? 'Lectura completada';
      back.disabled = current === 0;
      pick(root, '[data-sequence-count]').textContent = `Paso ${current + 1} de ${events.length}`;
      setTalk(root, step.talk);
    }

    useChoice(root, '[data-read-model]', 'readModel', mode => { selectedThreadModel = mode; draw(); });
    diagram.onclick = event => {
      const button = event.target.closest('[data-sequence-event]');
      if (!button) return;
      current = Number(button.dataset.sequenceEvent);
      draw();
      pick(diagram, '[aria-current="step"]').focus({ preventScroll: true });
    };
    next.onclick = () => { if (!next.disabled) { current++; draw(); } };
    back.onclick = () => { if (current > 0) { current--; draw(); } };
    pick(root, '[data-sequence-block]').onclick = () => { current = 4; draw(); };
    pick(root, '[data-sequence-reset]').onclick = () => { current = 0; draw(); };
    draw();
  }

  return { mountThreadModels, mountThreadSequence };
})();

'use strict';

const threadDiagrams = (() => {
  const { pick, describe } = ui;

  const diagramThreadLimit = 6;
  const newDiagramThread = () => ({ instruction: 0 });
  const processDiagram = { threads: [newDiagramThread(), newDiagramThread()], active: 0, lastAddedCount: null };
  const programLines = ['Leer un bloque', 'Procesar los datos', 'Guardar el resultado'];
  const threadName = index => 'H' + (index + 1);

  const processRegions = {
    files: { name: 'Archivos', explanation: 'Los hilos pueden leer o escribir los archivos que el proceso tiene abiertos, como el documento del editor.' },
    data: { name: 'Datos', explanation: 'Los datos son los valores que usa el programa. Por ejemplo, dos hilos del editor pueden leer el mismo texto guardado.' },
    code: { name: 'Código', explanation: 'El código son las instrucciones del programa. Los hilos usan ese mismo código y cada uno guarda en qué instrucción va.' }
  };

  function addDiagramThread() {
    if (processDiagram.threads.length < diagramThreadLimit) {
      processDiagram.active = processDiagram.threads.push(newDiagramThread()) - 1;
      processDiagram.lastAddedCount = processDiagram.threads.length;
    }
  }

  function removeDiagramThread() {
    if (processDiagram.threads.length > 1) processDiagram.threads.pop();
    processDiagram.active = Math.min(processDiagram.active, processDiagram.threads.length - 1);
    processDiagram.lastAddedCount = null;
  }

  function mountProcessAnatomy(root) {
    const diagram = pick(root, '[data-process-diagram]');
    const title = pick(root, '[data-anatomy-title]');
    const advance = pick(root, '[data-anatomy-advance]');
    const add = pick(root, '[data-anatomy-add]');
    const remove = pick(root, '[data-anatomy-remove]');
    const reference = newDiagramThread();
    let selected = { part: 'stack', index: processDiagram.active };

    function partButton(process, part, index, label, accessibleLabel = label) {
      if (process === 'mono') return `<span class="process-part-reference">${label}</span>`;
      const pressed = part === selected.part && index === selected.index;
      return `<button type="button" class="process-part" data-anatomy-part="${part}|${index}"
        aria-label="${accessibleLabel}" aria-pressed="${pressed}">${label}</button>`;
    }

    function processBox(process, threads) {
      const mono = process === 'mono';
      const name = mono ? 'P1' : 'P2';
      const resources = Object.entries(processRegions).map(([key, resource]) =>
        partButton(process, key, -1, resource.name, resource.name + ' de ' + name)).join('');
      const contexts = threads.map((_, index) => {
        const id = threadName(index);
        const active = !mono && index === selected.index;
        return `<div class="thread-envelope ${active ? 'thread-observed' : ''}">
          <strong>${id} · ${index === 0 ? 'Hilo principal' : 'Hilo adicional'}</strong>
          <div class="thread-parts">
            ${partButton(process, 'stack', index, 'Pila', 'Pila de ' + id + ' en ' + name)}
            ${partButton(process, 'registers', index, 'Registros', 'Registros de ' + id + ' en ' + name)}
          </div>
        </div>`;
      }).join('');
      const kind = threads.length === 1 ? 'Monohilo' : 'Multihilo';
      return `<section class="process-envelope" aria-label="${name} · ${kind}">
        <div class="between process-heading"><h3>Proceso ${name} · ${kind}</h3>
          <span class="small">${threads.length} ${threads.length === 1 ? 'hilo' : 'hilos'}${mono ? ' · referencia' : ''}</span></div>
        <div class="process-resources" role="group" aria-label="Recursos de ${name}">${resources}</div>
        <div class="thread-envelopes ${threads.length > 3 ? 'many' : ''}">${contexts}</div>
      </section>`;
    }

    function draw(added = false) {
      diagram.innerHTML = processBox('mono', [reference]) + processBox('multi', processDiagram.threads);
      add.disabled = processDiagram.threads.length >= diagramThreadLimit;
      remove.disabled = processDiagram.threads.length <= 1;
      const resource = processRegions[selected.part];
      if (resource) {
        title.textContent = resource.name + ' de P2';
        advance.hidden = true;
        describe(root, 'Recurso compartido.', resource.explanation);
        return;
      }

      const id = threadName(selected.index);
      const thread = processDiagram.threads[selected.index];
      const finished = thread.instruction === programLines.length;
      const following = finished ? 'tarea terminada' : programLines[thread.instruction].toLowerCase();
      const stack = selected.part === 'stack';
      title.textContent = `${stack ? 'Pila' : 'Registros'} de ${id} en P2`;
      advance.hidden = false;
      advance.disabled = finished;
      advance.textContent = 'Avanzar ' + id;
      if (stack) {
        describe(root, added ? 'Nuevo hilo en P2.' : 'Pila propia del hilo.', added
          ? `${id} aparece con su propia pila para guardar datos temporales y con sus propios valores de registros. El código, los datos comunes y los archivos son del proceso completo.`
          : `La pila de ${id} es donde ese hilo guarda datos temporales, como los valores de un cálculo. Cada hilo tiene una pila para su trabajo.`);
      } else {
        describe(root, `Instrucciones hechas: ${thread.instruction}. Siguiente: ${following}.`,
          `Los registros son espacios pequeños y rápidos del procesador. El sistema guarda sus valores para que ${id} pueda continuar desde la próxima instrucción.`);
      }
    }

    diagram.onclick = event => {
      const button = event.target.closest('[data-anatomy-part]');
      if (!button) return;
      const key = button.dataset.anatomyPart;
      const [part, index] = key.split('|');
      selected = { part, index: Number(index) };
      if (selected.index >= 0) processDiagram.active = selected.index;
      draw();
      pick(diagram, '[aria-pressed="true"]')?.focus({ preventScroll: true });
    };
    add.onclick = () => {
      addDiagramThread();
      selected = { part: 'stack', index: processDiagram.active };
      draw(true);
    };
    remove.onclick = () => {
      removeDiagramThread();
      selected = { part: 'stack', index: processDiagram.active };
      draw();
    };
    advance.onclick = () => {
      const thread = processDiagram.threads[selected.index];
      if (!thread || thread.instruction >= programLines.length) return;
      thread.instruction++;
      selected.part = 'registers';
      draw();
    };
    pick(root, '[data-anatomy-reset]').onclick = () => {
      processDiagram.threads = [newDiagramThread(), newDiagramThread()];
      processDiagram.active = 0;
      processDiagram.lastAddedCount = null;
      selected = { part: 'stack', index: 0 };
      draw();
    };
    draw();
  }

  function mountThreadMemory(root) {
    const diagram = pick(root, '[data-address-map]');
    const moments = pick(root, '[data-memory-moments]');
    const toggle = pick(root, '[data-memory-toggle]');
    const cue = pick(root, '[data-memory-cue]');
    const done = pick(root, '[data-memory-done]');
    pick(root, '.memory-controls').append(pick(root, '#lesson-explanation'));
    const currentCount = processDiagram.threads.length;
    const replayLastAddition = currentCount === processDiagram.lastAddedCount || currentCount === diagramThreadLimit;
    const beforeCount = replayLastAddition ? currentCount - 1 : currentCount;
    const afterCount = beforeCount + 1;
    const newThread = threadName(beforeCount);
    let after = false;

    function moment(label, count, active) {
      const totals = count === 1 ? '1 hilo · 1 pila' : `${count} hilos · ${count} pilas`;
      return `<div class="memory-moment" aria-current="${active ? 'step' : 'false'}">
        <span>${label}</span><strong>${totals}</strong>
      </div>`;
    }

    function draw() {
      const count = after ? afterCount : beforeCount;
      const stacks = Array.from({ length: count }, (_, index) => {
        const added = after && index === beforeCount;
        return `<div class="memory-region memory-stack${added ? ' is-new' : ''}">
          <strong>Pila de ${threadName(index)}</strong>${added ? '<span class="memory-new-tag">Nueva</span>' : ''}
        </div>`;
      }).join('');
      diagram.innerHTML = `<div class="address-row">
        <div class="address-box">
          <div class="memory-region memory-kernel"><strong>Núcleo del sistema operativo</strong><span>Parte que administra el equipo</span></div>
        </div>
        <span class="address-bracket">Espacio del núcleo</span>
      </div>
      <div class="address-row address-user">
        <div class="address-box">
          <div class="memory-group">
            <h3>Pilas de P2</h3>
            ${stacks}
          </div>
          <div class="memory-group">
            <h3>Memoria que comparten los hilos de P2</h3>
            <div class="memory-region"><strong>Montón</strong><span>Espacio que el programa reserva para datos nuevos</span></div>
            <div class="memory-region"><strong>Datos</strong><span>Valores que el programa conserva al funcionar</span></div>
            <div class="memory-region"><strong>Código</strong><span>Instrucciones del programa</span></div>
          </div>
        </div>
        <span class="address-bracket">Espacio de usuario</span>
      </div>`;
      moments.innerHTML = moment('Antes', beforeCount, !after) + moment('Después', afterCount, after);
      toggle.textContent = after ? 'Reiniciar ejemplo' : 'Mostrar la pila nueva';
      toggle.classList.toggle('primary', !after);
      cue.hidden = after;
      done.hidden = !after;
      if (after) {
        describe(root, `${newThread} ya tiene su propia pila.`,
          `P2 pasa de ${beforeCount} a ${afterCount} pilas porque se agregó ${newThread}. Todos los hilos usan el código, los datos comunes y el montón del mismo proceso.`);
      } else {
        describe(root, `${newThread} es el siguiente hilo de P2.`,
          'Cada fila de pila pertenece a un hilo. Debajo aparecen el código, los datos y el montón, que todos los hilos de P2 pueden usar.');
      }
    }

    toggle.onclick = () => {
      after = !after;
      draw();
    };
    draw();
  }

  return { processDiagram, threadName, mountProcessAnatomy, mountThreadMemory };
})();

'use strict';

const threadDemos = (() => {
  const { pick, ms, metric, entityButton, describe, timeline, setPressed, useChoice, stepStory } = ui;

  const editorThreads = {
    H1: { role: 'Interfaz', task: 'atender la escritura', read: 'cargar la configuración del editor' },
    H2: { role: 'Revisión', task: 'revisar el texto', read: 'cargar una entrada del diccionario' }
  };
  let observedThread = 'H1';

  function mountThreadIntro(root) {
    const start = 'Informe sobre sistemas operativos.';
    const additions = [
      'Cada hilo ejecuta su parte del procso.',
      'Podemos revisar una palbra sin salir del editor.',
      'Los hilos trabajan sobre el mismo documento.'
    ];
    const corrections = { procso: 'proceso', palbra: 'palabra' };
    const write = pick(root, '[data-editor-write]');
    const review = pick(root, '[data-editor-review]');
    const page = pick(root, '[data-editor-lines]');
    let lines = [start];
    let checked = 0;
    let lastAction = null;

    function draw() {
      const found = [];
      page.innerHTML = lines.map((line, i) => {
        const text = i < checked ? line.replace(/\b(procso|palbra)\b/g, word => {
          found.push(word);
          return `<mark class="editor-flag" title="Sugerencia: ${corrections[word]}">${word}</mark>`;
        }) : line;
        return `<li>${text}</li>`;
      }).join('');
      write.disabled = lines.length - 1 >= additions.length;
      review.disabled = checked === lines.length;
      write.classList.toggle('primary', checked === lines.length || !lastAction);
      review.classList.toggle('primary', checked < lines.length && lastAction === 'write');
      if (!lastAction) {
        describe(root, 'El editor ya tiene una línea.',
          'P1 es el proceso del editor. Su memoria guarda el texto que usan los dos hilos.');
      } else if (lastAction === 'write') {
        describe(root, `H1 añadió la línea ${lines.length}.`,
          'H1 acaba de guardar una línea en la memoria del editor. H2 puede leerla y revisar su ortografía.');
      } else {
        const suggestions = found.map(word => '«' + word + '» → «' + corrections[word] + '»').join(' · ');
        describe(root, suggestions ? 'H2 encontró ' + (found.length === 1 ? 'una marca' : found.length + ' marcas') + ' · ' + suggestions : 'H2 revisó el texto y no encontró marcas.',
          suggestions
            ? 'H2 revisó el texto que escribió H1. Las palabras resaltadas muestran las faltas que encontró.'
            : 'H2 revisó el texto compartido. La revisión terminó con cero palabras marcadas.');
      }
    }
    write.onclick = () => {
      if (write.disabled) return;
      lines.push(additions[lines.length - 1]);
      observedThread = 'H1';
      lastAction = 'write';
      draw();
    };
    review.onclick = () => {
      if (review.disabled) return;
      checked = lines.length;
      observedThread = 'H2';
      lastAction = 'review';
      draw();
    };
    pick(root, '[data-editor-reset]').onclick = () => {
      lines = [start];
      checked = 0;
      observedThread = 'H1';
      lastAction = null;
      draw();
    };
    draw();
  }

  function mountThreadStates(root) {
    let mode = 'io';
    function choose() {
      const id = observedThread;
      const other = id === 'H1' ? 'H2' : 'H1';
      const thread = editorThreads[id];
      const io = mode === 'io';
      setPressed(root, '[data-state-thread]', 'stateThread', id);
      setPressed(root, '[data-state-mode]', 'stateMode', mode);

      const steps = [
        { state: 'Preparado', cpu: 'Libre', reason: 'Listo para ejecutar', action: 'Dar turno', text: `${id} está preparado.`, talk: `${id} ya tiene trabajo. Solo espera su turno de CPU.` },
        { state: 'En CPU', cpu: id, reason: 'Recibe un turno', action: io ? 'Pedir lectura' : 'Agotar turno', text: `El planificador asigna el núcleo a ${id}.`, talk: `${id} recibe la CPU para ${thread.task}.` },
        ...(io ? [
          { state: 'Bloqueado', cpu: other, reason: 'Pide una lectura', action: 'Completar lectura', text: `${id} pide ${thread.read}.`, talk: `${id} queda bloqueado hasta que llegan los datos. Durante esa espera, ${other} usa el núcleo.` },
          { state: 'Preparado', cpu: other, reason: 'Finaliza la lectura', action: 'Reanudar hilo', text: `${id} vuelve a la cola.`, talk: `Ya llegaron los datos. ${id} está preparado para recibir otro turno.` }
        ] : [
          { state: 'Preparado', cpu: other, reason: 'Se agota el turno', action: 'Reanudar hilo', text: `${id} vuelve a la cola por fin de turno.`, talk: `Se acabó el turno de ${id}. Sigue preparado y espera otro turno.` }
        ]),
        { state: 'En CPU', cpu: id, reason: 'Vuelve a ejecutar', action: 'Terminar tarea', text: `${id} reanuda su ejecución.`, talk: `El sistema conserva el punto donde quedó ${id}. El hilo continúa desde allí.` },
        { state: 'Terminado', cpu: 'Libre', reason: 'Completa su tarea', text: `${id} termina.`, talk: 'El núcleo queda libre para otro hilo preparado.' }
      ];
      stepStory(root, steps, (step, index) => `<div class="stack">
        <div class="state-route" style="--state-count:${steps.length}" aria-label="Secuencia de estados">
          ${steps.map((item, i) => `<div class="state-node ${i < index ? 'reached' : ''}" ${i === index ? 'aria-current="step"' : ''}>
            <small>Paso ${i + 1}</small><b>${item.state}</b>
          </div>`).join('')}
        </div>
        <div class="box state-detail">
          <h3>${step.reason}</h3>
          <div class="tri">
            <div class="flow-cell"><strong>Hilo observado</strong><span>${id} · ${thread.role}</span></div>
            <div class="flow-cell active"><strong>Estado</strong><span>${step.state}</span></div>
            <div class="flow-cell"><strong>Núcleo</strong><span>${step.cpu}</span></div>
          </div>
          <p>${step.text}</p>
        </div>
      </div>`, step => step.talk);
    }
    useChoice(root, '[data-state-thread]', 'stateThread', id => { observedThread = id; choose(); });
    useChoice(root, '[data-state-mode]', 'stateMode', value => { mode = value; choose(); });
    choose();
  }

  function mountThreadWork(root) {
    let threads = 3;
    let turn = 0;
    let work = [];
    let onCores = [];
    let cursor = 0;
    let selected = 1;
    const blocked = new Set();
    const coresField = pick(root, '[data-cores]');
    const options = pick(root, '[data-work-options]');
    const choices = pick(root, '[data-work-threads]');
    const block = pick(root, '[data-thread-block]');
    const add = pick(root, '[data-thread-add]');
    const remove = pick(root, '[data-thread-remove]');
    const step = pick(root, '[data-work-step]');
    const finish = pick(root, '[data-work-finish]');
    const total = 12;

    function drawChoices() {
      choices.innerHTML = Array.from({ length: threads }, (_, i) => entityButton('H' + (i + 1), i, i + 1 === selected)).join('');
    }

    function draw() {
      const cores = +coresField.value;
      setPressed(root, '[data-work-case]', 'workCase', threads + ':' + cores);
      const parallel = Math.min(threads - blocked.size, cores);
      const complete = work.length === total;
      const expected = complete ? turn : parallel ? turn + Math.ceil((total - work.length) / parallel) : '—';
      const selectedId = 'H' + selected;
      const contribution = work.filter(id => id === selected).length;
      const waiting = blocked.has(selected);
      setPressed(root, '[data-entity]', 'entity', selectedId);
      const onLastCore = onCores.indexOf(selected) + 1;
      const last = onLastCore ? ` · Núcleo ${onLastCore} en el último turno` : '';
      pick(root, '[data-thread-state]').textContent = `${selectedId} · ${waiting ? 'Bloqueado por E/S' : 'Disponible'} · ${contribution} ${contribution === 1 ? 'unidad hecha' : 'unidades hechas'}${last}`;
      block.textContent = `${waiting ? 'Reanudar' : 'Bloquear'} ${selectedId}`;
      block.disabled = complete;
      pick(root, '[data-work]').innerHTML = Array.from({ length: total }, (_, i) => {
        const id = work[i];
        const css = id ? 'tone-' + (id - 1) : 'pending';
        const focus = options.open ? id === selected ? 'focused-unit' : id ? 'dimmed-unit' : '' : '';
        return `<span class="${css} ${focus}" title="Unidad ${i + 1}${id ? ' completada por H' + id : ' pendiente'}">${id ? 'H' + id : i + 1}</span>`;
      }).join('');
      pick(root, '[data-core-map]').innerHTML = Array.from({ length: cores }, (_, i) => {
        const id = onCores[i];
        return `<div class="flow-cell ${id ? 'active' : ''} ${options.open && id === selected ? 'core-focus' : ''}"><strong>Núcleo ${i + 1}</strong>
          <span>${id ? 'H' + id + ' en el último turno' : 'Libre'}</span></div>`;
      }).join('');
      pick(root, '[data-stats]').innerHTML = metric(`${work.length} / ${total}`, 'Unidades completas')
        + metric(turn, 'Turnos usados') + metric(expected, 'Turnos previstos');
      const capacity = parallel === 1 ? 'Una unidad por turno.' : `Hasta ${parallel} unidades por turno.`;
      if (complete) {
        describe(root, `Las 12 unidades se completaron en ${turn} turnos.`,
          `El trabajo completo tomó ${turn} ${turn === 1 ? 'turno' : 'turnos'}.`);
      } else if (!parallel) {
        describe(root, 'Todos los hilos esperan E/S. Reanuda uno para continuar.',
          'El trabajo se detiene porque todos los hilos están bloqueados.');
      } else if (waiting) {
        describe(root, `${selectedId} espera E/S. ${capacity}`,
          `${selectedId} está bloqueado. El trabajo continúa con los hilos que están listos.`);
      } else if (!turn) {
        const explanation = cores === 1 && threads > 1
          ? 'Los hilos se reparten los turnos de un solo núcleo. En cada turno se llena una casilla de trabajo.'
          : parallel === 1 ? 'Un hilo completa una casilla de trabajo por turno.' : `${parallel} hilos pueden trabajar al mismo tiempo, uno en cada núcleo. A eso se le llama paralelismo.`;
        describe(root, capacity, explanation);
      } else {
        describe(root, `Turno ${turn}. Se completaron ${onCores.length} ${onCores.length === 1 ? 'unidad' : 'unidades'}. Quedan ${total - work.length}.`,
          onCores.length === 1 ? 'En este turno trabajó un núcleo y se llenó una casilla.' : `Trabajaron ${onCores.length} núcleos al mismo tiempo. Cada uno completó una casilla en este turno.`);
      }
      add.disabled = threads >= 6;
      remove.disabled = threads <= 1;
      step.disabled = finish.disabled = complete || parallel === 0;
    }
    function reset() { work = []; onCores = []; turn = 0; cursor = 0; draw(); }
    function advance() {
      const ready = Array.from({ length: threads }, (_, i) => (cursor + i) % threads + 1)
        .filter(id => !blocked.has(id));
      onCores = ready.slice(0, Math.min(+coresField.value, total - work.length));
      if (!onCores.length) return false;
      cursor = onCores.at(-1) % threads;
      work.push(...onCores);
      turn++;
      return true;
    }
    choices.onclick = event => {
      const button = event.target.closest('[data-entity]');
      if (!button) return;
      selected = Number(button.dataset.entity.slice(1));
      draw();
    };
    block.onclick = () => {
      if (blocked.has(selected)) blocked.delete(selected);
      else blocked.add(selected);
      draw();
    };
    add.onclick = () => {
      if (threads >= 6) return;
      selected = ++threads;
      drawChoices();
      reset();
    };
    remove.onclick = () => {
      if (threads <= 1) return;
      blocked.delete(threads--);
      selected = Math.min(selected, threads);
      drawChoices();
      reset();
    };
    coresField.onchange = reset;
    step.onclick = () => { advance(); draw(); };
    finish.onclick = () => {
      while (work.length < total) {
        if (!advance()) break;
      }
      draw();
    };
    pick(root, '[data-reset]').onclick = reset;
    function loadScenario(value) {
      const [threadCount, cores] = value.split(':').map(Number);
      threads = threadCount;
      selected = 1;
      coresField.value = cores;
      blocked.clear();
      drawChoices();
      reset();
    }
    pick(root, '[data-default]').onclick = () => loadScenario('3:1');
    useChoice(root, '[data-work-case]', 'workCase', loadScenario);
    options.addEventListener('toggle', draw);
    drawChoices();
    draw();
  }

  function mountThreadIO(root) {
    function segment(label, start, end, tone, kind = 'work') {
      return { label, start, end, tone, kind };
    }
    function draw(mode) {
      const two = mode === 'two';
      const cpu = [
        segment('A', 0, 1, 0),
        ...(two ? [segment('B', 1, 3, 2), segment('Libre', 3, 4, 0, 'idle')] : [segment('Libre', 1, 4, 0, 'idle')]),
        segment('A', 4, 5, 0)
      ];
      if (!two) cpu.push(segment('B', 5, 7, 2));
      setPressed(root, '[data-thread-io]', 'threadIo', mode);
      pick(root, '[data-cpu]').innerHTML = timeline(cpu, 7, { compact: true, name: 'Ocupación de la CPU' });
      pick(root, '[data-io]').innerHTML = timeline([segment('Lectura en curso', 1, 4, 1)], 7, { compact: true, name: 'Lectura de A' });
      pick(root, '[data-stats]').innerHTML = metric(ms(two ? 5 : 7), 'Termina todo el trabajo')
        + metric(ms(two ? 1 : 3), 'CPU libre antes de terminar');
      describe(root, two
        ? 'H2 ejecuta B de t = 1 a t = 3 mientras H1 espera la lectura.'
        : 'El único hilo espera la lectura entre t = 1 y t = 4. B se ejecuta después de A.',
        two ? 'H2 hace B mientras H1 espera la lectura. Todo termina en 5 ms.'
          : 'Durante la lectura, la CPU queda libre. B empieza después de A y todo termina en 7 ms.');
    }
    useChoice(root, '[data-thread-io]', 'threadIo', draw);
    draw('one');
  }

  function mountThreadJoin(root) {
    let state = 0;
    const [create, join, finish] = ['create', 'join', 'finish'].map(key => pick(root, '[data-' + key + ']'));
    const rows = [
      ['Ejecutando', 'Sin crear', 'H1 es el hilo principal.', '// El proceso empieza con H1.', 'Al crearlo, se indica qué función ejecutará H2.'],
      ['Puede continuar', 'Preparado', 'H2 ya existe y está listo.', 'pthread_create(&h2, NULL, tarea, datos);', 'H1 puede seguir trabajando mientras H2 espera su turno.'],
      ['Bloqueado en join', 'Ejecutando', 'H1 espera a H2.', 'pthread_join(h2, NULL);', 'La llamada a join detiene H1 hasta que termine H2.'],
      ['Preparado para continuar', 'Terminado', 'H2 termina su función.', '// La función tarea de H2 retorna.\n// El join de H1 puede terminar.', 'H1 vuelve a estar listo y puede recibir CPU.']
    ];
    function draw() {
      const [h1, h2, status, code, explanation] = rows[state];
      pick(root, '[data-h1]').textContent = h1;
      pick(root, '[data-h2]').textContent = h2;
      describe(root, status, explanation);
      pick(root, '[data-code]').textContent = code;
      create.disabled = state !== 0;
      join.disabled = state !== 1;
      finish.disabled = state !== 2;
    }
    create.onclick = () => { state = 1; draw(); };
    join.onclick = () => { state = 2; draw(); };
    finish.onclick = () => { state = 3; draw(); };
    pick(root, '[data-reset]').onclick = () => { state = 0; draw(); };
    draw();
  }

  return { mountThreadIntro, mountThreadStates, mountThreadWork, mountThreadIO, mountThreadJoin };
})();

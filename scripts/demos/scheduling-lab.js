'use strict';

const schedulingLab = (() => {
  const { baseJobs, idleJobs, policies, cloneJobs, schedule } = scheduling;
  const { pick, picks, fmt, ms, chip, metric, entityButton, setTalk, timeline, setPressed, useChoice } = ui;

  const policyOptions = Object.entries(policies)
    .map(([value, name]) => `<option value="${value}">${name}</option>`).join('');

  const lab = { jobs: cloneJobs(baseJobs), policy: 'fcfs', quantum: 2, cost: 0, nextId: 4 };

  function labConfig() {
    return `<form class="stack-sm lab-form" data-lab-form>
      <div class="lab-settings">
        <label class="field">Algoritmo<select data-lab-policy>${policyOptions}</select></label>
        <label class="field">Quantum RR (ms)<input type="number" min="1" max="20" step="1" value="2" data-lab-quantum required></label>
        <label class="field">Cambio (ms)<input type="number" min="0" max="3" step="1" value="0" data-lab-cost required></label>
      </div>
      <div class="table-scroll">
        <table>
          <caption>Procesos de la simulación</caption>
          <thead><tr><th>Proceso</th><th>Llegada<br>(ms)</th><th>Ráfaga<br>(ms)</th><th>Prioridad</th><th>Quitar</th></tr></thead>
          <tbody data-job-rows></tbody>
        </table>
      </div>
      <div class="actions">
        <button type="button" data-preset="rr">Ejemplo Round Robin</button>
        <button type="button" data-add-job>Añadir proceso</button>
        <button type="button" data-preset="convoy">Cargar convoy</button>
        <button type="button" data-preset="idle">Con pausas</button>
        <button type="submit" class="primary">Preparar simulación</button>
      </div>
      <p class="small" data-config-note aria-live="polite"></p>
    </form>`;
  }

  function labPlayback() {
    return `<div class="stack-sm">
      <div class="strip">
        <strong>Proceso a observar</strong>
        <div class="actions" data-lab-jobs role="group" aria-label="Proceso a observar"></div>
      </div>
      <div class="between"><h3>Diagrama de Gantt</h3><span class="small" data-lab-count></span></div>
      <div data-lab-plot></div>
      <p class="status" data-lab-status aria-live="polite"></p>
      <p class="small" data-lab-decision hidden></p>
      <div class="actions">
        <button type="button" class="primary" data-lab-next>Avanzar tramo</button>
        <button type="button" data-lab-play>Reproducir</button>
        <button type="button" data-lab-finish>Ver resultado</button>
        <button type="button" data-lab-reset>Volver a t = 0</button>
      </div>
      <div class="box stack-sm inspector" data-inspect-job aria-live="polite"></div>
      <div class="stack-sm" data-lab-result hidden></div>
    </div>`;
  }

  function mountLab(root) {
    const form = pick(root, '[data-lab-form]');
    const policy = pick(form, '[data-lab-policy]');
    const quantum = pick(form, '[data-lab-quantum]');
    const cost = pick(form, '[data-lab-cost]');
    const rows = pick(form, '[data-job-rows]');
    const add = pick(form, '[data-add-job]');
    const status = pick(root, '[data-lab-status]');
    const decision = pick(root, '[data-lab-decision]');
    const next = pick(root, '[data-lab-next]');
    const finish = pick(root, '[data-lab-finish]');
    const play = pick(root, '[data-lab-play]');
    const rewind = pick(root, '[data-lab-reset]');
    const summary = pick(root, '[data-lab-result]');
    const plot = pick(root, '[data-lab-plot]');
    const choices = pick(root, '[data-lab-jobs]');
    const inspector = pick(root, '[data-inspect-job]');
    const configNote = pick(form, '[data-config-note]');
    let draft = cloneJobs(lab.jobs);
    let selectedId = draft[1]?.id ?? draft[0].id;
    let result;
    let shown = 0;
    let clock = null;
    let dirty = false;
    policy.value = lab.policy;
    quantum.value = lab.quantum;
    cost.value = lab.cost;

    function stop() {
      if (clock !== null) clearInterval(clock);
      clock = null;
      play.textContent = 'Reproducir';
    }

    function drawSelection() {
      setPressed(root, '[data-entity]', 'entity', selectedId);
      picks(rows, '[data-row-job]').forEach(row => {
        row.classList.toggle('focus-row', row.dataset.rowJob === selectedId);
      });
    }

    function drawInspector(visible) {
      const job = result.rows.find(item => item.id === selectedId);
      if (dirty || !job) {
        inspector.innerHTML = `<h3>Proceso ${selectedId}</h3><p>Prepara la simulación para ver los datos actualizados.</p>`;
        setTalk(root, 'Pulsa «Preparar simulación» para aplicar los cambios.');
        return;
      }

      const current = visible.at(-1);
      const time = current?.end ?? 0;
      const slices = visible.filter(segment => segment.id === job.id);
      const done = slices.reduce((sum, segment) => sum + segment.end - segment.start, 0);
      const waiting = Math.max(0, Math.min(time, job.finish) - job.arrival - done);
      const finished = done === job.burst;
      const arrived = time >= job.arrival;
      const state = finished ? 'Terminado'
        : !arrived ? 'Todavía no llega' : current?.id === job.id ? 'Ejecutó el último tramo' : 'En espera de CPU';
      const response = slices.length ? ms(job.response) : '—';
      const intervals = slices.map(segment => `${segment.start}–${segment.end}`).join(' · ');
      const progressLabel = `${job.id} ha ejecutado ${done} de ${job.burst} milisegundos`;
      inspector.innerHTML = `<div class="between"><h3>${chip(job.id, job.order)} ${state}</h3><span class="small">t = ${ms(time)} · llega en ${ms(job.arrival)}</span></div>
        <progress value="${done}" max="${job.burst}" aria-label="${progressLabel}"></progress>
        <div class="dials">
          ${metric(`${done} / ${job.burst} ms`, 'Ejecutado')}
          ${metric(ms(waiting), 'Espera acumulada')}
          ${metric(response, 'Primera respuesta')}
        </div>
        <p class="small">${intervals ? 'Tramos de ' + job.id + ' (ms) · ' + intervals : 'Aún sin tramos ejecutados.'}</p>`;
      if (finished) {
        setTalk(root, `${job.id} termina en el instante ${job.finish}. En total pasa ${job.wait} ms esperando CPU.`);
      } else if (!arrived) {
        setTalk(root, `${job.id} todavía no llega. Se incorpora en el instante ${job.arrival}.`);
      } else {
        setTalk(root, `${job.id} ha usado ${done} de ${job.burst} ms de CPU y acumula ${waiting} ms de espera.`);
      }
    }

    function drawPlayback() {
      const complete = shown === result.segments.length;
      if (complete) stop();
      const current = result.segments[shown - 1];
      pick(root, '[data-lab-count]').textContent = `${shown} / ${result.segments.length} tramos`;
      const visible = result.segments.slice(0, shown);
      plot.innerHTML = timeline(visible, result.end, { active: shown - 1, name: 'Planificación del laboratorio', focusId: selectedId });
      const scroll = pick(plot, '.time-scroll');
      if (current && scroll.scrollWidth > scroll.clientWidth) {
        scroll.scrollLeft = (current.end / result.end) * (scroll.scrollWidth - scroll.clientWidth);
      }
      if (complete) status.textContent = `${policies[lab.policy]} termina en t = ${ms(result.end)}. Hay ${result.switches} cambios entre procesos.`;
      else if (!current) status.textContent = `${policies[lab.policy]} está listo. El reloj empieza en t = 0.`;
      else {
        const action = current.kind === 'work' ? `${current.id} usa la CPU`
          : current.kind === 'switch' ? 'El sistema cambia de contexto' : 'La CPU queda libre';
        status.textContent = `${action} entre t = ${current.start} y t = ${ms(current.end)}.`;
      }
      const rules = {
        fcfs: 'Se elige por orden de llegada entre los procesos listos.',
        sjf: 'Se elige la ráfaga más corta entre los procesos listos al quedar libre la CPU.',
        srtf: 'Se favorece el proceso con menos tiempo de CPU pendiente.',
        rr: `Se toma el frente de la cola y se da un turno de hasta ${ms(lab.quantum)}.`,
        priority: 'Se elige la mejor prioridad al quedar libre la CPU. Un número menor tiene mayor prioridad.',
        priorityP: 'Una prioridad más alta puede interrumpir al proceso en curso.'
      };
      decision.hidden = current?.kind !== 'work' || dirty || complete;
      if (!decision.hidden) decision.textContent = rules[lab.policy];
      next.disabled = finish.disabled = play.disabled = complete || dirty;
      rewind.disabled = shown === 0 || dirty;
      drawSelection();
      drawInspector(visible);
      summary.hidden = !complete || dirty;
      if (!summary.hidden) {
        const wasOpen = pick(summary, 'details')?.open;
        const tableRows = result.rows.map(job => `<tr class="${job.id === selectedId ? 'focus-row' : ''}">
          <td>${job.id}</td><td>${job.finish}</td><td>${job.wait}</td><td>${job.turn}</td><td>${job.response}</td>
          </tr>`).join('');
        summary.innerHTML = `<div class="grid-stats">
          ${metric(ms(result.wait), 'Espera media')}${metric(ms(result.response), 'Respuesta media')}
          ${metric(ms(result.turn), 'Retorno medio')}${metric(`${fmt(result.utilization)}%`, 'Uso útil de CPU')}
          </div><details ${wasOpen ? 'open' : ''}>
            <summary>Ver tiempos por proceso</summary>
            <div class="table-scroll">
              <table><caption>Tiempos en milisegundos</caption>
                <thead><tr><th>Proceso</th><th>Fin</th><th>Espera</th><th>Retorno</th><th>Respuesta</th></tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
            </div>
            <p class="small">Rendimiento · ${fmt(result.throughput)} procesos por ms.</p>
          </details>`;
      }
    }

    function markDirty() {
      stop();
      dirty = true;
      configNote.textContent = 'Hay cambios pendientes. Pulsa «Preparar simulación» para aplicarlos.';
      drawPlayback();
    }

    function drawJobs() {
      const limits = [['arrival', 'Llegada', 0, 40], ['burst', 'Ráfaga', 1, 20], ['priority', 'Prioridad', 1, 9]];
      rows.innerHTML = draft.map((job, i) => `<tr data-row-job="${job.id}">
        <td>${entityButton(job.id, i, job.id === selectedId)}</td>
        ${limits.map(([key, label, min, max]) => `<td><input type="number" min="${min}" max="${max}" step="1"
          value="${Number.isFinite(job[key]) ? job[key] : ''}" data-i="${i}" data-key="${key}"
          aria-label="${label} de ${job.id}" required></td>`).join('')}
        <td><button type="button" class="table-action" aria-label="Quitar ${job.id}"
          data-remove="${i}" ${draft.length <= 1 ? 'disabled' : ''}>Quitar</button></td>
      </tr>`).join('');
      add.disabled = draft.length >= 8;
    }

    function prepare() {
      if (!form.reportValidity()) return;
      stop();
      Object.assign(lab, { jobs: cloneJobs(draft), policy: policy.value, quantum: +quantum.value, cost: +cost.value });
      result = schedule(lab.jobs, lab.policy, lab.quantum, lab.cost);
      if (!lab.jobs.some(job => job.id === selectedId)) selectedId = lab.jobs[0].id;
      choices.innerHTML = result.rows.map(job => entityButton(job.id, job.order, job.id === selectedId)).join('');
      shown = 0;
      dirty = false;
      configNote.textContent = 'Configuración aplicada. El comparador usa estos mismos procesos.';
      drawPlayback();
    }

    form.onsubmit = event => { event.preventDefault(); prepare(); };
    form.addEventListener('input', event => {
      const input = event.target;
      if (input.dataset.key) {
        const job = draft[Number(input.dataset.i)];
        job[input.dataset.key] = input.valueAsNumber;
        selectedId = job.id;
      }
      markDirty();
    });

    function selectFrom(event) {
      const button = event.target.closest('[data-entity]');
      if (!button) return;
      selectedId = button.dataset.entity;
      drawPlayback();
    }
    choices.onclick = selectFrom;
    rows.onclick = event => {
      const button = event.target.closest('[data-remove]');
      if (!button) { selectFrom(event); return; }
      if (draft.length <= 1) return;
      const [removed] = draft.splice(Number(button.dataset.remove), 1);
      if (selectedId === removed.id) selectedId = draft[0].id;
      drawJobs();
      markDirty();
      add.focus();
    };
    add.onclick = () => {
      if (draft.length >= 8) return;
      selectedId = 'P' + lab.nextId++;
      draft.push({ id: selectedId, arrival: 3, burst: 4, priority: 3 });
      drawJobs();
      markDirty();
      rows.lastElementChild.querySelector('input').focus();
    };
    useChoice(form, '[data-preset]', 'preset', preset => {
      draft = cloneJobs(preset === 'idle' ? idleJobs : baseJobs);
      selectedId = draft[1].id;
      policy.value = preset === 'rr' ? 'rr' : 'fcfs';
      quantum.value = 2;
      cost.value = 0;
      lab.nextId = 4;
      drawJobs();
      prepare();
    });

    function advance() {
      if (shown < result.segments.length) shown++;
      drawPlayback();
    }
    next.onclick = advance;
    finish.onclick = () => { shown = result.segments.length; drawPlayback(); };
    rewind.onclick = () => { stop(); shown = 0; drawPlayback(); };
    play.onclick = () => {
      if (clock !== null) { stop(); return; }
      play.textContent = 'Pausar';
      clock = setInterval(advance, 600);
      advance();
    };
    drawJobs();
    prepare();
    return stop;
  }

  function mountCompare(root) {
    let jobs = cloneJobs(baseJobs);
    let quantum = 2;
    let cost = 0;
    let displayedMetric = 'response';
    let selectedId = 'P2';
    const left = pick(root, '[data-compare-a]');
    const right = pick(root, '[data-compare-b]');
    const processChoices = pick(root, '[data-compare-jobs]');
    left.value = 'fcfs';
    right.value = 'rr';
    const labels = { wait: 'Espera total', response: 'Tiempo hasta empezar', turn: 'Tiempo hasta terminar' };
    const averages = { wait: 'Espera media', response: 'Tiempo medio hasta empezar', turn: 'Tiempo medio hasta terminar' };

    function drawChoices() {
      processChoices.innerHTML = jobs.map((job, i) => entityButton(job.id, i, job.id === selectedId)).join('');
    }

    function draw() {
      const choices = [left.value, right.value];
      const pair = choices.map(policy => schedule(jobs, policy, quantum, cost));
      const end = Math.max(...pair.map(r => r.end));
      const average = selectedId === 'all';
      const values = pair.map(result => average ? result[displayedMetric] : result.rows.find(job => job.id === selectedId)[displayedMetric]);
      const max = Math.max(1, ...values);
      const workload = [jobs.length + (jobs.length === 1 ? ' proceso' : ' procesos')];
      if (choices.includes('rr')) workload.push('Round Robin: hasta ' + ms(quantum) + ' por turno');
      if (cost > 0) workload.push('Coste de cambio: ' + ms(cost));
      pick(root, '[data-compare-use]').textContent = workload.join(' · ');
      pick(root, '[data-compare-plots]').innerHTML = pair.map((r, i) => `<section>
        <div class="between"><h3>${i === 0 ? 'A' : 'B'} · ${policies[choices[i]]}</h3><span class="small">${r.switches} cambios · termina en ${ms(r.end)}</span></div>
        ${timeline(r.segments, end, { compact: true, name: policies[choices[i]], focusId: average ? null : selectedId })}
      </section>`).join('');
      const label = average ? averages[displayedMetric] : labels[displayedMetric] + ' de ' + selectedId;
      pick(root, '[data-compare-caption]').textContent = label;
      pick(root, '[data-compare-bars]').innerHTML = values.map((value, i) => `<div class="measure">
        <span>${i === 0 ? 'A' : 'B'} · ${policies[choices[i]]}</span>
        <span class="measure-track" aria-hidden="true"><i class="tone-${i === 0 ? 0 : 2}" style="--measure-width:${100 * value / max}%"></i></span>
        <strong>${ms(value)}</strong>
      </div>`).join('');
      const difference = Math.abs(values[0] - values[1]);
      const better = values[0] < values[1] ? choices[0] : choices[1];
      pick(root, '[data-compare-status]').textContent = difference < 0.00001
        ? 'El tiempo es igual en los dos diagramas.'
        : `${policies[better]} reduce ese tiempo en ${ms(difference)}.`;
      const first = policies[choices[0]];
      const second = policies[choices[1]];
      const verb = displayedMetric === 'response' ? 'tarda en empezar' : displayedMetric === 'turn' ? 'tarda en terminar' : 'espera en total';
      setTalk(root, average
        ? `El promedio es de ${ms(values[0])} con ${first} y ${ms(values[1])} con ${second}.`
        : `${selectedId} ${verb} ${ms(values[0])} con ${first} y ${ms(values[1])} con ${second}.`);
      setPressed(root, '[data-entity]', 'entity', selectedId);
      setPressed(root, '[data-compare-metric]', 'compareMetric', displayedMetric);
    }
    left.onchange = right.onchange = draw;
    processChoices.onclick = event => {
      const button = event.target.closest('[data-entity]');
      if (!button) return;
      selectedId = button.dataset.entity;
      draw();
    };
    useChoice(root, '[data-compare-metric]', 'compareMetric', key => { displayedMetric = key; draw(); });
    pick(root, '[data-compare-average]').onclick = () => { selectedId = 'all'; draw(); };
    function useWorkload(source, newQuantum, newCost) {
      jobs = cloneJobs(source);
      quantum = newQuantum;
      cost = newCost;
      selectedId = jobs[1]?.id ?? jobs[0].id;
      displayedMetric = 'response';
      drawChoices();
      draw();
    }
    pick(root, '[data-compare-sample]').onclick = () => {
      left.value = 'fcfs';
      right.value = 'rr';
      useWorkload(baseJobs, 2, 0);
    };
    pick(root, '[data-compare-lab]').onclick = () => useWorkload(lab.jobs, lab.quantum, lab.cost);
    drawChoices();
    draw();
  }

  return { labConfig, labPlayback, policyOptions, mountLab, mountCompare };
})();

'use strict';

const cpuDemos = (() => {
  const { baseJobs, reversedJobs, policies, schedule } = scheduling;
  const { pick, fmt, ms, chip, metric, entityButton, describe, timeline, workSegments, setPressed, useChoice, stepStory } = ui;

  function mountDispatch(root) {
    const tokens = value => value.startsWith('P')
      ? value.split(' → ').map(id => chip(id, id === 'P1' ? 0 : 1)).join(' ')
      : value;
    function choose(first) {
      const other = first === 'P1' ? 'P2' : 'P1';
      setPressed(root, '[data-first]', 'first', first);
      const events = [
        { ready: first + ' → ' + other, cpu: 'Libre', waiting: 'Ninguno', action: 'Asignar CPU', why: `${first} está primero en la cola.`, talk: 'Los procesos preparados ya tienen trabajo y solo esperan un turno.' },
        { ready: other, cpu: first, waiting: 'Ninguno', action: 'Pedir lectura', why: `${first} toma la CPU. ${other} queda preparado.`, talk: `${first} recibe el turno porque está primero. ${other} espera en la cola.` },
        { ready: 'Vacía', cpu: other, waiting: first, action: 'Completar lectura', why: `${first} queda bloqueado. ${other} toma la CPU.`, talk: `${first} está bloqueado porque espera los datos del archivo. Mientras tanto, ${other} usa el procesador.` },
        { ready: first, cpu: other, waiting: 'Ninguno', action: 'Ceder CPU', why: `Llegaron los datos de ${first}.`, talk: `Ya llegaron los datos. ${first} vuelve a la lista de preparados y puede trabajar cuando reciba otro turno.` },
        { ready: 'Vacía', cpu: first, waiting: 'Ninguno', why: `${other} cede la CPU.`, talk: `${other} deja libre el procesador. ${first} lo recibe y continúa desde donde se detuvo.` }
      ];
      stepStory(root, events, event => `<div class="stack">
        <div class="flow" aria-label="Estados de los procesos">
          <div class="flow-cell ${event.ready === 'Vacía' ? '' : 'active'}"><strong>Preparados</strong><div class="strip">${tokens(event.ready)}</div></div>
          <div class="flow-cell ${event.cpu === 'Libre' ? '' : 'active'}"><strong>En CPU</strong><div class="strip">${tokens(event.cpu)}</div></div>
          <div class="flow-cell ${event.waiting === 'Ninguno' ? '' : 'active'}"><strong>Bloqueados por E/S</strong><div class="strip">${tokens(event.waiting)}</div></div>
        </div>
        <p class="status">${event.why}</p>
      </div>`, event => event.talk);
    }
    useChoice(root, '[data-first]', 'first', choose);
    choose('P1');
  }

  function mountPreemption(root) {
    const jobs = [
      { id: 'P1', arrival: 0, burst: 6, priority: 2 },
      { id: 'P2', arrival: 2, burst: 2, priority: 1 }
    ];
    function draw(choice) {
      const result = schedule(jobs, choice);
      setPressed(root, '[data-policy]', 'policy', choice);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, result.end, { name: 'Ejecución de P1 y P2' });
      pick(root, '[data-stats]').innerHTML = metric(ms(result.rows[1].first), 'Empieza P2')
        + metric(ms(result.rows[1].response), 'Respuesta de P2');
      describe(root, choice === 'srtf'
        ? 'En t = 2, P2 toma la CPU. A P1 le faltan 4 ms. P2 necesita 2 ms.'
        : 'En t = 2, P2 entra a la cola. Empieza en t = 6, cuando P1 libera la CPU.',
        choice === 'srtf'
          ? 'P2 necesita 2 ms y a P1 le quedan 4 ms. La regla permite interrumpir a P1 y darle el turno a P2.'
          : 'P2 llega en el instante 2 y empieza en el 6. Espera 4 ms mientras termina P1.');
    }
    useChoice(root, '[data-policy]', 'policy', draw);
    draw('fcfs');
  }

  function mountMetrics(root) {
    const result = schedule(baseJobs, 'fcfs');
    let selectedId = 'P2';
    let displayedMetric = 'wait';
    const definitions = {
      wait: ['Espera', 'first', 'Tiempo acumulado en la cola de preparados. En FCFS este proceso solo espera antes de su primer turno.'],
      response: ['Respuesta', 'first', 'Tiempo desde la llegada hasta el primer uso de CPU.'],
      turn: ['Retorno', 'finish', 'Tiempo desde la llegada hasta que termina el proceso.']
    };
    function draw() {
      const job = result.rows.find(item => item.id === selectedId);
      const [label, endKey, explanation] = definitions[displayedMetric];
      const value = job[displayedMetric];
      setPressed(root, '[data-entity]', 'entity', selectedId);
      setPressed(root, '[data-metric]', 'metric', displayedMetric);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, result.end, { name: 'Ejecución con FCFS', focusId: selectedId });
      pick(root, '[data-job-times]').innerHTML = metric(ms(job.arrival), 'Llega ' + job.id)
        + metric(ms(job.first), 'Empieza ' + job.id) + metric(ms(job.finish), 'Termina ' + job.id);
      pick(root, '[data-value]').innerHTML = metric(`${job[endKey]} − ${job.arrival} = ${ms(value)}`, label + ' de ' + job.id);
      const interval = endKey === 'finish' ? 'termina' : 'empieza';
      const measure = displayedMetric === 'turn' ? 'el retorno' : 'la ' + label.toLowerCase();
      describe(root, explanation, `${job.id} llega en ${job.arrival} y ${interval} en ${job[endKey]}. La diferencia da ${measure}: ${ms(value)}.`);
    }
    pick(root, '[data-metric-jobs]').innerHTML = result.rows.map(job => entityButton(job.id, job.order, job.id === selectedId)).join('');
    useChoice(root, '[data-entity]', 'entity', id => { selectedId = id; draw(); });
    useChoice(root, '[data-metric]', 'metric', key => { displayedMetric = key; draw(); });
    draw();
  }

  function mountConvoy(root) {
    function draw(order) {
      const result = schedule(order === 'first' ? baseJobs : reversedJobs, 'fcfs');
      setPressed(root, '[data-order]', 'order', order);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, result.end, { name: 'FCFS y orden de llegada' });
      pick(root, '[data-stats]').innerHTML = metric(ms(result.wait), 'Espera media')
        + metric(ms(result.end), 'Tiempo total')
        + metric(ms(result.rows[2].wait), 'Espera de P3');
      describe(root, order === 'first'
        ? 'P3 llega en el milisegundo 2 y empieza en el 12. P1 y P2 llegaron antes.'
        : 'P2 y P3 llegan antes que P1. El nuevo orden les permite terminar antes.',
        order === 'first'
          ? `P3 pasa ${fmt(result.rows[2].wait)} milisegundos en la cola. Tiene que esperar a que P1 y P2 terminen su trabajo.`
          : `Ahora P3 espera ${fmt(result.rows[2].wait)} milisegundos. Llegó antes que P1, así que recibe su turno en cuanto termina P2.`);
    }
    useChoice(root, '[data-order]', 'order', draw);
    draw('first');
  }

  function mountShort(root) {
    function draw(mode) {
      const result = schedule(baseJobs, mode);
      const during = result.segments.findIndex(seg => seg.start <= 2 && seg.end > 2);
      setPressed(root, '[data-policy]', 'policy', mode);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, result.end, { active: during, name: policies[mode] });
      pick(root, '[data-stats]').innerHTML = metric(result.segments[during].label, 'CPU en t = 2')
        + metric(ms(result.rows[2].first), 'Empieza P3')
        + metric(ms(result.wait), 'Espera media');
      describe(root, mode === 'sjf'
        ? 'P1 sigue hasta t = 8. En ese momento, elige P3, cuya ráfaga es de 2 ms.'
        : 'P2 tomó la CPU en t = 1. En t = 2 le quedan 3 ms, así que la llegada de P3, que necesita 2 ms, lo interrumpe.',
        mode === 'sjf'
          ? 'P1 conserva la CPU hasta terminar. SJF elige el trabajo más corto cuando el núcleo queda libre.'
          : 'P3 empieza en el instante 2. Necesita 2 ms y a P2 le quedan 3 ms, por eso SRTF elige P3.');
    }
    useChoice(root, '[data-policy]', 'policy', draw);
    draw('sjf');
  }

  function mountRR(root) {
    const input = pick(root, '[data-quantum]');
    function draw(value) {
      input.value = value;
      setPressed(root, '[data-set-q]', 'setQ', value);
      const quantum = Number(value);
      const result = schedule(baseJobs, 'rr', quantum);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, result.end, { name: 'Turnos de Round Robin' });
      pick(root, '[data-stats]').innerHTML = metric(ms(result.response), 'Tiempo medio hasta empezar')
        + metric(result.switches, 'Cambios de proceso');
      describe(root, quantum >= 8
        ? 'Los tres procesos terminan en el primer turno que reciben.'
        : 'P1 usa su primer turno y vuelve al final de la cola.',
        quantum >= 8 ? 'El turno alcanza para que cada proceso termine su trabajo, así que usan la CPU en su orden de llegada.'
          : `P1 necesita 8 milisegundos de CPU. Tras su turno de ${quantum} ms, vuelve al final de la cola con ${8 - quantum} ms de trabajo pendiente.`);
    }
    useChoice(root, '[data-set-q]', 'setQ', draw);
    input.onchange = () => draw(input.value);
    draw(2);
  }

  function mountAging(root) {
    let aging = false;
    let turns = [];
    let wait = 0;
    let executed = false;
    const step = pick(root, '[data-aging-step]');
    const auto = pick(root, '[data-aging-five]');
    const initialPriority = 5;
    function draw() {
      const effective = aging ? Math.max(1, initialPriority - wait) : initialPriority;
      setPressed(root, '[data-aging]', 'aging', aging ? 'on' : 'off');
      const trace = turns.map((id, i) => chip(`${i + 1}. ${id}`, id === 'P-baja' ? 2 : 0)).join('');
      pick(root, '[data-demo]').innerHTML = `<div class="strip">${trace || '<span class="small">Todavía no se asigna ningún turno.</span>'}</div>`;
      pick(root, '[data-stats]').innerHTML = metric(wait, 'Turnos que esperó P-baja')
        + metric(effective, 'Prioridad efectiva de P-baja')
        + metric(executed ? 'Sí' : 'Aún no', 'P-baja recibió CPU');
      describe(root, executed
        ? 'P-baja alcanzó prioridad 1. Gana el empate por llevar más tiempo esperando.'
        : 'Cada turno llega una tarea nueva de prioridad 1. El número menor representa mayor prioridad.',
        executed ? `P-baja consigue CPU después de ${wait} turnos. Alcanzó la prioridad 1 y gana el empate por haber llegado antes.`
          : `P-baja lleva ${wait} turnos esperando. ${aging ? 'Su prioridad mejora con la espera.' : 'Las tareas de prioridad 1 pasan primero.'}`);
      step.disabled = auto.disabled = executed || turns.length >= 10;
    }
    function turn() {
      if (executed || turns.length >= 10) return;
      executed = aging && initialPriority - wait <= 1;
      turns.push(executed ? 'P-baja' : 'P-alta');
      if (!executed) wait++;
    }
    function reset() {
      turns = [];
      wait = 0;
      executed = false;
      draw();
    }
    useChoice(root, '[data-aging]', 'aging', mode => { aging = mode === 'on'; reset(); });
    step.onclick = () => { turn(); draw(); };
    auto.onclick = () => { for (let i = 0; i < 5; i++) turn(); draw(); };
    pick(root, '[data-reset]').onclick = reset;
    draw();
  }

  function mountQueues(root) {
    function draw(mode) {
      const strict = mode === 'strict';
      const jobs = Array.from({ length: 8 }, (_, i) => strict || (i + 1) % 4 !== 0 ? 'P1' : 'P2');
      const segments = workSegments(jobs).map(s => ({
        ...s, label: s.id === 'P1' ? 'Alta' : 'Fondo'
      }));
      setPressed(root, '[data-queues]', 'queues', mode);
      pick(root, '[data-demo]').innerHTML = timeline(segments, 8, { units: 'turnos', name: 'Turnos asignados por cola' });
      pick(root, '[data-stats]').innerHTML = metric(strict ? 8 : 6, 'Turnos de la cola alta')
        + metric(strict ? 0 : 2, 'Turnos de la cola de fondo');
      describe(root, strict
        ? 'La cola alta siempre tiene trabajo y ocupa los ocho turnos.'
        : 'De los ocho turnos, seis son para la cola alta y dos para la cola de fondo.',
        strict ? 'La cola alta siempre tiene trabajo. La cola de fondo se queda esperando.'
          : 'La cola de fondo recibe uno de cada cuatro turnos. Las dos colas avanzan.');
    }
    useChoice(root, '[data-queues]', 'queues', draw);
    draw('strict');
  }

  function mountDeadlines(root) {
    const jobs = [
      { id: 'P1', arrival: 0, burst: 4, priority: 2, deadline: 7 },
      { id: 'P2', arrival: 0, burst: 2, priority: 1, deadline: 3 }
    ];
    function draw(mode) {
      const result = schedule(jobs, mode === 'deadline' ? 'priority' : 'fcfs');
      const rows = result.rows.map(job => {
        const met = job.finish <= job.deadline;
        return `<tr ${met ? '' : 'class="focus-row"'}><td>${job.id}</td><td>${ms(job.burst)}</td>
          <td>${ms(job.deadline)}</td><td>${ms(job.finish)}</td><td>${met ? 'A tiempo' : 'Fuera de plazo'}</td></tr>`;
      }).join('');
      setPressed(root, '[data-deadline]', 'deadline', mode);
      pick(root, '[data-demo]').innerHTML = timeline(result.segments, 7, { name: 'Ejecución con plazos' });
      pick(root, '[data-rows]').innerHTML = rows;
      describe(root, mode === 'deadline'
        ? 'P2 termina en t = 2 y P1 en t = 6. Los dos terminan antes de su plazo.'
        : 'P2 termina en el instante seis. Su plazo era el tres.',
        mode === 'deadline' ? 'P2 va primero y termina en el instante 2. Las dos tareas cumplen sus plazos.'
          : 'P2 termina en el instante 6. Su plazo era el 3, así que termina tarde.');
    }
    useChoice(root, '[data-deadline]', 'deadline', draw);
    draw('fcfs');
  }

  return { mountDispatch, mountPreemption, mountMetrics, mountConvoy, mountShort, mountRR, mountAging, mountQueues, mountDeadlines };
})();

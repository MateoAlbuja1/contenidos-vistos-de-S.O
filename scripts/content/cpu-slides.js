'use strict';

const cpuSlides = (() => {
  const { storyBoard, chip } = ui;
  const { mountDispatch, mountPreemption, mountMetrics, mountConvoy, mountShort, mountRR, mountAging, mountQueues, mountDeadlines } = cpuDemos;
  const { labConfig, labPlayback, policyOptions, mountLab, mountCompare } = schedulingLab;

  return [
    {
      id: 'cpu-inicio', topic: 'cpu', title: 'Qué es la planificación de la CPU',
      exposition: true,
      definition: true,
      intro: 'CPU significa unidad central de procesamiento, también llamada procesador. Planificar la CPU es decidir qué tarea lista puede usarla en el siguiente turno.',
      board: () => `<div class="stack">
        <div class="tri">
          <section class="box definition-card"><h2>Cola de preparados</h2><p>Lista de tareas que pueden trabajar y esperan un turno.</p></section>
          <section class="box definition-card"><h2>Planificador</h2><p>Parte del sistema operativo que elige una tarea de la lista según una regla.</p></section>
          <section class="box definition-card"><h2>CPU o procesador</h2><p>Ejecuta las instrucciones de la tarea elegida.</p></section>
        </div>
        <p class="definition-example">Los ejemplos usan un solo núcleo del procesador y un hilo por proceso. Por eso ves un solo proceso en la CPU a la vez.</p>
      </div>`
    },
    {
      id: 'cola', topic: 'cpu', title: 'De la cola a la CPU',
      exposition: true,
      intro: 'Preparado significa que el proceso está listo y espera un turno. Bloqueado significa que espera el resultado de una operación, como leer un archivo.',
      read: 'Preparado significa que el proceso espera turno. Bloqueado significa que espera una operación.',
      actions: ['Sigue el botón azul desde <strong>Asignar CPU</strong> hasta <strong>Ceder CPU</strong>.'],
      board: () => `<div class="stack">
        ${storyBoard({ showPrevious: false })}
        <p class="note"><strong>E/S</strong> significa entrada y salida de datos. En el ejemplo, el proceso recibe datos cuando termina de leer el archivo.</p>
        <details class="extra-options"><summary>Cambiar orden de llegada</summary>
          <div class="actions" role="group" aria-label="Primero en la cola">
            <button type="button" data-first="P1">P1 llega primero</button>
            <button type="button" data-first="P2">P2 llega primero</button>
          </div>
        </details>
      </div>`,
      mount: mountDispatch
    },
    {
      id: 'expropiacion', topic: 'cpu', title: '¿Cuándo se puede quitar la CPU?',
      intro: 'La expropiación permite interrumpir un proceso para dar la CPU a otro.',
      read: 'P2 llega mientras P1 está ejecutando.',
      actions: ['Cambia de <strong>Sin expropiar</strong> a <strong>Con expropiación</strong> y compara el inicio de P2.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Política de desalojo">
          <button type="button" data-policy="fcfs">Sin expropiar</button>
          <button type="button" data-policy="srtf">Con expropiación</button>
        </div>
        <p class="small">P1 llega en t = 0 y requiere 6 ms · P2 llega en t = 2 y requiere 2 ms</p>
        <div data-demo></div>
        <div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <p class="note">En el ejemplo, la decisión usa el tiempo restante. Otros planificadores pueden interrumpir por prioridad o al agotarse el turno.</p>
      </div>`,
      mount: mountPreemption
    },
    {
      id: 'metricas', topic: 'cpu', title: 'Cómo leer el tiempo de un proceso',
      intro: 'Cada bloque muestra quién usa la CPU. La escala indica cuándo empieza y cuándo termina.',
      read: 'El tiempo de respuesta va desde la llegada hasta el primer turno.',
      actions: ['Elige un proceso y cambia entre <strong>Espera</strong>, <strong>Respuesta</strong> y <strong>Retorno</strong>.'],
      board: () => `<div class="stack">
        <div class="strip"><strong>Proceso</strong><div class="actions" data-metric-jobs role="group" aria-label="Proceso que quieres observar"></div></div>
        <div data-demo></div>
        <div class="tri" data-job-times></div>
        <div class="actions" role="group" aria-label="Métrica del proceso seleccionado">
          <button type="button" data-metric="wait">Espera</button>
          <button type="button" data-metric="response">Respuesta</button>
          <button type="button" data-metric="turn">Retorno</button>
        </div>
        <div data-value></div><p class="status" data-status aria-live="polite"></p>
        <p class="note">El uso útil mide el porcentaje de tiempo dedicado a ejecutar tareas. El rendimiento mide cuántos procesos se terminan por unidad de tiempo.</p>
      </div>`,
      mount: mountMetrics
    },
    {
      id: 'fcfs', topic: 'cpu', title: 'FCFS · Orden de llegada',
      exposition: true,
      intro: 'FCFS viene de First Come, First Served. Significa que el proceso que llega primero recibe primero la CPU.',
      read: 'P1 es el proceso más largo. Su posición en la cola afecta la espera de los demás.',
      actions: ['Cambia de <strong>P1 llega primero</strong> a <strong>P1 llega al final</strong> y compara la espera de P3.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Orden de llegada">
          <button type="button" data-order="first">P1 llega primero</button>
          <button type="button" data-order="last">P1 llega al final</button>
        </div>
        <div class="strip">${chip('P1 · 8 ms', 0)}${chip('P2 · 4 ms', 1)}${chip('P3 · 2 ms', 2)}</div>
        <p class="small">Las etiquetas indican cuánto trabajo necesita cada proceso. En la línea de tiempo, los bloques muestran cuándo usa la CPU. Los tiempos están en milisegundos (ms).</p>
        <div data-demo></div><div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
      </div>`,
      mount: mountConvoy
    },
    {
      id: 'sjf-srtf', topic: 'cpu', title: 'Ráfaga más corta o menor tiempo restante',
      intro: 'SJF elige el trabajo más corto al quedar libre la CPU. SRTF compara el tiempo que le queda a cada proceso.',
      read: 'P3 llega en el instante dos.',
      actions: ['Cambia entre <strong>SJF</strong> y <strong>SRTF</strong>. Compara <strong>CPU en t = 2</strong>.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Algoritmo por duración">
          <button type="button" data-policy="sjf">SJF</button>
          <button type="button" data-policy="srtf">SRTF</button>
        </div>
        <p class="small">P1 llega en 0 ms · P2 en 1 ms · P3 en 2 ms</p>
        <div data-demo></div><div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <details><summary>Cómo se puede estimar una ráfaga</summary><p class="small">Se combina la última duración que se observó con la estimación anterior. Dar más peso al dato reciente hace que la estimación cambie con mayor rapidez.</p></details>
      </div>`,
      mount: mountShort
    },
    {
      id: 'round-robin', topic: 'cpu', title: 'Round Robin · Turnos de CPU',
      exposition: true,
      intro: 'Round Robin reparte la CPU por turnos. El quantum es el tiempo máximo de un turno. Si al agotarlo queda trabajo, el proceso vuelve al final de la cola.',
      read: 'El tiempo máximo de un turno se llama quantum.',
      actions: ['Alterna entre <strong>2 ms</strong> y <strong>8 ms</strong> y compara los bloques.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Tiempo máximo por turno">
          <strong>Tiempo por turno en milisegundos</strong><button type="button" data-set-q="2">2 ms</button><button type="button" data-set-q="8">8 ms</button>
        </div>
        <div data-demo></div><div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <details class="extra-options"><summary>Otro tiempo de turno</summary>
          <label class="field">Tiempo en milisegundos
            <select data-quantum>${Array.from({length: 12}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select>
          </label>
        </details>
      </div>`,
      mount: mountRR
    },
    {
      id: 'prioridades', topic: 'cpu', title: 'Prioridad alta, espera demasiado larga',
      intro: 'Si siempre llegan tareas con más prioridad, una tarea de prioridad baja puede quedar esperando.',
      read: 'Con envejecimiento, la prioridad mejora cada vez que la tarea espera.',
      actions: ['Pulsa <strong>Avanzar 5 turnos</strong> con cada regla y compara si P-baja obtiene CPU.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Regla de prioridad">
          <button type="button" data-aging="off">Prioridad fija</button>
          <button type="button" data-aging="on">Con envejecimiento</button>
        </div>
        <div class="box stack-sm"><h3>Secuencia de turnos</h3><div data-demo></div></div>
        <div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <div class="actions">
          <button type="button" data-aging-step>Avanzar 1 turno</button>
          <button class="primary" type="button" data-aging-five>Avanzar 5 turnos</button>
          <button type="button" data-reset>Reiniciar</button>
        </div>
      </div>`,
      mount: mountAging
    },
    {
      id: 'laboratorio', topic: 'cpu', title: 'Laboratorio de planificación',
      intro: 'El laboratorio muestra cuánto tiempo ejecuta y cuánto espera cada proceso.',
      read: 'El resultado cambia al modificar los procesos o el algoritmo.',
      actions: ['Pulsa <strong>Ejemplo Round Robin</strong> y selecciona <strong>P2</strong>.', 'Pulsa <strong>Avanzar tramo</strong> para ver qué proceso usa la CPU.'],
      board: () => `<div class="stack">
        <div class="lab-layout">${labConfig()}${labPlayback()}</div>
        <details><summary>Qué incluye este modelo</summary><p class="small">Un núcleo y una ráfaga por proceso. En un empate de duraciones o prioridades se conserva el proceso en ejecución. En Round Robin, una llegada al final del quantum entra antes que la tarea que vuelve a la cola. Se cobra el coste solo al cambiar entre dos procesos sin un intervalo libre. Durante ese coste se mantiene la decisión de despacho.</p></details>
      </div>`,
      mount: mountLab
    },
    {
      id: 'comparar', topic: 'cpu', title: 'Comparar algoritmos',
      exposition: true,
      intro: 'Un algoritmo es una regla que se aplica paso a paso. Comparamos dos reglas midiendo el tiempo desde que llega cada proceso hasta su primer turno.',
      read: 'El tiempo hasta empezar se mide desde la llegada del proceso hasta su primer turno.',
      actions: ['Elige <strong>P2</strong> o <strong>P3</strong>. Los bloques resaltados muestran sus turnos.'],
      board: () => `<div class="stack">
        <div class="strip"><strong>Proceso a comparar</strong><div class="actions" data-compare-jobs role="group" aria-label="Proceso a comparar"></div></div>
        <p class="small" data-compare-use></p>
        <div class="stack-sm" data-compare-plots></div>
        <div class="box stack-sm compare-results">
          <h3 data-compare-caption></h3>
          <div class="compare-bars" data-compare-bars></div>
        </div>
        <p class="status" data-compare-status aria-live="polite"></p>
        <details class="extra-options"><summary>Más opciones</summary>
          <div class="stack-sm">
            <div class="split">
              <label class="field">Primer algoritmo<select data-compare-a>${policyOptions}</select></label>
              <label class="field">Segundo algoritmo<select data-compare-b>${policyOptions}</select></label>
            </div>
            <div class="actions" role="group" aria-label="Tiempo que se compara">
              <button type="button" data-compare-metric="wait">Espera total</button>
              <button type="button" data-compare-metric="response">Tiempo hasta empezar</button>
              <button type="button" data-compare-metric="turn">Tiempo hasta terminar</button>
              <button type="button" data-compare-average data-entity="all">Promedio</button>
            </div>
            <div class="actions">
              <button type="button" data-compare-sample>Restablecer ejemplo</button>
              <button type="button" data-compare-lab>Usar datos del laboratorio</button>
            </div>
          </div>
        </details>
      </div>`,
      mount: mountCompare
    },
    {
      id: 'multinivel', topic: 'cpu', title: 'Una cola para cada tipo de trabajo',
      intro: 'El planificador puede separar el trabajo urgente del trabajo de fondo y repartir turnos entre las dos colas.',
      read: 'La cola de fondo también necesita turnos para avanzar.',
      actions: ['Alterna entre <strong>Prioridad estricta</strong> y <strong>Reparto 3 a 1</strong>.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Política entre colas">
          <button type="button" data-queues="strict">Prioridad estricta</button>
          <button type="button" data-queues="share">Reparto 3 a 1</button>
        </div>
        <p class="small">Ambas colas tienen trabajo disponible durante los 8 turnos.</p>
        <div data-demo></div><div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <details><summary>Qué cambia si hay realimentación</summary><p class="small">Una política puede mover tareas entre colas. Por ejemplo, una que agota su turno puede bajar y una que espera demasiado puede subir.</p></details>
      </div>`,
      mount: mountQueues
    },
    {
      id: 'plazos', topic: 'cpu', title: 'Cuando importa cumplir un plazo',
      intro: 'Una tarea cumple su plazo si termina a tiempo. La tabla muestra el plazo y el instante de fin.',
      read: 'P2 tiene el plazo más cercano.',
      actions: ['Alterna entre las dos reglas y compara <strong>Plazo</strong> con <strong>Fin</strong> para P2.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Política para cumplir plazos">
          <button type="button" data-deadline="fcfs">Por orden de llegada</button>
          <button type="button" data-deadline="deadline">Plazo más próximo primero</button>
        </div>
        <div data-demo></div>
        <div class="table-scroll"><table>
          <thead><tr><th>Proceso</th><th>Ráfaga</th><th>Plazo</th><th>Fin</th><th>Resultado</th></tr></thead>
          <tbody data-rows></tbody>
        </table></div>
        <p class="status" data-status aria-live="polite"></p>
        <p class="note">Este ejemplo ilustra el orden por plazos con dos tareas disponibles desde el inicio. Si la carga supera la capacidad de la CPU, algunos plazos pueden ser imposibles.</p>
      </div>`,
      mount: mountDeadlines
    }
  ];
})();

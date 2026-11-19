'use strict';

const threadSlides = (() => {
  const { entityButton, storyBoard } = ui;
  const { mountThreadIntro, mountThreadStates, mountThreadWork, mountThreadIO, mountThreadJoin } = threadDemos;
  const { mountProcessAnatomy, mountThreadMemory } = threadDiagrams;
  const { mountThreadModels, mountThreadSequence } = threadModels;

  return [
    {
      id: 'hilos-inicio', topic: 'threads', title: 'Qué es un hilo',
      exposition: true,
      definition: true,
      intro: 'Un hilo es una secuencia de instrucciones dentro de un proceso. Cada instrucción es un paso que realiza la computadora.',
      board: () => `<div class="stack">
        <div class="split">
          <section class="box definition-card"><h2>Proceso</h2><p>Es un programa en funcionamiento. Usa memoria para guardar sus instrucciones y datos.</p></section>
          <section class="box definition-card"><h2>Hilo</h2><p>Se encarga de seguir los pasos de una tarea. Un mismo proceso puede tener varios hilos para hacer trabajos distintos.</p></section>
        </div>
        <p class="definition-example">En un editor de texto, un hilo atiende lo que escribes y otro revisa la ortografía. Los dos usan el mismo documento.</p>
      </div>`
    },
    {
      id: 'hilos-editor', topic: 'threads', title: 'Dos hilos, un documento',
      exposition: true,
      opening: true,
      intro: 'H1 significa hilo 1 y H2, hilo 2. H1 escribe el texto y H2 revisa el mismo documento guardado en la memoria del editor.',
      read: 'La memoria del editor guarda el texto. Los dos hilos pueden usarlo porque forman parte del mismo proceso.',
      actions: ['Pulsa <strong>H1 · Escribir</strong> y luego <strong>H2 · Revisar</strong>.'],
      board: () => `<div class="stack">
        <div class="editor-viz">
          <div class="editor-window">
            <div class="editor-titlebar between"><strong>informe.txt</strong><span class="small">Documento compartido · Proceso P1</span></div>
            <ol class="editor-sheet" data-editor-lines aria-label="Texto del documento"></ol>
          </div>
          <div class="box editor-controls">
            <h3>Hilos del editor</h3>
            <button class="primary" type="button" data-editor-write>H1 · Escribir</button>
            <button type="button" data-editor-review>H2 · Revisar</button>
            <button type="button" data-editor-reset>Reiniciar documento</button>
          </div>
        </div>
        <p class="status" data-status aria-live="polite"></p>
      </div>`,
      mount: mountThreadIntro
    },
    {
      id: 'hilos-estados', topic: 'threads', title: 'Estados de un hilo',
      intro: 'Un hilo preparado espera CPU. Un hilo bloqueado espera que termine una operación, como una lectura.',
      read: 'El estado indica si el hilo puede ejecutar.',
      actions: ['Elige <strong>H2</strong> y <strong>Necesita una lectura</strong>. Pulsa <strong>Dar turno</strong> y <strong>Pedir lectura</strong>.'],
      board: () => `<div class="stack">
        <div class="between">
          <div class="actions" role="group" aria-label="Hilo observado">
            <strong>Hilo</strong>
            ${entityButton('H1', 0, true, 'data-state-thread')}
            ${entityButton('H2', 1, false, 'data-state-thread')}
          </div>
          <div class="actions" role="group" aria-label="Motivo para dejar el núcleo">
            <button type="button" data-state-mode="io">Necesita una lectura</button>
            <button type="button" data-state-mode="quantum">Se agota su turno</button>
          </div>
        </div>
        ${storyBoard()}
      </div>`,
      mount: mountThreadStates
    },
    {
      id: 'hilos', topic: 'threads', title: 'Proceso monohilo y multihilo',
      exposition: true,
      intro: 'Un proceso con un hilo es monohilo. Con dos o más hilos es multihilo. P1 y P2 son los nombres de los dos procesos del dibujo.',
      read: 'Los hilos usan las mismas instrucciones, datos y archivos del proceso. Cada hilo conserva su propia pila y sus valores de los registros.',
      actions: ['Pulsa <strong>Añadir hilo a P2</strong>. Aparecerán su pila y sus registros.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Configurar P2">
          <button class="primary" type="button" data-anatomy-add>Añadir hilo a P2</button>
          <button type="button" data-anatomy-reset>Reiniciar P2</button>
        </div>
        <div class="split">
          <p class="note"><strong>Pila.</strong> Zona de memoria para los datos temporales de un hilo.</p>
          <p class="note"><strong>Registros.</strong> Espacios pequeños del procesador que guardan valores, como el punto del programa por donde sigue el hilo.</p>
        </div>
        <div class="diagram-pair" data-process-diagram></div>
        <div class="box stack-sm inspector">
          <h3 data-anatomy-title></h3>
          <p data-status aria-live="polite"></p>
        </div>
        <details class="extra-options"><summary>Más controles</summary>
          <div class="actions">
            <button type="button" data-anatomy-remove>Quitar último hilo</button>
            <button type="button" data-anatomy-advance></button>
          </div>
        </details>
      </div>`,
      mount: mountProcessAnatomy
    },
    {
      id: 'hilos-memoria', topic: 'threads', title: 'Una pila por hilo',
      exposition: true,
      intro: 'Una pila es una zona de memoria donde un hilo guarda datos temporales, como los números de un cálculo.',
      read: 'Cada fila que dice Pila corresponde a un hilo. Debajo está la memoria que usan todos los hilos de P2.',
      actions: ['<span data-memory-cue>Pulsa <strong>Mostrar la pila nueva</strong>.</span><span data-memory-done hidden>Pulsa <strong>Siguiente</strong> para pasar de la memoria a los núcleos.</span>'],
      board: () => `<div class="memory-lab">
        <div class="memory-controls stack-sm">
          <div class="memory-moments" data-memory-moments role="group" aria-label="Cantidad de hilos y pilas"></div>
          <div class="actions">
            <button class="primary" type="button" data-memory-toggle aria-controls="thread-address-map">Mostrar la pila nueva</button>
          </div>
          <p class="status" data-status aria-live="polite"></p>
        </div>
        <div class="memory-map" id="thread-address-map" data-address-map role="group" aria-label="Mapa de direcciones de P2"></div>
      </div>`,
      mount: mountThreadMemory
    },
    {
      id: 'nucleos', topic: 'threads', title: 'Hilos y núcleos',
      exposition: true,
      intro: 'Un núcleo del procesador es una unidad que ejecuta instrucciones. En este ejemplo, cada núcleo con un hilo listo puede completar una casilla de trabajo por turno.',
      read: 'Con un solo núcleo se hace una unidad por turno. Con tres hilos y tres núcleos se pueden hacer tres.',
      actions: ['Pulsa <strong>Avanzar un turno</strong> en el caso de un núcleo.', 'Elige <strong>3 hilos · 3 núcleos</strong>, avanza un turno y compara las casillas llenas.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Casos con el mismo trabajo">
          <button type="button" data-work-case="3:1">3 hilos · 1 núcleo</button>
          <button type="button" data-work-case="3:3">3 hilos · 3 núcleos</button>
          <button class="primary" type="button" data-work-step>Avanzar un turno</button>
        </div>
        <div class="flow flow-four" data-core-map aria-label="Estado de los núcleos"></div>
        <div class="box stack-sm"><h3>Unidades de trabajo</h3><div class="workload" data-work></div></div>
        <div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
        <details class="extra-options" data-work-options><summary>Más controles</summary>
          <div class="stack-sm">
            <div class="between">
              <div class="actions">
                <button type="button" data-work-case="1:1">1 hilo · 1 núcleo</button>
                <button type="button" data-thread-add>Añadir hilo</button>
                <button type="button" data-thread-remove>Quitar hilo</button>
                <button type="button" data-work-finish>Completar trabajo</button>
                <button type="button" data-default>Restablecer escenario</button>
                <button type="button" data-reset>Reiniciar trabajo</button>
              </div>
              <label class="field">Núcleos<select data-cores>
                <option value="1">1 núcleo</option><option value="2">2 núcleos</option>
                <option value="3">3 núcleos</option><option value="4">4 núcleos</option>
              </select></label>
            </div>
            <div class="box stack-sm inspector">
              <div class="strip"><strong>Hilo a observar</strong><div class="actions" data-work-threads role="group" aria-label="Hilo a observar"></div></div>
              <div class="between">
                <span class="small" data-thread-state aria-live="polite"></span>
                <button type="button" data-thread-block></button>
              </div>
            </div>
            <p class="small">Al cambiar de caso, el trabajo vuelve a empezar. El modelo supone tareas independientes.</p>
          </div>
        </details>
      </div>`,
      mount: mountThreadWork
    },
    {
      id: 'hilos-modelos', topic: 'threads', title: 'Hilos de usuario y de núcleo',
      intro: 'Los hilos de usuario hacen el trabajo de la aplicación. Los hilos de núcleo son los que el sistema operativo puede poner a ejecutar en el procesador.',
      read: 'En N:1, varios hilos usan un hilo de núcleo. En 1:1, cada hilo tiene el suyo.',
      actions: ['Selecciona un hilo de <strong>P2</strong> y alterna entre <strong>N:1</strong> y <strong>1:1</strong>.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Modelo de hilos">
          <button type="button" data-thread-model="many">Muchos a uno (N:1)</button>
          <button type="button" data-thread-model="one">Uno a uno (1:1)</button>
        </div>
        <div class="diagram-pair" data-thread-models></div>
        <p class="status" data-status aria-live="polite"></p>
        <div class="actions"><button class="primary" type="button" data-jump="hilos-lectura">Probar una lectura bloqueante →</button></div>
      </div>`,
      mount: mountThreadModels
    },
    {
      id: 'hilos-lectura', topic: 'threads', title: 'Lectura bloqueante',
      intro: 'Una lectura es bloqueante cuando quien la pide debe esperar el resultado. Aquí H2 se detiene hasta recibir los datos del archivo.',
      read: 'La fila de estados indica si H1 puede ejecutar mientras H2 espera.',
      actions: ['Pulsa <strong>Ir al bloqueo</strong>. Cambia entre <strong>N:1</strong> y <strong>1:1</strong> para ver el estado de H1.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Modelo durante la lectura">
          <button type="button" data-read-model="many">Muchos a uno (N:1)</button>
          <button type="button" data-read-model="one">Uno a uno (1:1)</button>
        </div>
        <div class="between">
          <div class="actions">
            <button class="primary" type="button" data-sequence-next></button>
            <button type="button" data-sequence-back>Paso anterior</button>
            <button type="button" data-sequence-block>Ir al bloqueo</button>
            <button type="button" data-sequence-reset>Reiniciar</button>
          </div>
          <span class="small" data-sequence-count></span>
        </div>
        <div class="flow" data-read-states aria-live="polite"></div>
        <div class="sequence-scroll"><div class="sequence-chart" data-read-sequence aria-label="Secuencia de la lectura"></div></div>
      </div>`,
      mount: mountThreadSequence
    },
    {
      id: 'hilos-espera', topic: 'threads', title: 'Un hilo espera y otro puede avanzar',
      intro: 'A espera una lectura. B puede trabajar durante esa espera si el sistema le da un turno.',
      read: 'Las dos líneas muestran cuándo se usa el núcleo y cuándo se hace la lectura.',
      actions: ['Cambia de <strong>Un hilo</strong> a <strong>Dos hilos</strong> y compara el tiempo total.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Hilos para ejecutar A y B">
          <button type="button" data-thread-io="one">Un hilo</button>
          <button type="button" data-thread-io="two">Dos hilos</button>
          <span class="small">1 núcleo · mismas tareas A y B</span>
        </div>
        <div><h3>Uso de CPU</h3><div data-cpu></div></div>
        <div><h3>Lectura del archivo</h3><div data-io></div></div>
        <div class="grid-stats" data-stats></div>
        <p class="status" data-status aria-live="polite"></p>
      </div>`,
      mount: mountThreadIO
    },
    {
      id: 'crear-y-esperar', topic: 'threads', title: 'Crear un hilo y esperar su resultado',
      intro: 'H1 es el hilo con el que empieza el programa. Crea a H2 para otra tarea y puede detenerse a esperar hasta que H2 termine.',
      read: 'La espera termina cuando H2 finaliza.',
      actions: ['Pulsa <strong>Crear H2</strong>, <strong>Esperar a H2</strong> y <strong>Finalizar H2</strong>, en ese orden.'],
      board: () => `<div class="stack">
        <div class="flow flow-two">
          <div class="flow-cell active"><strong>H1 · Principal</strong><span data-h1></span></div>
          <div class="flow-cell"><strong>H2 · Trabajador</strong><span data-h2></span></div>
        </div>
        <pre class="inline-code"><code data-code></code></pre>
        <p class="status" data-status aria-live="polite"></p>
        <div class="actions">
          <button class="primary" type="button" data-create>Crear H2</button>
          <button type="button" data-join>Esperar a H2</button>
          <button type="button" data-finish>Finalizar H2</button>
          <button type="button" data-reset>Reiniciar</button>
        </div>
        <p class="note">En un sistema real, el planificador decide cuándo obtiene CPU cada hilo preparado. El orden de esta demo representa una ejecución posible.</p>
      </div>`,
      mount: mountThreadJoin
    }
  ];
})();

'use strict';

const otherSlides = (() => {
  const { storyBoard } = ui;
  const { mountPCB, mountMessages, mountSharedMap, mountRace, mountAPI } = otherDemos;

  return [
    {
      id: 'procesos', topic: 'processes', title: 'Qué guarda el sistema sobre un proceso',
      intro: 'El PCB, o bloque de control del proceso, es la ficha que usa el sistema operativo para recordar la información de un proceso.',
      read: 'El PCB permite identificar al proceso y reanudarlo.',
      actions: ['Pulsa <strong>Identidad</strong>, <strong>Contexto</strong> o <strong>Recursos</strong> para ver qué guarda el sistema.'],
      board: () => `<div class="stack">
        <div class="box stack">
          <h3>PCB de ejemplo</h3>
          <div class="actions" role="group" aria-label="Campo del bloque de control">
            <button type="button" data-pcb="identity">Identidad</button><button type="button" data-pcb="context">Contexto</button>
            <button type="button" data-pcb="resources">Recursos</button>
          </div>
          <strong class="mono" data-field></strong>
        </div>
        <p class="status" data-status aria-live="polite"></p>
      </div>`,
      mount: mountPCB
    },
    {
      id: 'mensajes', topic: 'messages', title: 'Enviar y recibir por una cola',
      intro: 'La cola guarda los mensajes mientras esperan a ser recibidos. FIFO significa que el primer mensaje que entra es el primero que sale.',
      read: 'A envía datos y B los recibe en el mismo orden.',
      actions: ['Pulsa <strong>Enviar desde A</strong> dos veces y luego <strong>Recibir en B</strong>.'],
      board: () => `<div class="stack">
        <div class="flow">
          <div class="flow-cell"><strong>Proceso A</strong><span>Último enviado</span><strong data-last-sent></strong></div>
          <div class="flow-cell active"><strong>Cola FIFO</strong><div class="strip" data-queue></div></div>
          <div class="flow-cell"><strong>Proceso B</strong><span>Último recibido</span><strong data-last-read></strong></div>
        </div>
        <div class="actions">
          <button class="primary" type="button" data-send>Enviar desde A</button>
          <button type="button" data-receive>Recibir en B</button>
          <button type="button" data-reset>Reiniciar</button>
        </div>
        <p class="status" data-status aria-live="polite"></p>
      </div>`,
      mount: mountMessages
    },
    {
      id: 'memoria', topic: 'memory', title: 'Dos procesos, una región de memoria',
      intro: 'La memoria compartida es una zona que dos procesos pueden usar para leer y escribir los mismos datos. Mapear le da a cada proceso acceso a esa zona.',
      read: 'Cada proceso conserva su propia memoria y ambos acceden a la región del centro.',
      actions: ['Pulsa <strong>Mapear en A</strong> y <strong>Mapear en B</strong>. Luego pulsa <strong>A escribe 42</strong> y <strong>B lee</strong>.'],
      board: () => `<div class="stack">
        <div class="flow">
          <div class="flow-cell"><strong>Proceso A</strong><span>Memoria privada de A</span><span data-a></span></div>
          <div class="flow-cell active"><strong>Región compartida</strong><span data-value></span></div>
          <div class="flow-cell"><strong>Proceso B</strong><span>Memoria privada de B</span><span data-b></span><strong data-seen></strong></div>
        </div>
        <div class="actions">
          <button class="primary" type="button" data-map-a>Mapear en A</button>
          <button type="button" data-map-b>Mapear en B</button>
          <button type="button" data-write>A escribe 42</button>
          <button type="button" data-read>B lee</button>
          <button type="button" data-reset>Reiniciar</button>
        </div>
        <p class="status" data-status aria-live="polite"></p>
        <p class="note">En POSIX, <code>shm_open()</code> permite abrir una región con nombre y <code>mmap()</code> crea una vista. Si ambos procesos escriben, también necesitan coordinar el acceso.</p>
        <div class="actions"><button type="button" data-jump="sincronizacion">Ver cómo se coordina →</button></div>
      </div>`,
      mount: mountSharedMap
    },
    {
      id: 'sincronizacion', topic: 'sync', title: '¿Cómo se pierde un incremento?',
      intro: 'Dos procesos quieren sumar uno al mismo contador. Un mutex les permite hacerlo por turnos, de modo que solo uno accede al contador a la vez.',
      read: 'Un proceso lee, suma uno y guarda el resultado.',
      actions: ['Avanza hasta el final en <strong>Sin mutex</strong> y luego en <strong>Con mutex</strong>. Compara el contador.'],
      board: () => `<div class="stack">
        <div class="actions" role="group" aria-label="Protección del contador">
          <button type="button" data-race="race">Sin mutex</button>
          <button type="button" data-race="mutex">Con mutex</button>
        </div>
        ${storyBoard()}
        <p class="note">El mutex protege toda la secuencia de lectura y escritura. A y B deben usar el mismo mutex.</p>
      </div>`,
      mount: mountRace
    },
    {
      id: 'interfaz', topic: 'api', title: 'El recorrido de una petición al sistema',
      intro: 'Una API es el conjunto de funciones con las que una aplicación pide servicios al sistema. En esta demostración, la aplicación pide abrir un archivo.',
      read: 'La petición va del programa al núcleo.',
      actions: ['Usa <strong>Siguiente paso</strong> hasta el resultado y repite con <strong>Sin permiso</strong>.'],
      board: () => `<div class="stack">
        <div class="split">
          <label class="field">Interfaz<select data-env><option value="posix">POSIX</option><option value="windows">Windows API</option></select></label>
          <label class="field">Acceso al ejemplo<select data-permission><option value="allowed">Con permiso</option><option value="denied">Sin permiso</option></select></label>
        </div>
        ${storyBoard()}
        <p class="note">Recorrido simplificado para abrir un archivo existente. La demo usa un nombre y resultados de ejemplo.</p>
      </div>`,
      mount: mountAPI
    }
  ];
})();

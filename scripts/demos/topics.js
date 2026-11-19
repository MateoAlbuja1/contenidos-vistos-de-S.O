'use strict';

const otherDemos = (() => {
  const { pick, chip, metric, describe, setPressed, useChoice, stepStory } = ui;

  function mountPCB(root) {
    const data = {
      identity: ['PID 481 · Preparado', 'El PID identifica al proceso. El estado «Preparado» indica que puede recibir CPU.'],
      context: ['Próxima instrucción · Registros guardados', 'El sistema guarda la próxima instrucción y los registros. Así el proceso puede continuar donde quedó.'],
      resources: ['Espacio de direcciones · Archivos abiertos', 'El sistema registra la memoria y los archivos abiertos del proceso.']
    };
    function draw(key) {
      setPressed(root, '[data-pcb]', 'pcb', key);
      pick(root, '[data-field]').textContent = data[key][0];
      describe(root, data[key][1]);
    }
    useChoice(root, '[data-pcb]', 'pcb', draw);
    draw('identity');
  }

  function mountMessages(root) {
    let queue = [];
    let id = 0;
    let lastSent = '—';
    let lastRead = '—';
    const send = pick(root, '[data-send]');
    function draw(text, spoken) {
      pick(root, '[data-queue]').innerHTML = queue.length
        ? queue.map(message => chip(message, 0)).join('') : '<span class="small">Cola vacía</span>';
      pick(root, '[data-last-sent]').textContent = lastSent;
      pick(root, '[data-last-read]').textContent = lastRead;
      describe(root, text, spoken);
      send.disabled = queue.length === 3;
    }
    send.onclick = () => {
      if (queue.length >= 3) return;
      lastSent = 'M' + (++id);
      queue.push(lastSent);
      draw(`${lastSent} entra al final de la cola. Hay ${queue.length} de 3 espacios ocupados.`,
        `${lastSent} entra al final de la cola. Los mensajes anteriores salen primero.`);
    };
    pick(root, '[data-receive]').onclick = () => {
      if (!queue.length) {
        draw('La cola está vacía.', 'La recepción devuelve el control sin esperar porque es una operación sin bloqueo.');
        return;
      }
      lastRead = queue.shift();
      draw(`B retira ${lastRead}. Quedan ${queue.length} en cola.`,
        `B recibe ${lastRead}, el mensaje que entró primero.`);
    };
    pick(root, '[data-reset]').onclick = () => {
      queue = [];
      id = 0;
      lastSent = lastRead = '—';
      draw('Cola vacía.', 'La cola entrega primero el mensaje más antiguo.');
    };
    draw('Cola vacía.', 'La cola entrega primero el mensaje más antiguo.');
  }

  function mountSharedMap(root) {
    let mappedA = false;
    let mappedB = false;
    let value = 0;
    let seen = '—';
    const mapA = pick(root, '[data-map-a]');
    const mapB = pick(root, '[data-map-b]');
    const write = pick(root, '[data-write]');
    const read = pick(root, '[data-read]');
    function draw(text, spoken) {
      pick(root, '[data-a]').textContent = mappedA ? 'Vista de la región activa' : 'Sin vista de la región';
      pick(root, '[data-b]').textContent = mappedB ? 'Vista de la región activa' : 'Sin vista de la región';
      pick(root, '[data-value]').textContent = mappedA || mappedB ? 'Valor compartido = ' + value : 'Ningún proceso la ha mapeado';
      pick(root, '[data-seen]').textContent = 'Última lectura de B: ' + seen;
      describe(root, text, spoken);
      mapA.disabled = mappedA;
      mapB.disabled = mappedB;
      write.disabled = !mappedA;
      read.disabled = !mappedB;
    }
    mapA.onclick = () => {
      mappedA = true;
      draw('A incorpora una vista de la región.', 'A puede acceder a la región compartida.');
    };
    mapB.onclick = () => {
      mappedB = true;
      draw('B incorpora una vista de la misma región.', 'Los dos procesos conservan su memoria privada y acceden a la misma región compartida.');
    };
    write.onclick = () => {
      value = 42;
      draw('A escribió 42 en la región compartida.', 'El valor 42 queda disponible para B en la misma región.');
    };
    read.onclick = () => {
      seen = value;
      draw(`B leyó ${seen}.`, `B obtiene ${seen} porque su vista apunta a la región compartida.`);
    };
    pick(root, '[data-reset]').onclick = () => {
      mappedA = mappedB = false;
      value = 0;
      seen = '—';
      draw('Los procesos todavía no tienen una vista.', 'Cada proceso necesita acceso a la región para poder leer o escribir.');
    };
    draw('Los procesos todavía no tienen una vista.', 'Cada proceso necesita acceso a la región para poder leer o escribir.');
  }

  function mountRace(root) {
    const runs = {
      race: [
        [0, '—', '—', 'A y B quieren sumar 1 a un contador que empieza en cero.'],
        [0, '0', '—', 'A lee 0 y guarda una copia local.'],
        [0, '0', '0', 'B también lee 0, antes de que A escriba.'],
        [1, '0', '0', 'A escribe 1 a partir de su copia.'],
        [1, '0', '0', 'B escribe 1 a partir de su copia anterior. Se esperaba 2. Se perdió una actualización.']
      ],
      mutex: [
        [0, '—', '—', 'El mutex está libre. Los dos procesos siguen el mismo protocolo.'],
        [0, '0', '—', 'A toma el mutex y lee 0.'],
        [0, '0', 'Espera', 'B intenta tomar el mutex y queda esperando el acceso.'],
        [1, '0', '—', 'A escribe 1 y libera el mutex.'],
        [1, '0', '1', 'B toma el mutex y lee el valor actualizado.'],
        [2, '0', '1', 'B escribe 2 y libera el mutex. Se conservan los dos incrementos.']
      ]
    };
    function choose(mode) {
      setPressed(root, '[data-race]', 'race', mode);
      stepStory(root, runs[mode], ([value, a, b, text]) => `<div class="stack">
        <div class="tri">${metric(a, 'Copia local de A')}${metric(value, 'Contador compartido')}${metric(b, 'Copia local de B')}</div>
        <p class="status">${text}</p>
      </div>`, ([value, a, b, text], index) => {
        if (index === 0) return 'Cada proceso quiere sumar uno al contador compartido.';
        if (index < runs[mode].length - 1) return text;
        return mode === 'race'
          ? 'El contador queda en uno. A y B leyeron el mismo cero y ambos guardaron uno.'
          : 'El contador queda en dos. B espera su turno y lee el valor que dejó A.';
      });
    }
    useChoice(root, '[data-race]', 'race', choose);
    choose('race');
  }

  function mountAPI(root) {
    const environment = pick(root, '[data-env]');
    const permissions = pick(root, '[data-permission]');
    function build() {
      const windows = environment.value === 'windows';
      const allowed = permissions.value === 'allowed';
      const api = windows ? 'CreateFileW()' : 'open()';
      const steps = [
        ['Aplicación', 'informe.txt', 'El programa pide abrir informe.txt en modo de lectura.'],
        ['Función de biblioteca', api, `La aplicación llama a ${api}. La función prepara la petición según la interfaz del sistema.`],
        ['Núcleo', 'Validación', 'Una llamada al sistema transfiere el control al núcleo, que verifica la ruta y los permisos.'],
        ['Resultado', allowed ? windows ? 'Manejador válido' : 'Descriptor 3 (ejemplo)' : 'Acceso denegado',
          allowed ? 'El sistema permite abrir el archivo. La aplicación recibe un identificador que podrá usar para leer.'
            : 'El núcleo rechaza la petición por falta de permiso. La función devuelve un error.']
      ];
      stepStory(root, steps, ([, , text], index) => `<div class="stack">
        <div class="flow flow-four" aria-label="Recorrido de la solicitud">
          ${steps.map(([title, value], i) => `<div class="flow-cell ${i === index ? 'active' : ''}" ${i === index ? 'aria-current="step"' : ''}>
            <strong>${title}</strong><span>${value}</span>
          </div>`).join('')}
        </div><p class="status">${text}</p>
      </div>`, ([, , text], index) => {
        if (index === 0) return 'La aplicación solicita abrir un archivo.';
        if (index === 2) return 'El núcleo comprueba si la aplicación tiene permiso para abrir el archivo.';
        return text;
      });
    }
    environment.onchange = permissions.onchange = build;
    build();
  }

  return { mountPCB, mountMessages, mountSharedMap, mountRace, mountAPI };
})();

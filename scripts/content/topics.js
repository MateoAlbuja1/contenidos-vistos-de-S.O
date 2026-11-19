'use strict';

const topicCatalog = (() => {
  const ull = 'https://ull-esit-sistemas-operativos.github.io/ssoo-apuntes/';
  const topics = {
    threads: { name: 'Hilos', chapter: '13', path: 'procesos/hilos/' },
    cpu: { name: 'Planificación de la CPU', chapter: '10', path: 'procesos/planificacion-de-la-cpu/' },
    processes: { name: 'Procesos', chapter: '9', path: 'procesos/procesos/' },
    messages: { name: 'Paso de mensajes', chapter: '11', path: 'procesos/comunicacion-mediante-paso-de-mensajes/' },
    memory: { name: 'Memoria compartida', chapter: '12', path: 'procesos/memoria-compartida/' },
    sync: { name: 'Sincronización', chapter: '14', path: 'procesos/sincronizacion/' },
    api: { name: 'Interfaz de programación', chapter: '6', path: 'organizacion/interfaz-de-programacion-de-aplicaciones/' }
  };

  return { ull, topics };
})();

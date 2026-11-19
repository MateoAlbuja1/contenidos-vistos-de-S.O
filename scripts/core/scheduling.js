'use strict';

const scheduling = (() => {
  const baseJobs = [
    { id: 'P1', arrival: 0, burst: 8, priority: 3 },
    { id: 'P2', arrival: 1, burst: 4, priority: 1 },
    { id: 'P3', arrival: 2, burst: 2, priority: 2 }
  ];
  const reversedJobs = [
    { id: 'P1', arrival: 2, burst: 8, priority: 3 },
    { id: 'P2', arrival: 0, burst: 4, priority: 1 },
    { id: 'P3', arrival: 1, burst: 2, priority: 2 }
  ];
  const idleJobs = [
    { id: 'P1', arrival: 2, burst: 3, priority: 3 },
    { id: 'P2', arrival: 7, burst: 3, priority: 1 },
    { id: 'P3', arrival: 8, burst: 2, priority: 2 }
  ];

  const policies = {
    fcfs: 'FCFS',
    sjf: 'SJF',
    srtf: 'SRTF',
    rr: 'Round Robin',
    priority: 'Prioridad sin expropiar',
    priorityP: 'Prioridad expropiativa'
  };
  const cloneJobs = jobs => jobs.map(job => ({ ...job }));

  function schedule(workload, policy, quantum = 2, switchCost = 0) {
    const jobs = workload.map((job, order) => ({
      ...job, order, remaining: job.burst, first: null, finish: null
    }));
    const byArrival = (a, b) => a.arrival - b.arrival || a.order - b.order;
    const arrivals = [...jobs].sort(byArrival);
    const rr = policy === 'rr';
    const preemptive = policy === 'srtf' || policy === 'priorityP';
    const queue = [];
    const segments = [];
    let time = 0;
    let arrivalIndex = 0;
    let finished = 0;
    let sliceLeft = 0;
    let running = null;
    let previous = null;
    let sliceNumber = 0;
    let switches = 0;

    function enqueueArrivals() {
      while (arrivalIndex < arrivals.length && arrivals[arrivalIndex].arrival <= time) {
        queue.push(arrivals[arrivalIndex++]);
      }
    }

    function append(kind, start, end, job = null) {
      const last = segments.at(-1);
      const id = job?.id ?? null;
      const label = job ? job.id : kind === 'idle' ? 'Libre' : 'Cambio';
      if (last?.kind === kind && last.id === id && last.slice === sliceNumber && last.end === start) {
        last.end = end;
      } else {
        segments.push({ kind, id, start, end, label, tone: job?.order ?? 0, slice: sliceNumber });
      }
    }

    function prefer(a, b) {
      let difference = 0;
      if (policy === 'sjf') difference = a.burst - b.burst;
      if (policy === 'srtf') difference = a.remaining - b.remaining;
      if (policy === 'priority' || policy === 'priorityP') difference = a.priority - b.priority;
      if (difference !== 0) return difference;
      if (a === running) return -1;
      if (b === running) return 1;
      return byArrival(a, b);
    }

    while (finished < jobs.length) {
      let candidate = running;
      if (rr) {
        enqueueArrivals();
        if (running && sliceLeft === 0) {
          queue.push(running);
          running = null;
        }
        candidate = running ?? queue.shift();
      } else if (!running || preemptive) {
        const ready = jobs.filter(job => job.arrival <= time && job.remaining > 0);
        candidate = ready.sort(prefer)[0];
      }

      if (!candidate) {
        const nextArrival = jobs.find(job => job.arrival > time);
        const resume = nextArrival ? Math.min(...jobs.filter(job => job.arrival > time).map(job => job.arrival)) : time;
        if (resume <= time) throw new Error('La planificación no pudo avanzar.');
        append('idle', time, resume);
        time = resume;
        previous = running = null;
        continue;
      }

      if (candidate !== running) {
        sliceNumber++;
        sliceLeft = quantum;
      }
      if (previous && previous !== candidate) {
        switches++;
        if (switchCost) {
          append('switch', time, time + switchCost);
          time += switchCost;
        }
      }

      running = candidate;
      previous = candidate;
      running.first ??= time;
      append('work', time, time + 1, running);
      time++;
      sliceLeft--;
      running.remaining--;
      if (running.remaining === 0) {
        running.finish = time;
        running = null;
        finished++;
      }
    }

    const rows = jobs.map(job => ({
      ...job,
      turn: job.finish - job.arrival,
      wait: job.finish - job.arrival - job.burst,
      response: job.first - job.arrival
    }));
    const avg = key => rows.reduce((sum, job) => sum + job[key], 0) / rows.length;
    const busy = jobs.reduce((sum, job) => sum + job.burst, 0);
    return {
      end: time, segments, rows, switches,
      wait: avg('wait'), turn: avg('turn'), response: avg('response'),
      utilization: 100 * busy / time, throughput: rows.length / time
    };
  }

  return { baseJobs, reversedJobs, idleJobs, policies, cloneJobs, schedule };
})();

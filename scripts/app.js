'use strict';

(() => {
  const { pick, setPressed } = ui;
  const { ull, topics } = topicCatalog;
  const { lessonVocabulary, termsBySlide } = glossary;

  const deck = [...threadSlides, ...cpuSlides, ...otherSlides];

  const stage = document.getElementById('slide');
  const dialog = document.getElementById('index');
  const termsDialog = document.getElementById('slide-terms');
  const indexTopics = document.getElementById('index-topics');
  const indexSlides = document.getElementById('index-slides');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const guideToggle = document.getElementById('toggle-script');
  const topicOrder = Object.keys(topics);
  const exhibitionTopics = topicOrder.slice(0, 2);
  const guided = deck.filter(slide => slide.exposition);
  const fragmentPrefix = '#diapo-';
  const requested = deck.find(slide => fragmentPrefix + slide.id === location.hash);
  let current = requested ?? deck[0];
  let dispose = null;

  function topicTitle(id) {
    const number = topicOrder.indexOf(id) + 1;
    return 'Tema ' + String(number).padStart(2, '0') + ' · ' + topics[id].name;
  }

  function slidePath(slide) {
    return slide.exposition ? guided : deck.filter(item => item.topic === slide.topic && !item.exposition);
  }

  function updateNavigation() {
    const path = slidePath(current);
    const index = path.indexOf(current);
    const displayCount = value => String(value).padStart(2, '0');
    document.getElementById('position').textContent = displayCount(index + 1) + ' / ' + displayCount(path.length);
    document.getElementById('route-name').textContent = topicTitle(current.topic);
    document.getElementById('progress').style.setProperty('--progress', (index + 1) / path.length * 100 + '%');
    previous.disabled = index <= 0;
    next.disabled = index >= path.length - 1;
    previous.title = index > 0 ? path[index - 1].title : 'Inicio del recorrido';
    next.title = index < path.length - 1 ? path[index + 1].title : 'Fin del recorrido';
  }

  function showSlide(slide, moveFocus = true) {
    if (dispose) dispose();
    current = slide;
    const topic = topics[slide.topic];
    const source = topic ? `<p class="slide-source">Fuente del tema · <a href="${ull + topic.path}"
      target="_blank" rel="noopener noreferrer">Capítulo ${topic.chapter} de los apuntes de la ULL ↗</a></p>` : '';
    const instructions = slide.actions?.length ? `<section class="lesson-support lesson-choice" id="lesson-choice" aria-labelledby="lesson-choice-title">
      <h2 id="lesson-choice-title">Qué elegir</h2>
      ${slide.actions.length === 1 ? `<p>${slide.actions[0]}</p>` : `<ol>${slide.actions.map(action => `<li>${action}</li>`).join('')}</ol>`}
    </section>` : '';
    const explanation = slide.read ? `<section class="lesson-support lesson-explanation" id="lesson-explanation" aria-label="Explicación de la demostración">
      <p data-say>${slide.read}</p>
    </section>` : '';
    const termButton = termsBySlide[slide.id]
      ? '<button class="terms-button" type="button" data-open-terms aria-haspopup="dialog" aria-controls="slide-terms">Términos</button>'
      : '';
    stage.innerHTML = `<article class="slide-surface slide-enter ${slide.definition ? 'definition-slide' : ''}" aria-labelledby="slide-title">
      <header class="slide-head">
        <div class="between">
          <div class="label">${topicTitle(slide.topic)}</div>
          ${termButton}
        </div>
        <h1 id="slide-title" tabindex="-1">${slide.title}</h1>
        <p>${slide.intro}</p>
      </header>
      ${instructions}
      ${slide.exposition ? explanation : ''}
      <section class="panel ${slide.opening ? 'opening' : ''}" aria-label="${slide.definition ? 'Definición' : 'Demostración'}">${slide.board()}</section>
      ${slide.exposition ? '' : explanation}
      ${source}
    </article>`;
    guideToggle.hidden = !instructions && !explanation;
    dispose = slide.mount?.(stage) ?? null;
    updateNavigation();
    try {
      history.replaceState(null, '', fragmentPrefix + slide.id);
    } catch {
      // The presentation also works in viewers that disallow changing the address.
    }
    if (moveFocus) pick(stage, '#slide-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function changeBy(delta) {
    const path = slidePath(current);
    const target = path[path.indexOf(current) + delta];
    if (target) showSlide(target);
  }

  function chooseIndexTopic(id) {
    const slides = deck.filter(slide => slide.topic === id);
    const lesson = slides.filter(slide => slide.exposition);
    const additional = lesson.length ? slides.filter(slide => !slide.exposition) : [];
    const links = entries => `<div class="index-links">${entries.map(slide => `<button type="button"
      class="${slide.definition ? 'primary' : ''}" data-jump="${slide.id}"
      ${current === slide ? 'aria-current="page"' : ''}>${slide.title}</button>`).join('')}</div>`;
    setPressed(indexTopics, '[data-topic]', 'topic', id);
    indexSlides.innerHTML = `<h3 id="index-topic-title">${topicTitle(id)}</h3>
      ${links(lesson.length ? lesson : slides)}
      ${additional.length ? `<details class="extra-options" ${additional.includes(current) ? 'open' : ''}>
        <summary>Más demostraciones</summary>${links(additional)}
      </details>` : ''}`;
  }

  function openIndex() {
    chooseIndexTopic(current.topic);
    if (dialog.open) return;
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  function jump(id) {
    const slide = deck.find(item => item.id === id);
    if (!slide) return;
    if (dialog.open) dialog.close();
    showSlide(slide);
  }

  function openTerms() {
    document.getElementById('terms-slide-title').textContent = current.title;
    document.getElementById('terms-list').innerHTML = termsBySlide[current.id].map(key => {
      const [term, definition] = lessonVocabulary[key];
      return `<div><dt>${term}</dt><dd>${definition}</dd></div>`;
    }).join('');
    termsDialog.showModal();
    termsDialog.scrollTop = 0;
  }

  stage.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.hasAttribute('data-open-terms')) openTerms();
    else if (button?.dataset.jump) jump(button.dataset.jump);
  });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.topic) {
      chooseIndexTopic(button.dataset.topic);
    } else if (button.dataset.jump) {
      jump(button.dataset.jump);
    }
  });
  const indexButton = document.getElementById('open-index');
  indexButton.textContent = `Temario · ${topicOrder.length}`;
  indexButton.onclick = openIndex;
  document.getElementById('index-title').textContent = `Temario · ${topicOrder.length} temas`;
  indexTopics.innerHTML = topicOrder.map((id, i) => `<button type="button" class="index-topic" data-topic="${id}" aria-controls="index-slides">
    <span class="index-number">${String(i + 1).padStart(2, '0')}</span>
    <span>${topics[id].name}</span>
    ${exhibitionTopics.includes(id) ? '<span class="index-tag">Exposición</span>' : ''}
  </button>`).join('');
  guideToggle.onclick = event => {
    const hidden = document.body.classList.toggle('script-hidden');
    event.currentTarget.setAttribute('aria-pressed', String(!hidden));
  };
  previous.onclick = () => changeBy(-1);
  next.onclick = () => changeBy(1);

  const fullscreen = document.getElementById('fullscreen');
  fullscreen.hidden = !document.fullscreenEnabled;
  async function toggleFullscreen() {
    if (!document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      fullscreen.removeAttribute('title');
    } catch {
      fullscreen.title = 'Puedes usar F11 para mostrar el navegador en pantalla completa.';
    }
  }
  fullscreen.onclick = toggleFullscreen;
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
  });
  document.addEventListener('keydown', event => {
    if (dialog.open || termsDialog.open || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
    const key = event.key;
    if (key === 'ArrowRight' || key === 'PageDown' || (key === ' ' && !event.target.closest('button, a, summary'))) {
      event.preventDefault();
      changeBy(1);
    } else if (key === 'ArrowLeft' || key === 'PageUp') {
      event.preventDefault();
      changeBy(-1);
    } else if (key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  });
  showSlide(current, false);
})();

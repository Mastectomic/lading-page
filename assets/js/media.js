(function () {
  const listEl = document.getElementById('media-posts-list');
  const emptyEl = document.getElementById('media-posts-empty');
  if (!listEl) return;

  const lang = document.documentElement.lang === 'en' ? 'en' : 'pl';
  const dataPath = listEl.getAttribute('data-media-src') || 'assets/data/media-posts.json';

  const labels = {
    pl: {
      readMore: 'Czytaj artykuł',
      empty: 'Brak wpisów. Dodaj artykuły w pliku assets/data/media-posts.json (sekcja „pl”).',
      error: 'Nie udało się wczytać listy artykułów. Sprawdź plik media-posts.json.'
    },
    en: {
      readMore: 'Read article',
      empty: 'No entries yet. Add articles in assets/data/media-posts.json (section “en”).',
      error: 'Could not load the article list. Check media-posts.json.'
    }
  };

  const t = labels[lang];

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function resolveAsset(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = (listEl.getAttribute('data-assets-base') || 'assets/').replace(/\/?$/, '/');
    if (path.startsWith('assets/')) {
      return base + path.slice(7);
    }
    return base + path.replace(/^\//, '');
  }

  function renderPost(post) {
    const imageSrc = resolveAsset(post.image);
    const imageAlt = post.imageAlt || post.title || '';
    const thumbnail = imageSrc
      ? `<img src="${escapeHtml(imageSrc)}" class="card-img-top" alt="${escapeHtml(imageAlt)}" width="400" height="225" style="aspect-ratio: 16 / 9; object-fit: cover;">`
      : '';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.innerHTML = `
      <article class="card h-100 border-0 shadow-sm card-hover-primary overflow-hidden">
        ${thumbnail}
        <div class="card-body pb-0 position-relative">
          <div class="d-flex align-items-center justify-content-between mb-3">
            ${post.source ? `<span class="badge bg-secondary fs-sm position-relative zindex-2">${escapeHtml(post.source)}</span>` : '<span></span>'}
            ${post.date ? `<span class="fs-sm text-muted position-relative zindex-2">${escapeHtml(formatDate(post.date))}</span>` : ''}
          </div>
          <h2 class="h5 mb-2">
            <a href="${escapeHtml(post.url)}" class="stretched-link text-decoration-none" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(post.title)}
            </a>
          </h2>
          ${post.excerpt ? `<p class="text-muted mb-0">${escapeHtml(post.excerpt)}</p>` : ''}
        </div>
        <div class="card-footer border-0 bg-transparent pt-3 pb-4 position-relative">
          <span class="btn btn-link px-0 text-primary">
            ${escapeHtml(t.readMore)}
            <i class="bx bx-link-external ms-1"></i>
          </span>
        </div>
      </article>
    `;
    return col;
  }

  fetch(dataPath)
    .then(function (res) {
      if (!res.ok) throw new Error('fetch failed');
      return res.json();
    })
    .then(function (data) {
      const posts = Array.isArray(data[lang]) ? data[lang] : [];
      listEl.innerHTML = '';

      if (posts.length === 0) {
        if (emptyEl) {
          emptyEl.textContent = t.empty;
          emptyEl.classList.remove('d-none');
        }
        return;
      }

      if (emptyEl) emptyEl.classList.add('d-none');

      posts.forEach(function (post) {
        if (!post.title || !post.url) return;
        listEl.appendChild(renderPost(post));
      });
    })
    .catch(function () {
      if (emptyEl) {
        emptyEl.textContent = t.error;
        emptyEl.classList.remove('d-none');
      }
    });
})();

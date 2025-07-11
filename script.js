document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(targetTab) {
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    const activeBtn = document.querySelector(`[data-tab="${targetTab}"]`);
    const activeContent = document.getElementById(`${targetTab}Tab`);

    if (activeBtn && activeContent) {
      activeBtn.classList.add('active');
      activeContent.classList.add('active');
    }
  }

  // Add event listeners to tab buttons
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Existing blog functionality for writing tab
  const container = document.getElementById('mainContainer');
  const articleContent = document.getElementById('articleContent');
  const articleListEl = document.getElementById('articleList');

  let links = [];
  let currentIndex = -1;

  // Simple Markdown to HTML converter (supports headings and paragraphs, bold, italic, links)
  function markdownToHTML(md) {
    // Escape HTML
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings # ## ###
    html = html.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');

    // Bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Paragraphs
    html = html.replace(/^(?!<h\d>)(.+)$/gm, '<p>$1</p>');

    return html;
  }

  function closeArticle() {
    articleContent.innerHTML = '';
    container.classList.remove('open');
    links.forEach(l => l.classList.remove('active'));
    currentIndex = -1;
  }

  function openArticleByIndex(index) {
    if (index < 0 || index >= links.length) return;
    links[index].click();
  }

  function attachLinkHandlers() {
    links.forEach((link, idx) => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const file = link.dataset.file;
        if (!file) return;

        fetch(`posts/${file}`)
          .then(res => res.text())
          .then(md => {
            const htmlContent = markdownToHTML(md);

            // Extract the first heading for the top-level title
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const firstHeading = tempDiv.querySelector('h2, h3, h4');
            const articleTitle = firstHeading ? firstHeading.textContent : link.textContent;

            // Remove the first heading from content if it exists
            if (firstHeading) {
              firstHeading.remove();
            }

            articleContent.innerHTML = `
              <div class="article-header">
                <h2 class="article-title">${articleTitle}</h2>
                <button class="close-btn" aria-label="Close article">&times;</button>
              </div>
              <div class="article-body">
                ${tempDiv.innerHTML}
              </div>
            `;

            const closeBtn = articleContent.querySelector('.close-btn');
            closeBtn.addEventListener('click', closeArticle);

            container.classList.add('open');

            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentIndex = idx;
          })
          .catch(() => {
            articleContent.innerHTML = '<p>Unable to load article.</p>';
          });
      });
    });
  }

  // Build article list from /posts directory (assumes directory listing enabled)
  function loadPostList() {
    // List of available posts (update this array when you add new posts)
    const files = [
      'why_cs_majors_cant_get_jobs.md',
      'advice_to_college_freshmen.md',
    ];

    // Build list items
    files.forEach(file => {
      const slug = file.replace(/\.md$/, '');
      const title = slug.replace(/[-_]/g, ' ');
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = title;
      a.dataset.file = file;
      li.appendChild(a);
      articleListEl.appendChild(li);
    });

    // Refresh links NodeList and attach handlers
    links = Array.from(document.querySelectorAll('.article-list a'));
    attachLinkHandlers();
  }

  loadPostList();

  // Keyboard navigation (only works when writing tab is active)
  window.addEventListener('keydown', e => {
    const writingTab = document.getElementById('writingTab');
    if (!writingTab.classList.contains('active')) {
      return; // Skip keyboard navigation if not on writing tab
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex === -1) {
          openArticleByIndex(0);
        } else {
          openArticleByIndex((currentIndex - 1 + links.length) % links.length);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex === -1) {
          openArticleByIndex(0);
        } else {
          openArticleByIndex((currentIndex + 1) % links.length);
        }
        break;
      case 'Escape':
        if (container.classList.contains('open')) {
          closeArticle();
        }
        break;
      default:
        break;
    }
  });
}); 
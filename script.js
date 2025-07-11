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

  // URL routing functions
  function getPostSlugFromFile(filename) {
    return filename.replace(/\.md$/, '').replace(/[-_]/g, '-');
  }

  function getFileFromPostSlug(slug) {
    // Convert slug back to filename
    const files = [
      'why_cs_majors_cant_get_jobs.md',
      'advice_to_college_freshmen.md',
    ];
    
    return files.find(file => getPostSlugFromFile(file) === slug);
  }

  function updateURL(filename) {
    if (filename) {
      const slug = getPostSlugFromFile(filename);
      const newHash = `#post-${slug}`;
      history.pushState(null, null, newHash);
    } else {
      // Clear hash when no post is selected
      history.pushState(null, null, window.location.pathname);
    }
  }

  function getShareableLink(filename) {
    const slug = getPostSlugFromFile(filename);
    const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
      ? 'http://127.0.0.1:5500/index.html'
      : 'https://gholtzap.github.io/journal/';
    
    return `${baseUrl}#post-${slug}`;
  }

  function parseCurrentURL() {
    const hash = window.location.hash;
    if (hash.startsWith('#post-')) {
      const slug = hash.substring(6); // Remove '#post-'
      return getFileFromPostSlug(slug);
    }
    return null;
  }

  function openArticleByFile(filename, updateUrl = true) {
    const link = links.find(l => l.dataset.file === filename);
    if (link) {
      const index = links.indexOf(link);
      openArticle(link, index, updateUrl);
    }
  }

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
    updateURL(null);
  }

  function openArticleByIndex(index) {
    if (index < 0 || index >= links.length) return;
    links[index].click();
  }

  function openArticle(link, index, updateUrl = true) {
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

        // Create share button
        const shareableLink = getShareableLink(file);
        const shareButton = `
          <button class="share-btn" onclick="copyToClipboard('${shareableLink}')" title="Copy shareable link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/>
            </svg>
          </button>
        `;

        articleContent.innerHTML = `
          <div class="article-header">
            <h2 class="article-title">${articleTitle}</h2>
            <div class="article-actions">
              ${shareButton}
              <button class="close-btn" aria-label="Close article">&times;</button>
            </div>
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
        currentIndex = index;

        if (updateUrl) {
          updateURL(file);
        }
      })
      .catch(() => {
        articleContent.innerHTML = '<p>Unable to load article.</p>';
      });
  }

  function attachLinkHandlers() {
    links.forEach((link, idx) => {
      link.addEventListener('click', e => {
        e.preventDefault();
        openArticle(link, idx);
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

    // Check URL on page load and open post if present
    const initialPostFile = parseCurrentURL();
    if (initialPostFile) {
      // Switch to writing tab if opening a post
      switchTab('writing');
      openArticleByFile(initialPostFile, false);
    }
  }

  loadPostList();

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const postFile = parseCurrentURL();
    if (postFile) {
      switchTab('writing');
      openArticleByFile(postFile, false);
    } else {
      closeArticle();
    }
  });

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

// Global function for copying shareable links
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show a temporary success message
    const button = event.target.closest('.share-btn');
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
    `;
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
} 
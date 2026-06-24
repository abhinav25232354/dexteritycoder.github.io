let allPosts = [];

function renderPosts(postsToRender) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  grid.innerHTML = postsToRender.map(post => `
        <div class="blog-card" data-blog="${post.id}">
            <div class="blog-card-media">
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="blog-content">
                <div class="meta">${post.author} · ${post.date} · ${post.readTime}</div>
                <h3>${post.title}</h3>
                <p>${post.description}</p>
                <div class="blog-footer">
                    <span class="views">0 views</span>
                    <span class="comments">0 comments</span>
                    <span class="like">❤ 0</span>
                </div>
            </div>
        </div>
    `).join('');

  // Add click listeners to blog cards
  document.querySelectorAll('.blog-card[data-blog]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const blogId = card.dataset.blog;
      window.location.href = `/Blogs/blog-detail.html?blog=${blogId}`;
    });
  });
}

function handleSearch(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  const filteredPosts = allPosts.filter(post => {
    return post.title.toLowerCase().includes(term) ||
           post.description.toLowerCase().includes(term) ||
           post.author.toLowerCase().includes(term);
  });
  
  renderPosts(filteredPosts);
}

async function initBlogList() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  try {
    // Fetch posts.json from BlogPosts directory
    const response = await fetch('/BlogPosts/posts.json');
    allPosts = await response.json();
    
    renderPosts(allPosts);
    
    // Add search listener
    const searchInput = document.getElementById('blog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }

  } catch (error) {
    console.error('Error loading blog posts:', error);
    grid.innerHTML = '<p style="color: white; text-align: center;">Error loading blog posts</p>';
  }
}

document.addEventListener('DOMContentLoaded', initBlogList);

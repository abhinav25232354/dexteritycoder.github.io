async function renderBlogGrid() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  try {
    // Fetch posts.json from BlogPosts directory
    const response = await fetch('/BlogPosts/posts.json');
    const posts = await response.json();

    grid.innerHTML = posts.map(post => `
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

  } catch (error) {
    console.error('Error loading blog posts:', error);
    grid.innerHTML = '<p style="color: white; text-align: center;">Error loading blog posts</p>';
  }
}

document.addEventListener('DOMContentLoaded', renderBlogGrid);

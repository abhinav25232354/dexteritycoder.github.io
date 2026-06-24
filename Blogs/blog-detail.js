async function initBlogDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('blog');

  if (!blogId) {
    document.getElementById('markdown-content').innerHTML = '<p>Blog not found</p>';
    return;
  }

  try {
    // First fetch posts.json to get blog metadata!
    const postsResponse = await fetch('/BlogPosts/posts.json');
    const posts = await postsResponse.json();
    const post = posts.find(p => p.id === blogId);

    if (!post) {
      document.getElementById('markdown-content').innerHTML = '<p>Blog not found</p>';
      document.getElementById('blog-hero').querySelector('h1').textContent = 'Blog Not Found';
      return;
    }

    // Set hero!
    const hero = document.getElementById('blog-hero');
    hero.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.38), rgba(18, 18, 18, 0.58)), url('${post.image}')`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
    hero.querySelector('h1').textContent = post.title;

    // Set meta!
    document.getElementById('blog-meta').textContent = `${post.author} · ${post.date} · ${post.readTime}`;

    // Now load the actual markdown file!
    const mdResponse = await fetch(`/BlogPosts/${blogId}.md`);
    const mdContent = await mdResponse.text();
    // Remove frontmatter if present!
    const contentWithoutFrontmatter = mdContent.replace(/---[\s\S]*?---/, '').trim();
    // Render markdown!
    document.getElementById('markdown-content').innerHTML = marked.parse(contentWithoutFrontmatter);

  } catch (error) {
    console.error('Error loading blog:', error);
    document.getElementById('markdown-content').innerHTML = '<p>Error loading blog</p>';
  }
}

document.addEventListener('DOMContentLoaded', initBlogDetailPage);

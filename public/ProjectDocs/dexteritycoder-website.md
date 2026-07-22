# Dexteritycoder Website Documentation

## Getting Started

This is a static HTML, CSS, and JavaScript site — no build tools or dependencies to install!

### How to Run Locally

1. Clone the repository
2. Open your terminal and navigate to the project root
3. Run a local server (we recommend Python):
   ```bash
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser!

## Structure

- `/index.html` - Home page
- `/pages/` - All other pages (blog, contact, about, donate)
- `/Blogs/` - Blog list/detail pages
- `/BlogPosts/` - Blog markdown files and metadata
- `/ProjectDocs/` - Project documentation (this directory!)
- `/images/` - Site images
- `/featuredimages/` - Featured images for projects
- `/BlogImages/` - Blog cover images

## Adding Content

### Adding a New Project
1. Update `project-viewer.js` with your project details
2. Create a new markdown file in `/ProjectDocs/`
3. Add an entry to `/ProjectDocs/projects.json`

### Adding a New Blog Post
1. Create a new markdown file in `/BlogPosts/`
2. Add an entry to `/BlogPosts/posts.json`

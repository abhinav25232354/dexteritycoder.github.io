/**
 * Production project cards — edit ProjectDocs/projects.json
 * Only `github` is required for the detail page; other fields are for the card preview.
 * `heroTitle` — optional custom title on the project detail hero (falls back to `title`, then repo name).
 * Everything runs in the browser — no server or backend.
 */
let PROJECTS = [];

// Function to load projects from ProjectDocs/projects.json
async function loadProjectsFromJson() {
  try {
    const response = await fetch("/ProjectDocs/projects.json");
    PROJECTS = await response.json();
    return PROJECTS;
  } catch (error) {
    console.error("Failed to load projects from JSON:", error);
    return [];
  }
}

const README_NAMES = ["README.md", "Readme.md", "readme.md", "README.MD"];
const BRANCH_FALLBACKS = ["main", "master"];
const GITHUB_API = "https://api.github.com";

function parseGithubUrl(url) {
  const match = String(url).match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/i, "") };
}

function repoSlug(owner, repo) {
  return `${owner}/${repo}`;
}

function findProjectBySlug(owner, repo) {
  const slug = repoSlug(owner, repo).toLowerCase();
  return PROJECTS.find((project) => {
    const parsed = parseGithubUrl(project.github);
    return parsed && repoSlug(parsed.owner, parsed.repo).toLowerCase() === slug;
  });
}

function getProjectHeroTitle(owner, repo) {
  const urlTitle = new URLSearchParams(window.location.search).get("title");
  if (urlTitle) return urlTitle;

  const project = findProjectBySlug(owner, repo);
  if (project?.heroTitle) return project.heroTitle;
  if (project?.title) return project.title;
  return repo;
}

function rawFileUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function cdnFileUrl(owner, repo, branch, path) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url}`);
  }
  return response.text();
}

async function githubApiFetch(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status})`);
  }
  return response.json();
}

function decodeBase64Content(content) {
  if (!content) return "";
  return decodeURIComponent(
    Array.from(atob(content.replace(/\n/g, "")), (char) =>
      "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2)
    ).join("")
  );
}

async function resolveBranch(owner, repo) {
  try {
    const response = await fetch(`https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}`);
    if (response.ok) {
      const data = await response.json();
      if (data.default) return data.default;
      if (Array.isArray(data.versions) && data.versions.length) {
        return data.versions[0];
      }
    }
  } catch {
    // Fall through.
  }

  try {
    const repoData = await githubApiFetch(`/repos/${owner}/${repo}`);
    if (repoData.default_branch) return repoData.default_branch;
  } catch {
    // Fall through.
  }

  for (const branch of BRANCH_FALLBACKS) {
    try {
      const response = await fetch(rawFileUrl(owner, repo, branch, "README.md"), { method: "HEAD" });
      if (response.ok) return branch;
    } catch {
      // Try next branch.
    }
  }

  return "main";
}

async function fetchReadme(owner, repo, branch) {
  for (const name of README_NAMES) {
    try {
      const markdown = await fetchText(rawFileUrl(owner, repo, branch, name));
      return { markdown, path: name };
    } catch {
      // Try the next README filename.
    }
  }

  try {
    const readme = await githubApiFetch(`/repos/${owner}/${repo}/readme`);
    return {
      markdown: decodeBase64Content(readme.content),
      path: readme.path || readme.name || "README.md",
    };
  } catch {
    // No README available.
  }

  return {
    markdown: `# ${repo}\n\nNo README found for this repository.`,
    path: null,
  };
}

async function fetchRepoFilesFromJsDelivr(owner, repo, branch) {
  const endpoints = [
    `https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}@${branch}/flat`,
    `https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}/flat`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data.files) && data.files.length) {
        return data.files.map((file) => ({
          path: String(file.name || "").replace(/^\//, ""),
          size: Number(file.size) || 0,
        }));
      }
    } catch {
      // Try the next endpoint.
    }
  }

  return null;
}

async function fetchRepoFilesFromGithub(owner, repo, branch) {
  const treeData = await githubApiFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return (treeData.tree || [])
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path,
      size: Number(item.size) || 0,
    }));
}

async function fetchRepoFiles(owner, repo, branch) {
  const fromJsDelivr = await fetchRepoFilesFromJsDelivr(owner, repo, branch);
  if (fromJsDelivr?.length) return fromJsDelivr;

  const fromGithub = await fetchRepoFilesFromGithub(owner, repo, branch);
  if (fromGithub.length) return fromGithub;

  throw new Error("Could not load repository files.");
}

function rewriteReadmeAssets(markdown, owner, repo, branch) {
  const base = rawFileUrl(owner, repo, branch, "");
  return markdown
    .replace(/!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g, (_match, alt, path) => {
      const cleanPath = path.replace(/^\.\//, "");
      return `![${alt}](${base}${cleanPath})`;
    })
    .replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, (_match, label, path) => {
      const cleanPath = path.replace(/^\.\//, "");
      return `[${label}](${base}${cleanPath})`;
    });
}

function buildTree(files) {
  const root = { name: "", path: "", type: "dir", children: new Map() };

  files
    .filter((file) => file.path)
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((file) => {
      const parts = file.path.split("/");
      let node = root;

      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join("/");
        const isLeaf = index === parts.length - 1;

        if (!node.children.has(part)) {
          node.children.set(part, {
            name: part,
            path: currentPath,
            type: isLeaf ? "file" : "dir",
            size: isLeaf ? file.size : 0,
            children: new Map(),
          });
        }

        node = node.children.get(part);
        if (isLeaf) {
          node.type = "file";
          node.size = file.size;
        }
      });
    });

  return root;
}

function repoFolderIcon() {
  return `
    <svg class="repo-tree-icon-svg repo-tree-icon-folder" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
    </svg>
  `;
}

function repoFileIcon() {
  return `
    <svg class="repo-tree-icon-svg repo-tree-icon-file" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 11.25 16h-7.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 7 4.25V1.5Zm5.75.086v2.25a.25.25 0 0 0 .25.25h2.25L6.75 1.5Z"></path>
    </svg>
  `;
}

function renderTreeNode(node, owner, repo, branch, depth = 0) {
    if (!node.children || node.children.size === 0) {
        return "";
    }

    const children = Array.from(node.children.values()).sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === "dir" ? -1 : 1;
        }
        // Reverse name order
        return b.name.localeCompare(a.name);
    });

    return children
        .map((child) => {
            const isDir = child.type === "dir";
            const icon = isDir ? repoFolderIcon() : repoFileIcon();
            const indent = depth * 14;

            if (isDir) {
                return `
                    <details class="repo-tree-folder" open>
                        <summary class="repo-tree-item repo-tree-folder-label" style="padding-left:${indent}px">
                            <span class="repo-tree-icon">${icon}</span>
                            <span>${escapeHtml(child.name)}</span>
                        </summary>
                        ${renderTreeNode(child, owner, repo, branch, depth + 1)}
                    </details>
                `;
            }

            return `
                <button
                    type="button"
                    class="repo-tree-item repo-tree-file"
                    style="padding-left:${indent + 14}px"
                    data-path="${escapeHtml(child.path)}"
                    data-size="${child.size || 0}"
                    data-owner="${owner}"
                    data-repo="${repo}"
                    data-branch="${branch}"
                >
                    <span class="repo-tree-icon">${icon}</span>
                    <span>${escapeHtml(child.name)}</span>
                </button>
            `;
        })
        .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFilePreview(path, text, owner, repo, branch) {
  const fileName = path.split("/").pop() || path;
  const lowerName = fileName.toLowerCase();

  if (/\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i.test(lowerName)) {
    const src = cdnFileUrl(owner, repo, branch, path);
    return `<div class="repo-media-preview"><img src="${src}" alt="${escapeHtml(fileName)}"></div>`;
  }

  if (/\.(md|markdown)$/i.test(lowerName)) {
    const markdown = rewriteReadmeAssets(text, owner, repo, branch);
    return `<div class="post-content repo-markdown">${marked.parse(markdown)}</div>`;
  }

  return `<pre class="repo-code-block"><code>${escapeHtml(text)}</code></pre>`;
}

async function loadRepoProject(owner, repo) {
  const branch = await resolveBranch(owner, repo);
  const { markdown: readmeMarkdown, path: readmePath } = await fetchReadme(owner, repo, branch);
  const rewrittenReadme = rewriteReadmeAssets(readmeMarkdown, owner, repo, branch);
  const files = await fetchRepoFiles(owner, repo, branch);
  const tree = buildTree(files);

  return {
    branch,
    readmeMarkdown: rewrittenReadme,
    readmePath,
    tree,
  };
}

function renderProjectCards(container, projects) {
  if (!container) return;

  container.innerHTML = projects
    .map((project) => {
      const parsed = parseGithubUrl(project.github);
      const slug = parsed ? repoSlug(parsed.owner, parsed.repo) : "";
      const detailHref = slug ? `/pages/project-detail.html?repo=${encodeURIComponent(slug)}` : "#";

      return `
        <article class="blog-card project-card" data-project="${slug}">
          <div class="blog-card-media">
            <img src="${project.image}" alt="${escapeHtml(project.title)}">
          </div>
          <div class="blog-content">
            <div class="meta">${escapeHtml(project.meta || "Open Source")}</div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
            <div class="blog-footer">
              <span class="views">View Details</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Add click listeners to project cards
  container.querySelectorAll('.blog-card').forEach((card, index) => {
    const project = projects[index];
    const parsed = parseGithubUrl(project.github);
    const slug = parsed ? repoSlug(parsed.owner, parsed.repo) : "";
    const detailHref = slug ? `/pages/project-detail.html?repo=${encodeURIComponent(slug)}` : "#";
    card.addEventListener('click', () => {
      window.location.href = detailHref;
    });
  });
}

async function loadProjectDocumentation(owner, repo) {
  try {
    // First load projects from JSON
    const projects = await loadProjectsFromJson();
    // Find project by owner/repo (same way as findProjectBySlug)
    const slug = repoSlug(owner, repo).toLowerCase();
    const projectDoc = projects.find((project) => {
      const parsed = parseGithubUrl(project.github);
      return parsed && repoSlug(parsed.owner, parsed.repo).toLowerCase() === slug;
    });
    
    if (!projectDoc || !projectDoc.docFile) {
      return { hasDoc: false, title: "Project Documentation" };
    }
    
    // Load markdown file
    const mdResponse = await fetch(`/ProjectDocs/${projectDoc.docFile}`);
    const mdContent = await mdResponse.text();
    
    return {
      hasDoc: true,
      title: projectDoc.title,
      markdown: mdContent
    };
  } catch (error) {
    console.error("Error loading project documentation:", error);
    return { hasDoc: false, title: "Project Documentation" };
  }
}

async function initProjectDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("repo");

  if (!slug) {
    throw new Error("No repository specified.");
  }

  const [owner, repo] = slug.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid repository path. Use owner/repo.");
  }

  // Load projects from ProjectDocs/projects.json first
  await loadProjectsFromJson();

  const titleEl = document.getElementById("project-title");
  const metaEl = document.getElementById("project-meta");
  const treeEl = document.getElementById("project-tree");
  const fileTitleEl = document.getElementById("file-title");
  const fileContentEl = document.getElementById("file-content");
  const backLink = document.getElementById("back-to-projects");
  const docsTitleEl = document.getElementById("docs-title");
  const docsContentEl = document.getElementById("project-docs-content");
  
  // Find project in PROJECTS array to get GitHub URL and custom meta
  const project = findProjectBySlug(owner, repo);
  const githubUrl = project?.github || `https://github.com/${owner}/${repo}`;

  const { branch, readmeMarkdown, readmePath, tree } = await loadRepoProject(owner, repo);
  const heroTitle = getProjectHeroTitle(owner, repo);

  document.title = `${heroTitle} - Dexteritycoder`;
  if (titleEl) titleEl.innerHTML = `<b>${escapeHtml(heroTitle)}</b>`;
  if (metaEl) metaEl.textContent = project?.meta || `${owner}/${repo} · ${branch}`;
  if (backLink) backLink.href = "/pages/production-projects.html";
  
  // Add GitHub and Clone buttons in sidebar
  const sidebar = document.querySelector(".project-sidebar");
  if (sidebar) {
    const buttonSection = document.createElement("div");
    buttonSection.className = "project-sidebar-section";
    buttonSection.innerHTML = `
      <h2>Project Actions</h2>
      <div class="project-actions">
        <button class="github-btn" onclick="window.open('${githubUrl}', '_blank', 'noopener noreferrer')">GitHub Repo</button>
        <button class="github-btn clone-btn" data-url="https://github.com/${owner}/${repo}.git">Clone</button>
      </div>
    `;
    sidebar.insertBefore(buttonSection, sidebar.firstChild);
    
    // Add clone button functionality
    const cloneBtn = buttonSection.querySelector(".clone-btn");
    if (cloneBtn) {
      cloneBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const cloneUrl = cloneBtn.dataset.url;
        try {
          await navigator.clipboard.writeText(cloneUrl);
          const originalText = cloneBtn.textContent;
          cloneBtn.textContent = "Copied!";
          setTimeout(() => cloneBtn.textContent = originalText, 2000);
        } catch (error) {
          console.error("Failed to copy clone URL:", error);
        }
      });
    }
  }
  
  if (treeEl) treeEl.innerHTML = renderTreeNode(tree, owner, repo, branch);
  if (fileTitleEl) fileTitleEl.textContent = readmePath || "README";
  if (fileContentEl) {
    fileContentEl.innerHTML = `<div class="post-content repo-markdown">${marked.parse(readmeMarkdown)}</div>`;
  }

  if (treeEl && readmePath) {
    const readmeButton = treeEl.querySelector(`.repo-tree-file[data-path="${readmePath}"]`);
    if (readmeButton) readmeButton.classList.add("is-active");
  }

  treeEl?.addEventListener("click", async (event) => {
    const button = event.target.closest(".repo-tree-file");
    if (!button) return;

    const path = button.dataset.path;
    const size = Number(button.dataset.size || 0);
    const fileOwner = button.dataset.owner;
    const fileRepo = button.dataset.repo;
    const fileBranch = button.dataset.branch;

    treeEl.querySelectorAll(".repo-tree-file").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    if (fileTitleEl) fileTitleEl.textContent = path;
    if (fileContentEl) fileContentEl.innerHTML = `<p class="repo-empty-state">Loading file…</p>`;

    if (size > 1024 * 1024) {
      fileContentEl.innerHTML = `<p class="repo-empty-state">This file is larger than 1 MB and cannot be previewed here.</p>`;
      return;
    }

    try {
      let text = "";

      try {
        text = await fetchText(cdnFileUrl(fileOwner, fileRepo, fileBranch, path));
      } catch {
        text = await fetchText(rawFileUrl(fileOwner, fileRepo, fileBranch, path));
      }

      fileContentEl.innerHTML = renderFilePreview(path, text, fileOwner, fileRepo, fileBranch);
    } catch {
      try {
        const fileData = await githubApiFetch(
          `/repos/${fileOwner}/${fileRepo}/contents/${path}?ref=${fileBranch}`
        );
        const text = decodeBase64Content(fileData.content);
        fileContentEl.innerHTML = renderFilePreview(path, text, fileOwner, fileRepo, fileBranch);
      } catch (error) {
        fileContentEl.innerHTML = `<p class="repo-empty-state">${escapeHtml(error.message)}</p>`;
      }
    }
  });
  
  // Load and render project documentation
  const docs = await loadProjectDocumentation(owner, repo);
  if (docsTitleEl) docsTitleEl.textContent = docs.title;
  if (docsContentEl) {
    if (docs.hasDoc) {
      docsContentEl.innerHTML = marked.parse(docs.markdown);
    } else {
      docsContentEl.innerHTML = `<p class="repo-empty-state">No documentation available for this project yet.</p>`;
    }
  }
}

const README_NAMES = ["README.md", "Readme.md", "readme.md", "README.MD"];
const BRANCH_FALLBACKS = ["main", "master"];
const GITHUB_API = "https://api.github.com";

export function parseGithubUrl(url) {
  const match = String(url).match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) {
    return null;
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/i, "") };
}

export function repoSlug(owner, repo) {
  return `${owner}/${repo}`;
}

export async function loadProjectsFromJson() {
  const response = await fetch("/ProjectDocs/projects.json");
  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  return response.json();
}

function rawFileUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function cdnFileUrl(owner, repo, branch, path) {
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
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
  if (!content) {
    return "";
  }

  return decodeURIComponent(
    Array.from(atob(content.replace(/\n/g, "")), (char) =>
      `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`
    ).join("")
  );
}

async function resolveBranch(owner, repo) {
  try {
    const response = await fetch(`https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}`);
    if (response.ok) {
      const data = await response.json();
      if (data.default) {
        return data.default;
      }
      if (Array.isArray(data.versions) && data.versions.length > 0) {
        return data.versions[0];
      }
    }
  } catch {
    // Fall through.
  }

  try {
    const repoData = await githubApiFetch(`/repos/${owner}/${repo}`);
    if (repoData.default_branch) {
      return repoData.default_branch;
    }
  } catch {
    // Fall through.
  }

  for (const branch of BRANCH_FALLBACKS) {
    try {
      const response = await fetch(rawFileUrl(owner, repo, branch, "README.md"), { method: "HEAD" });
      if (response.ok) {
        return branch;
      }
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
      // Try next.
    }
  }

  try {
    const readme = await githubApiFetch(`/repos/${owner}/${repo}/readme`);
    return {
      markdown: decodeBase64Content(readme.content),
      path: readme.path || readme.name || "README.md",
    };
  } catch {
    return {
      markdown: `# ${repo}\n\nNo README found for this repository.`,
      path: null,
    };
  }
}

async function fetchRepoFilesFromJsDelivr(owner, repo, branch) {
  const endpoints = [
    `https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}@${branch}/flat`,
    `https://data.jsdelivr.com/v1/package/gh/${owner}/${repo}/flat`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        return data.files.map((file) => ({
          path: String(file.name || "").replace(/^\//, ""),
          size: Number(file.size) || 0,
        }));
      }
    } catch {
      // Try next endpoint.
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
  if (fromJsDelivr?.length) {
    return fromJsDelivr;
  }

  const fromGithub = await fetchRepoFilesFromGithub(owner, repo, branch);
  if (fromGithub.length > 0) {
    return fromGithub;
  }

  throw new Error("Could not load repository files.");
}

export function rewriteReadmeAssets(markdown, owner, repo, branch) {
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
  const root = { name: "", path: "", type: "dir", children: [] };

  files
    .filter((file) => file.path)
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((file) => {
      const parts = file.path.split("/");
      let node = root;

      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join("/");
        const isLeaf = index === parts.length - 1;
        let child = node.children.find((item) => item.name === part);

        if (!child) {
          child = {
            name: part,
            path: currentPath,
            type: isLeaf ? "file" : "dir",
            size: isLeaf ? file.size : 0,
            children: [],
          };
          node.children.push(child);
        }

        if (isLeaf) {
          child.type = "file";
          child.size = file.size;
        }

        node = child;
      });
    });

  return root;
}

export async function loadRepoProject(owner, repo) {
  const branch = await resolveBranch(owner, repo);
  const { markdown, path } = await fetchReadme(owner, repo, branch);
  const files = await fetchRepoFiles(owner, repo, branch);

  return {
    branch,
    readmeMarkdown: rewriteReadmeAssets(markdown, owner, repo, branch),
    readmePath: path,
    tree: buildTree(files),
  };
}

export async function loadProjectDocumentation(project) {
  if (!project?.docFile) {
    return null;
  }

  const response = await fetch(`/ProjectDocs/${project.docFile}`);
  if (!response.ok) {
    throw new Error("Failed to load project documentation.");
  }

  return response.text();
}

export async function loadRepoFile(owner, repo, branch, path) {
  if (/\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i.test(path)) {
    return { type: "image", content: cdnFileUrl(owner, repo, branch, path) };
  }

  try {
    const text = await fetchText(cdnFileUrl(owner, repo, branch, path));
    return { type: "text", content: text };
  } catch {
    try {
      const text = await fetchText(rawFileUrl(owner, repo, branch, path));
      return { type: "text", content: text };
    } catch {
      const fileData = await githubApiFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      return { type: "text", content: decodeBase64Content(fileData.content) };
    }
  }
}

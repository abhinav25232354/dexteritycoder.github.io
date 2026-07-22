import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { marked } from "marked";
import {
  loadProjectDocumentation,
  loadProjectsFromJson,
  loadRepoFile,
  loadRepoProject,
  parseGithubUrl,
  repoSlug,
  rewriteReadmeAssets,
} from "./lib/projectApi";

function fixText(value) {
  if (typeof value !== "string" || !/[ÂÃâð]/.test(value)) {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeData);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeData(item)])
    );
  }

  return fixText(value);
}

function markdownToHtml(markdown) {
  return marked.parse(fixText(markdown || ""));
}

function useJson(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${url}`);
        }

        const json = await response.json();
        if (active) {
          setState({ data: normalizeData(json), error: null, loading: false });
        }
      } catch (error) {
        if (active) {
          setState({ data: null, error, loading: false });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [url]);

  return state;
}

function useText(url) {
  const [state, setState] = useState({ data: "", error: null, loading: true });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${url}`);
        }

        const text = await response.text();
        if (active) {
          setState({ data: fixText(text), error: null, loading: false });
        }
      } catch (error) {
        if (active) {
          setState({ data: "", error, loading: false });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [url]);

  return state;
}

function usePageSetup(title, bodyClassName = "") {
  const location = useLocation();

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.className = bodyClassName ? `${bodyClassName} page-ready` : "page-ready";
  }, [bodyClassName, location.pathname, location.search]);
}

function useTransitionNavigate() {
  const navigate = useNavigate();

  return (to) => {
    document.body.classList.remove("menu-open");
    document.body.classList.remove("page-ready");
    document.body.classList.add("page-leaving");

    window.setTimeout(() => {
      navigate(to);
    }, 350);
  };
}

function TransitionLink({ href, className, children, style, ...rest }) {
  const navigateWithTransition = useTransitionNavigate();
  const externalOnClick = rest.onClick;

  function handleClick(event) {
    if (typeof externalOnClick === "function") {
      externalOnClick(event);
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === "_blank" ||
      !href.startsWith("/")
    ) {
      return;
    }

    event.preventDefault();
    navigateWithTransition(href);
  }

  const linkProps = { ...rest };
  delete linkProps.onClick;

  return (
    <a {...linkProps} href={href} className={className} style={style} onClick={handleClick}>
      {children}
    </a>
  );
}

function SocialFooter({ footer }) {
  return (
    <section className="whole_footer">
      <footer>
        <div className="social-icons">
          {footer.socials.map((social) => (
            <a key={social.label} href={social.href} aria-label={social.label}>
              <img src={social.icon} alt="" />
            </a>
          ))}
        </div>
        <hr className="footer_hr" />
        <div className="newsletter">
          <h1>{footer.brand}</h1>
          <form action="#">
            <p>{footer.newsletterPrompt}</p>
            <input type="email" required />
            <div className="newsletter-check">
              <input type="checkbox" id="subscribe" />
              <label htmlFor="subscribe">{footer.newsletterCheckbox}</label>
            </div>
            <button type="submit">{footer.newsletterButton}</button>
          </form>
        </div>
        <hr className="footer_hr" />
        <div className="copyright">
          <p>{footer.copyright}</p>
        </div>
      </footer>
    </section>
  );
}

function MinimalFooter({ footer }) {
  return (
    <footer>
      <div className="copyright">
        <p>{footer.copyright}</p>
      </div>
    </footer>
  );
}

function Navbar({ siteData }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    function handleOutsideClick(event) {
      const nav = document.getElementById("rightnav");
      const trigger = document.querySelector(".ham");

      if (!menuOpen || !nav || !trigger) {
        return;
      }

      if (!nav.contains(event.target) && !trigger.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  return (
    <>
      <button
        className="ham"
        aria-label="Open menu"
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </button>
      <div className="navbar">
        <div id="leftnav">
          <TransitionLink href="/index.html" style={{ textDecoration: "none", color: "inherit" }}>
            <h4>DEXTERITYCODER</h4>
          </TransitionLink>
        </div>
        <div id="rightnav">
          <ul id="rightnavul">
            {siteData.navigation.map((item) => (
              <TransitionLink key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                <li>{item.label}</li>
              </TransitionLink>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function Hero({ titleHtml, backgroundImage, titleStyle, meta, heroClassName = "hero" }) {
  const style = backgroundImage
    ? {
        backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.38), rgba(18, 18, 18, 0.58)), url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <section className={heroClassName} style={style}>
      <div className="hero-inner">
        <h1 style={titleStyle} dangerouslySetInnerHTML={{ __html: titleHtml }}></h1>
        {meta ? <p className="project-hero-meta">{meta}</p> : null}
      </div>
    </section>
  );
}

function Gallery({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());

  useEffect(() => {
    function handleResize() {
      setItemsPerView(getItemsPerView());
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(items.length - itemsPerView, 0);
    setCurrentIndex((index) => Math.min(index, maxIndex));
  }, [items.length, itemsPerView]);

  const maxIndex = Math.max(items.length - itemsPerView, 0);
  const offsetPercent = itemsPerView === 1 ? 100 : itemsPerView === 2 ? 50 : 33.333333;

  return (
    <div className="gallery-container">
      <div className="gallery-title">GALLERY</div>
      <div className="gallery-viewport">
        <div
          className="gallery-slider"
          style={{ transform: `translateX(-${currentIndex * offsetPercent}%)` }}
        >
          {items.map((item) => (
            <div key={item.image} className="gallery-item">
              <img src={item.image} alt={item.alt} />
            </div>
          ))}
        </div>
      </div>
      <button
        className="gallery-button left"
        type="button"
        aria-label="Previous gallery items"
        onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="gallery-button right"
        type="button"
        aria-label="Next gallery items"
        onClick={() => setCurrentIndex((index) => Math.min(index + 1, maxIndex))}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function getItemsPerView() {
  if (window.innerWidth <= 680) {
    return 1;
  }
  if (window.innerWidth <= 1200) {
    return 2;
  }
  return 3;
}

function WorkCard({ card }) {
  const navigateWithTransition = useTransitionNavigate();

  return (
    <div
      className="blog-card"
      data-post={card.slug}
      onClick={() => navigateWithTransition(`/pages/${card.slug}.html`)}
    >
      <div className="blog-card-media">
        <img src={card.image} alt="Dexteritycoder featured post" />
      </div>
      <div className="blog-content">
        <div className="meta">{card.meta}</div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <div className="blog-footer">
          <span className="views">{card.views}</span>
          <span className="comments">{card.comments}</span>
          <span className="like">{card.likes}</span>
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ markdown }) {
  return <section className="post-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}></section>;
}

function Shell({ siteData, footer = "full", children }) {
  return (
    <>
      <Navbar siteData={siteData} />
      {children}
      {footer === "full" ? <SocialFooter footer={siteData.footer} /> : <MinimalFooter footer={siteData.footer} />}
    </>
  );
}

function HomePage({ siteData }) {
  usePageSetup("Dexteritycoder", "home-page");

  return (
    <Shell siteData={siteData} footer="full">
      <Hero titleHtml={siteData.home.heroTitleHtml} />
      <section className="home-blog-grid">
        {siteData.home.works.map((card) => (
          <WorkCard key={card.slug} card={card} />
        ))}
      </section>
      <div className="all_posts_btn">
        <center>
          <TransitionLink href="/pages/blog.html">
            <button type="button">View All Works</button>
          </TransitionLink>
        </center>
      </div>
      <Gallery items={siteData.home.gallery} />
    </Shell>
  );
}

function WorksPage({ siteData }) {
  usePageSetup("Blog | Dexteritycoder", "home-page");

  const cards = siteData.home.works.map((card) => ({
    ...card,
    views: "0 views",
    comments: "0 comments",
    likes: "5",
  }));

  return (
    <Shell siteData={siteData} footer="full">
      <Hero titleHtml={siteData.works.listing.heroTitleHtml} />
      <section className="home-blog-grid">
        {cards.map((card) => (
          <WorkCard key={card.slug} card={card} />
        ))}
      </section>
    </Shell>
  );
}

function WorkMarkdownPage({ siteData, slug, production = false }) {
  const page = siteData.works.pages[slug];
  const { data, error, loading } = useText(page.markdownPath);
  const [projects, setProjects] = useState([]);
  const navigateWithTransition = useTransitionNavigate();

  usePageSetup(page.documentTitle, "post-page");

  useEffect(() => {
    if (!production) {
      return undefined;
    }

    let active = true;
    loadProjectsFromJson()
      .then((items) => {
        if (active) {
          setProjects(normalizeData(items));
        }
      })
      .catch(() => {
        if (active) {
          setProjects([]);
        }
      });

    return () => {
      active = false;
    };
  }, [production]);

  return (
    <Shell siteData={siteData} footer="minimal">
      <Hero
        titleHtml={page.heroTitle}
        backgroundImage={page.heroImage}
        titleStyle={{ fontSize: "clamp(1.45rem, 1.3vw + 1.05rem, 2.2rem)" }}
      />
      <main className="post-article production-projects-page">
        <article>
          <div className="meta">{page.meta}</div>
          {loading ? <section className="post-content"><p>Loading...</p></section> : null}
          {error ? <section className="post-content"><p>Error loading content.</p></section> : null}
          {!loading && !error ? <MarkdownContent markdown={data} /> : null}
          <TransitionLink href={page.ctaHref}>
            <button className="call-to-blog-button">{page.ctaLabel}</button>
          </TransitionLink>
        </article>
        {production ? (
          <section className="production-projects-section" aria-label="Featured production projects">
            <h2 className="production-projects-heading">Featured Projects</h2>
            <p className="production-projects-subtitle">
              Each card opens the README and repository files in your browser static frontend only, no backend server.
            </p>
            <div className="project-cards-grid">
              {projects.map((project) => {
                const parsed = parseGithubUrl(project.github);
                const repo = parsed ? repoSlug(parsed.owner, parsed.repo) : "";

                return (
                  <article
                    key={project.github}
                    className="blog-card project-card"
                    onClick={() =>
                      navigateWithTransition(`/pages/project-detail.html?repo=${encodeURIComponent(repo)}`)
                    }
                  >
                    <div className="blog-card-media">
                      <img src={project.image} alt={project.title} />
                    </div>
                    <div className="blog-content">
                      <div className="meta">{project.meta || "Open Source"}</div>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <div className="blog-footer">
                        <span className="views">View Details</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </Shell>
  );
}

function AboutPage({ siteData }) {
  const { data, error, loading } = useText(siteData.about.markdownPath);
  usePageSetup(siteData.about.documentTitle);

  return (
    <Shell siteData={siteData} footer="full">
      <Hero
        titleHtml={siteData.about.heroTitleHtml}
        titleStyle={{ fontSize: "clamp(1.45rem, 1.3vw + 1.05rem, 2.2rem)" }}
      />
      <main className="post-article">
        <article>
          {loading ? <section className="post-content"><p>Loading...</p></section> : null}
          {error ? <section className="post-content"><p>Error loading content.</p></section> : null}
          {!loading && !error ? <MarkdownContent markdown={data} /> : null}
        </article>
        <TransitionLink href={siteData.about.ctaHref}>
          <button className="call-to-blog-button">{siteData.about.ctaLabel}</button>
        </TransitionLink>
      </main>
      <Gallery items={siteData.about.gallery} />
    </Shell>
  );
}

function ContactPage({ siteData }) {
  usePageSetup(siteData.contact.documentTitle);

  return (
    <Shell siteData={siteData} footer="full">
      <Hero
        titleHtml={siteData.contact.heroTitleHtml}
        titleStyle={{ fontSize: "clamp(1.45rem, 1.3vw + 1.05rem, 2.2rem)" }}
      />
      <div className="contact-form-container">
        <form className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="Enter your email address" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="5" placeholder="Write your message..." required></textarea>
          </div>
          <br />
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
      </div>
    </Shell>
  );
}

function DonatePage({ siteData }) {
  usePageSetup(siteData.donate.documentTitle);

  return (
    <Shell siteData={siteData} footer="full">
      <Hero
        titleHtml={siteData.donate.heroTitleHtml}
        titleStyle={{ fontSize: "clamp(1.45rem, 1.3vw + 1.05rem, 2.2rem)" }}
      />
      <div className="donate-container">
        <div className="donate-text">
          <h2 style={{ marginTop: 0 }}>{siteData.donate.heading}</h2>
          <p>{siteData.donate.description}</p>
        </div>
        <div className="donate-iframe-container">
          <iframe id="donate-iframe" src={siteData.donate.iframeUrl} frameBorder="0" allowFullScreen></iframe>
        </div>
      </div>
    </Shell>
  );
}

function BlogListPage({ siteData }) {
  const { data, error, loading } = useJson("/BlogPosts/posts.json");
  const [search, setSearch] = useState("");
  const navigateWithTransition = useTransitionNavigate();
  usePageSetup(siteData.blogs.documentTitle, "home-page");

  const posts = Array.isArray(data) ? [...data].reverse() : [];
  const filteredPosts = posts.filter((post) => {
    const term = search.toLowerCase().trim();
    if (!term) {
      return true;
    }

    return (
      post.title.toLowerCase().includes(term) ||
      post.description.toLowerCase().includes(term) ||
      post.author.toLowerCase().includes(term)
    );
  });

  return (
    <Shell siteData={siteData} footer="full">
      <Hero titleHtml={siteData.blogs.heroTitleHtml} />
      <div className="blog-search-container">
        <input
          type="text"
          id="blog-search"
          placeholder={siteData.blogs.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <svg className="blog-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      <section className="home-blog-grid" id="blog-grid">
        {loading ? <p>Loading...</p> : null}
        {error ? <p style={{ color: "white", textAlign: "center" }}>Error loading blog posts</p> : null}
        {!loading && !error
          ? filteredPosts.map((post) => (
              <div
                key={post.id}
                className="blog-card"
                data-blog={post.id}
                onClick={() =>
                  navigateWithTransition(`/Blogs/blog-detail.html?blog=${encodeURIComponent(post.id)}`)
                }
              >
                <div className="blog-card-media">
                  <img src={post.image} alt={post.title} />
                </div>
                <div className="blog-content">
                  <div className="meta">{`${post.author} · ${post.date} · ${post.readTime}`}</div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <div className="blog-footer">
                    <span className="views">{post.views} views</span>
                    <span className="comments">{post.comments} comments</span>
                    <span className="like">❤ {post.likes}</span>
                  </div>
                </div>
              </div>
            ))
          : null}
      </section>
    </Shell>
  );
}

function BlogDetailPage({ siteData }) {
  const location = useLocation();
  const blogId = new URLSearchParams(location.search).get("blog");
  const { data: posts } = useJson("/BlogPosts/posts.json");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState(null);

  const post = Array.isArray(posts) ? posts.find((item) => item.id === blogId) : null;
  usePageSetup(post ? `${post.title} | Dexteritycoder` : "Blog | Dexteritycoder", "post-page");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!blogId) {
        setError(new Error("Blog not found"));
        return;
      }

      try {
        const response = await fetch(`/BlogPosts/${blogId}.md`);
        if (!response.ok) {
          throw new Error("Blog not found");
        }

        const text = await response.text();
        if (active) {
          setMarkdown(fixText(text));
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [blogId]);

  const heroHtml = post ? post.title : "Blog Not Found";

  return (
    <Shell siteData={siteData} footer="minimal">
      <Hero
        titleHtml={heroHtml}
        backgroundImage={post?.image}
        titleStyle={{ fontSize: "clamp(1.45rem, 1.3vw + 1.05rem, 2.2rem)" }}
        heroClassName="hero"
      />
      <main className="post-article">
        <article>
          <div className="meta" id="blog-meta">
            {post ? `${post.author} · ${post.date} · ${post.readTime}` : "Loading..."}
          </div>
          {error ? <section className="post-content"><p>{error.message}</p></section> : null}
          {!error && markdown ? <MarkdownContent markdown={markdown} /> : null}
          {!error && !markdown ? <section className="post-content"><p>Loading...</p></section> : null}
        </article>
      </main>
    </Shell>
  );
}

function TreeNode({ node, onSelect, activePath, depth = 0 }) {
  const children = [...(node.children || [])].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "dir" ? -1 : 1;
    }
    return b.name.localeCompare(a.name);
  });

  return children.map((child) => {
    const icon = child.type === "dir" ? <FolderIcon /> : <FileIcon />;
    const style = child.type === "dir" ? { paddingLeft: `${depth * 14}px` } : { paddingLeft: `${depth * 14 + 14}px` };

    if (child.type === "dir") {
      return (
        <details className="repo-tree-folder" open key={child.path}>
          <summary className="repo-tree-item repo-tree-folder-label" style={style}>
            <span className="repo-tree-icon">{icon}</span>
            <span>{child.name}</span>
          </summary>
          <TreeNode node={child} onSelect={onSelect} activePath={activePath} depth={depth + 1} />
        </details>
      );
    }

    return (
      <button
        type="button"
        key={child.path}
        className={`repo-tree-item repo-tree-file${activePath === child.path ? " is-active" : ""}`}
        style={style}
        onClick={() => onSelect(child)}
      >
        <span className="repo-tree-icon">{icon}</span>
        <span>{child.name}</span>
      </button>
    );
  });
}

function FolderIcon() {
  return (
    <svg className="repo-tree-icon-svg repo-tree-icon-folder" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"></path>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="repo-tree-icon-svg repo-tree-icon-file" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 11.25 16h-7.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 7 4.25V1.5Zm5.75.086v2.25a.25.25 0 0 0 .25.25h2.25L6.75 1.5Z"></path>
    </svg>
  );
}

function ProjectDetailPage({ siteData }) {
  const location = useLocation();
  const repoQuery = new URLSearchParams(location.search).get("repo");
  const [state, setState] = useState({
    loading: true,
    error: null,
    project: null,
    owner: "",
    repo: "",
    branch: "",
    tree: null,
    readmePath: "",
    readmeMarkdown: "",
    docsMarkdown: "",
    fileTitle: "README",
    fileHtml: "<p class='repo-empty-state'>Loading..</p>",
    activePath: "",
  });

  const heroTitle = state.project?.heroTitle || state.project?.title || state.repo || "Loading project..";
  const heroMeta = state.project?.meta || (state.owner && state.repo ? `${state.owner}/${state.repo} · ${state.branch}` : "");
  usePageSetup(`${heroTitle} - Dexteritycoder`, "home-page project-detail-page");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (!repoQuery) {
          throw new Error("No repository specified.");
        }

        const [owner, repo] = repoQuery.split("/");
        if (!owner || !repo) {
          throw new Error("Invalid repository path. Use owner/repo.");
        }

        const projects = normalizeData(await loadProjectsFromJson());
        const project = projects.find((item) => {
          const parsed = parseGithubUrl(item.github);
          return parsed && repoSlug(parsed.owner, parsed.repo).toLowerCase() === repoSlug(owner, repo).toLowerCase();
        }) || null;

        const repoData = await loadRepoProject(owner, repo);
        const docsMarkdown = project ? await loadProjectDocumentation(project) : null;
        const fileHtml = `<div class="post-content repo-markdown">${markdownToHtml(
          rewriteReadmeAssets(repoData.readmeMarkdown, owner, repo, repoData.branch)
        )}</div>`;

        if (active) {
          setState({
            loading: false,
            error: null,
            project,
            owner,
            repo,
            branch: repoData.branch,
            tree: repoData.tree,
            readmePath: repoData.readmePath || "",
            readmeMarkdown: repoData.readmeMarkdown,
            docsMarkdown: docsMarkdown ? fixText(docsMarkdown) : "",
            fileTitle: repoData.readmePath || "README",
            fileHtml,
            activePath: repoData.readmePath || "",
          });
        }
      } catch (error) {
        if (active) {
          setState((current) => ({ ...current, loading: false, error }));
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [repoQuery]);

  async function handleSelectFile(fileNode) {
    if (fileNode.size > 1024 * 1024) {
      setState((current) => ({
        ...current,
        fileTitle: fileNode.path,
        fileHtml: "<p class='repo-empty-state'>This file is larger than 1 MB and cannot be previewed here.</p>",
        activePath: fileNode.path,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      fileTitle: fileNode.path,
      fileHtml: "<p class='repo-empty-state'>Loading file...</p>",
      activePath: fileNode.path,
    }));

    try {
      const file = await loadRepoFile(state.owner, state.repo, state.branch, fileNode.path);
      if (file.type === "image") {
        setState((current) => ({
          ...current,
          fileHtml: `<div class="repo-media-preview"><img src="${file.content}" alt="${fileNode.name}"></div>`,
        }));
        return;
      }

      if (/\.(md|markdown)$/i.test(fileNode.path)) {
        const markdown = rewriteReadmeAssets(file.content, state.owner, state.repo, state.branch);
        setState((current) => ({
          ...current,
          fileHtml: `<div class="post-content repo-markdown">${markdownToHtml(markdown)}</div>`,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        fileHtml: `<pre class="repo-code-block"><code>${escapeHtml(fixText(file.content))}</code></pre>`,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        fileHtml: `<p class="repo-empty-state">${escapeHtml(error.message)}</p>`,
      }));
    }
  }

  async function copyCloneUrl() {
    const cloneUrl = `https://github.com/${state.owner}/${state.repo}.git`;
    await navigator.clipboard.writeText(cloneUrl);
  }

  return (
    <Shell siteData={siteData} footer="minimal">
      <Hero
        titleHtml={`<b>${heroTitle}</b>`}
        meta={heroMeta}
        heroClassName="hero"
      />
      <main className="project-detail-shell">
        <TransitionLink id="back-to-projects" className="project-back-link" href="/pages/production-projects.html">
          Back to Production Projects
        </TransitionLink>
        <div className="project-detail-layout">
          <aside className="project-sidebar">
            <div className="project-sidebar-section">
              <h2>Project Actions</h2>
              <div className="project-actions">
                <button
                  className="github-btn"
                  onClick={() => window.open(state.project?.github || `https://github.com/${state.owner}/${state.repo}`, "_blank", "noopener,noreferrer")}
                >
                  GitHub Repo
                </button>
                <button className="github-btn clone-btn" onClick={copyCloneUrl}>
                  Clone
                </button>
              </div>
            </div>
            <div className="project-sidebar-section">
              <h2>Project Files</h2>
              <div id="project-tree" className="repo-tree">
                {state.loading ? <p className="repo-empty-state">Loading repository tree..</p> : null}
                {state.error ? <p className="repo-empty-state">{state.error.message}</p> : null}
                {state.tree ? (
                  <TreeNode node={state.tree} onSelect={handleSelectFile} activePath={state.activePath} />
                ) : null}
              </div>
            </div>
          </aside>
          <section className="project-file-viewer">
            <div className="project-file-viewer-header">
              <h2>{state.fileTitle}</h2>
            </div>
            <div
              id="file-content"
              className="project-file-content"
              dangerouslySetInnerHTML={{ __html: state.fileHtml }}
            ></div>
          </section>
        </div>
        <section className="project-documentation-section">
          <h2>{state.project?.title || "Project Documentation"}</h2>
          <div
            id="project-docs-content"
            className="post-content"
            dangerouslySetInnerHTML={{
              __html: state.docsMarkdown
                ? markdownToHtml(state.docsMarkdown)
                : "<p class='repo-empty-state'>No documentation available for this project yet.</p>",
            }}
          ></div>
        </section>
      </main>
    </Shell>
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function LoadingScreen() {
  usePageSetup("Dexteritycoder");

  return (
    <main className="post-article">
      <p>Loading...</p>
    </main>
  );
}

function AppRoutes({ siteData }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage siteData={siteData} />} />
      <Route path="/index.html" element={<HomePage siteData={siteData} />} />
      <Route path="/pages/blog.html" element={<WorksPage siteData={siteData} />} />
      <Route path="/pages/production-projects.html" element={<WorkMarkdownPage siteData={siteData} slug="production-projects" production />} />
      <Route path="/pages/ai-machine-learning.html" element={<WorkMarkdownPage siteData={siteData} slug="ai-machine-learning" />} />
      <Route path="/pages/train-to-thoughts.html" element={<WorkMarkdownPage siteData={siteData} slug="train-to-thoughts" />} />
      <Route path="/pages/available-for-freelancing.html" element={<WorkMarkdownPage siteData={siteData} slug="available-for-freelancing" />} />
      <Route path="/pages/about.html" element={<AboutPage siteData={siteData} />} />
      <Route path="/pages/contact.html" element={<ContactPage siteData={siteData} />} />
      <Route path="/pages/donate.html" element={<DonatePage siteData={siteData} />} />
      <Route path="/Blogs/blog-list.html" element={<BlogListPage siteData={siteData} />} />
      <Route path="/Blogs/blog-detail.html" element={<BlogDetailPage siteData={siteData} />} />
      <Route path="/pages/project-detail.html" element={<ProjectDetailPage siteData={siteData} />} />
      <Route path="/pages/post1.html" element={<Navigate to="/pages/production-projects.html" replace />} />
      <Route path="/pages/post2.html" element={<Navigate to="/pages/ai-machine-learning.html" replace />} />
      <Route path="/pages/post3.html" element={<Navigate to="/pages/train-to-thoughts.html" replace />} />
      <Route path="/pages/post4.html" element={<Navigate to="/pages/available-for-freelancing.html" replace />} />
      <Route path="*" element={<Navigate to="/index.html" replace />} />
    </Routes>
  );
}

export default function App() {
  const { data, error, loading } = useJson("/data/site-content.json");

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !data) {
    return (
      <main className="post-article">
        <p>Failed to load site data.</p>
      </main>
    );
  }

  return <AppRoutes siteData={data} />;
}

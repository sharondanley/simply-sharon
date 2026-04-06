const statusEl = document.getElementById("status");
const postsEl = document.getElementById("posts");
const limitInput = document.getElementById("limitInput");
const loadPostsBtn = document.getElementById("loadPostsBtn");
const healthBtn = document.getElementById("healthBtn");

function setStatus(message) {
  statusEl.textContent = message;
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function renderPosts(posts) {
  postsEl.innerHTML = "";

  if (!posts.length) {
    postsEl.innerHTML = "<p>No posts found.</p>";
    return;
  }

  for (const post of posts) {
    const card = document.createElement("article");
    card.className = "post";
    card.innerHTML = `
      <h3>${post.title || "Untitled"}</h3>
      <p class="meta">Slug: ${post.slug || "-"}</p>
      <p class="meta">Status: ${post.status || "-"}</p>
      <p class="meta">Created: ${formatDate(post.created_at)}</p>
      <p class="excerpt">${post.excerpt || "No excerpt"}</p>
    `;
    postsEl.appendChild(card);
  }
}

async function loadPosts() {
  const requestedLimit = Number(limitInput.value || 10);
  const limit = Math.max(1, Math.min(requestedLimit, 100));

  setStatus("Loading posts...");
  try {
    const response = await fetch(`/api/posts?limit=${limit}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed (${response.status}): ${text}`);
    }

    const posts = await response.json();
    renderPosts(posts);
    setStatus(`Loaded ${posts.length} post(s).`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
}

async function checkHealth() {
  setStatus("Checking health...");
  try {
    const response = await fetch("/health");
    if (!response.ok) {
      throw new Error(`Health failed (${response.status})`);
    }

    const data = await response.json();
    setStatus(`Health: ${JSON.stringify(data)}`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
}

loadPostsBtn.addEventListener("click", loadPosts);
healthBtn.addEventListener("click", checkHealth);

loadPosts();

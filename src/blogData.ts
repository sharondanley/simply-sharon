export type BlockType = "paragraph" | "heading" | "quote" | "image" | "video" | "divider" | "customGrid";

export type GridCellContentType = "paragraph" | "image" | "thumbnail";

export type GridLayout = "1x3" | "3x3";

export type GridCell = {
  id: string;
  contentType: GridCellContentType;
  content?: string;
  url?: string;
  caption?: string;
};

export type BlogBlock = {
  id: string;
  type: BlockType;
  content?: string;
  url?: string;
  caption?: string;
  layout?: GridLayout;
  cells?: GridCell[];
};

export type ArchivePost = {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  thumbnailUrl?: string | null;
  topic?: string | null;
  episode?: number | null;
  readUrl?: string | null;
  listenUrl?: string | null;
  watchUrl?: string | null;
  showReadButton?: boolean;
  showListenButton?: boolean;
  showWatchButton?: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
};

export type BlogPersonalization = {
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  profilePhotoUrl?: string | null;
  inspirationQuote?: string | null;
  inspirationQuoteAuthor?: string | null;
  inspirationImageUrl?: string | null;
};

export type BlogPostRecord = ArchivePost & {
  blocks: BlogBlock[];
  hashtags: string[];
  published: boolean;
  authorName?: string | null;
  updatedAt?: string | null;
  personalization?: BlogPersonalization | null;
};

type ArchiveResponse = {
  items: ArchivePost[];
  total: number;
  page: number;
  totalPages: number;
};

export type ArchiveSort = "recent" | "category";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || "Request failed");
  }
  return data as T;
}

export function fetchBlogcastPosts(params: {
  page: number;
  limit: number;
  search?: string;
  year?: string;
  month?: string;
  sort?: ArchiveSort;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.year?.trim()) query.set("year", params.year.trim());
  if (params.month?.trim()) query.set("month", params.month.trim());
  if (params.sort === "category") query.set("sort", "category");

  return fetchJson<ArchiveResponse>(`/api/blogcast/posts?${query.toString()}`);
}

export function fetchBlogPostBySlug(slug: string) {
  return fetchJson<BlogPostRecord>(`/api/blogcast/posts/${encodeURIComponent(slug)}`);
}

export function fetchBlogPostById(id: number) {
  return fetchJson<BlogPostRecord>(`/api/blogcast/posts/id/${id}`);
}

export function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ordinal(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatArchiveDate(value?: string | null) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[date.getMonth()]} ${ordinal(date.getDate())} ${date.getFullYear()}`;
}

export function getPostLeadText(post: BlogPostRecord) {
  const firstTextBlock = post.blocks.find((block) =>
    block.type === "paragraph" || block.type === "quote" || block.type === "heading"
  );
  return stripHtml(post.summary) || stripHtml(firstTextBlock?.content) || post.subtitle || "";
}

export function toEmbedUrl(url?: string | null) {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
}
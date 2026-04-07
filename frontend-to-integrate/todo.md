# Simply Sharon - Project TODO

## Phase 1: Infrastructure
- [x] Initialize project with Figma designs
- [x] Upload all assets to CDN
- [x] Build homepage (desktop + mobile responsive)
- [x] Build blog post page template
- [x] Upgrade to full-stack (db + server + user)

## Phase 2: Navigation & Global Logic
- [x] Mobile hamburger menu with full-screen overlay
- [x] Admin Login link in footer of all pages
- [x] Restore Home.tsx with original design

## Phase 3: Blogcast Archive Page
- [x] Blogcast archive listing page at /blogcast
- [x] Article cards with thumbnail, title, subtitle, summary, hashtags
- [x] Search bar
- [x] Sort dropdown (Title, Date, Topic)
- [x] Pagination (15 per page, Prev/Next/page numbers)
- [x] Database schema for posts

## Phase 4: Threaded Comment System
- [x] Comment schema in database
- [x] Threaded/nested reply system (recursive components)
- [x] User avatars and timestamps
- [x] Like button and emoji reaction picker (❤️ 👍 😂)
- [x] Character counter and submit button
- [x] Display in blog post comment section

## Phase 5: Collapsible Gallery
- [x] Convert gallery buttons to accordion on homepage
- [x] Makeup: Ordinary to Extraordinary, Golden Girls, Eyebrows, Bridal, Males
- [x] SFX: Characters 1, Characters 2, Film, TV, Bus. SFX, Facepainting
- [x] Hairstyling: Historical/Fashion/Character, Updos, Short & Long, Vintage, Thin Hair Help

## Phase 6: Admin Dashboard & CMS
- [x] Admin login page at /admin/login
- [x] Admin dashboard layout with sidebar
- [x] Block-based post editor (drag-and-drop reorder)
- [x] Block types: heading, paragraph, image, video, quote, divider, emoji
- [x] Thumbnail upload/preview tool
- [x] Post list management (create, edit, delete, publish)
- [x] Role-based access control (admin only)
- [x] 25 vitest unit tests passing

## Phase 7: Real HTML/CSS Sections (replacing image-based)
- [x] Rebuild navbar as real HTML/CSS component (logo, nav links, mobile hamburger)
- [x] Rebuild hero section as real HTML/CSS (background image, script headings, body text)
- [x] Rebuild footer as real HTML/CSS (social links, contact info, admin login)
- [x] Audit remaining image-based sections (make-betters, gray-is-gorgeous, about-sharon)

## Phase 8: Rich Text Editor Toolbar
- [x] Add formatting toolbar to paragraph blocks (bold, italic, underline)
- [x] Add heading size selector to heading blocks (H1, H2, H3)
- [x] Render formatted HTML in the blog post view

## Phase 9: Comment Section UI Refinement
- [x] Replace static comment section screenshot with functional CommentSection component
- [x] Rich text editor with B/I/U/List/@ toolbar and Send button
- [x] Smiley-face reaction pill (matching reference design) with like/dislike counts
- [x] Threaded replies with indentation and reply editor
- [x] Sort by Latest/Popular toggle
- [x] Total comment count display
- [x] @mention highlighting in gray
- [x] Loading indicator at bottom
- [x] Three-dot menu per comment (Report/Copy link/Hide)
- [x] Online/offline status dot on avatars
- [x] Blue verified checkmark for Sharon Danley

## Phase 10: Comment Section Typography Update
- [x] Scale comment text to match blog post body (Helvetica 36px/46px)
- [x] Scale author names to 32px bold, meta/timestamps to 28px
- [x] Scale "Comments" heading to 44px bold
- [x] Scale toolbar buttons, Send button, and sort toggle to match
- [x] Remove online/offline status dots from all avatars

## Phase 11: Reaction Button Update
- [x] Replace smiley/frown icons with thumbs up/down SVG icons
- [x] Always show both thumbs up and thumbs down on every comment (even when count is 0)

## Phase 12: Navbar Rebuild
- [x] Create shared SiteNavbar component matching Figma spec exactly
- [x] Dark gradient background (no background image), logo + Italianno name left, Inter links right
- [x] Replace navbar in BlogPost.tsx with shared component
- [x] Replace navbar in BlogcastArchive.tsx with shared component
- [x] Replace navbar in BlogPage.tsx with shared component
- [x] Update Home.tsx Navbar function to use same shared component
- [x] Preserve mobile hamburger menu

## Phase 13: Footer Rebuild
- [x] Create shared SiteFooter component matching Figma spec exactly
- [x] Dark gradient background, Italianno "Connect with Sharon" heading, social icons row
- [x] Contact links: Email, YouTube, Facebook (Private Group + Public Page) with proper layout
- [x] Caricature portrait on the right side
- [x] Disclaimer and copyright text at bottom
- [x] Replace footer in Home.tsx with shared component
- [x] Replace footer in BlogPost.tsx with shared component
- [x] Replace footer in BlogcastArchive.tsx with shared component
- [x] Replace footer in BlogPage.tsx with shared component

## Phase 16: Standalone Admin Login (no Manus OAuth)
- [x] Add ADMIN_USERNAME and ADMIN_PASSWORD env secrets
- [x] Add admin.login tRPC mutation (verifies credentials, issues JWT session cookie)
- [x] Update context.ts to handle local:admin openId without Manus OAuth sync
- [x] Replace Manus sign-in button in Admin.tsx with username/password form
- [x] Test login, dashboard access, and logout flow

## Phase 17: Admin Dashboard Accessibility & UX
- [x] Increase all admin font sizes (labels, inputs, buttons, sidebar, stats) for readability
- [x] Fix grey-on-grey contrast: replace all text-gray-400/500 on grey backgrounds with darker text
- [x] Add dark mode toggle button in admin sidebar/header that persists via localStorage
- [x] Add live post preview panel alongside the block editor (split-pane: editor left, preview right)

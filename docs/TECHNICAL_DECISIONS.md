# Technical Decisions – CogniContent

## 1) Problem Specification & Approach

Goal: build a content platform that helps creators produce and organize articles faster, while improving reader discovery and engagement.

Approach:
- Deliver a robust REST API (Node.js/Express, MongoDB) for core CMS features.
- Layer in lightweight AI/NLP to automate tagging, suggest categories, and provide real‑time writing feedback.
- Keep the system self‑contained (no external AI calls by default) to reduce cost/latency and simplify deployment.

## 2) Technology Stack Choices & Reasoning

- Backend: Node.js + Express
  - Ubiquitous ecosystem, fast iteration, familiar to most web teams.
- Database: MongoDB + Mongoose
  - Flexible schema for evolving content/AI fields; powerful indexing and text search; Mongoose for validation and models.
- Auth: JWT, bcrypt
  - Stateless auth for APIs. Bcrypt for secure password hashing.
- File Uploads: multer + Cloudinary
  - Multer handles multipart form data; Cloudinary for reliable, CDN‑backed image storage.
- AI/NLP Libraries:
  - natural: TF‑IDF and tokenization for auto‑tagging.
  - @mozilla/readability + jsdom: parse HTML into clean text; compute word metrics.
  - franc: detect language to annotate content and inform future ML.
- Tooling: ESLint, nodemon
  - Code quality and local DX.

## 3) AI Tools Used & How They Helped

- Text extraction & stats: readability + jsdom
  - Convert HTML body to readable text to compute wordCount and readingTime.
- Tag generation: natural (TF‑IDF) + n‑grams
  - Rank terms by TF‑IDF; enrich with bi/tri‑grams to capture common phrases; store both `autoTags` and detailed `ai.tagsWithScores` for transparency.
- Category suggestion: keyword scoring vs Category model
  - Compare extracted tokens to `Category.keywords`; score each category and pick the best; return `categoryConfidence` and `ai.categoryScores`.
- Language detection: franc
  - Store `detectedLanguage` for analytics and future multilingual features.
- Transparency & traceability
  - Persist `ai.*` metadata so editors can see why a suggestion was made.

Why not an LLM?
- Cost, latency, and deterministic behavior favored a heuristic phase first. The design leaves room for an optional LLM overlay later.

## 4) Key Architectural Decisions

- Service‑oriented layering
  - Controllers handle HTTP; Services contain business logic; Models encapsulate persistence.
- Combined create flow with uploads
  - `POST /content` handles text + optional image in one call for simpler UX.
- Denormalized counters
  - Fast reads for likes/comments/views; eventual consistency managed via interaction services.
- Text search + indexes
  - Text index across `title`, `body`, `tags`, `autoTags`, `category` to support search and discovery.
- Security middleware
  - `verifyToken`, `checkRole([creator, admin])` guard content creation/analysis.
- Explicit field naming to avoid DB conflicts
  - Use `detectedLanguage` (not `language`) to avoid MongoDB text index language override issues.
- Consistent responses
  - Central `generateResponse` for uniform API responses and easy client handling.

## 5) Trade‑offs & Considerations

- Heuristic vs LLM
  - Heuristics are fast, cheap, and private but may be less semantically rich than LLMs.
- Data quality dependency
  - Category suggestions depend on good `Category.keywords`; poor seed data lowers accuracy.
- Multilingual support
  - `franc` provides detection, but TF‑IDF and keywords are English‑biased unless expanded.
- Performance & scale
  - TF‑IDF on single documents is lightweight; batch/heavy analysis could be queued if needed.
- Denormalized counters
  - Pros: faster list pages; Cons: need careful increments/decrements; risk of drift.
- File handling
  - Combined upload simplifies client code but adds complexity to the create route.
- Security & validation
  - Role checks and auth guards are present; request schema validation can be expanded.

## 6) Improvements With More Time

- Optional LLM overlay
  - Use OpenAI or similar to refine tags/category and generate SEO metadata; controlled via env flags.
- Feedback loop & active learning
  - Capture editor overrides of tags/categories to retrain heuristics or fine‑tune weights.
- Readability metrics
  - Add Flesch‑Kincaid and other readability scores to `optimization`.
- Search & recommendations
  - Vector search for semantic similarity; hybrid search (BM25 + embeddings) for related content.
- Caching & rate limiting
  - Cache hot endpoints (e.g., lists) and protect analyze routes from abuse.
- Admin console
  - Manage categories/keywords, review creator requests, moderate content.
- Validation & testing
  - Add Joi/Zod request validation; expand unit/integration tests.
- Observability
  - Structured logs, tracing, dashboards for AI suggestion quality over time.
- Content moderation
  - Toxicity/spam detection on comments and content.
- Internationalization
  - Localize category keywords; stemmers/stop‑words per language.

---

This document reflects the current implementation and the guiding principles used to balance delivery speed, maintainability, and feature depth while laying a path to future enhancements.

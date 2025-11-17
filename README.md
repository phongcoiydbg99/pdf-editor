# React PDF Signature Editor

Single-page tool for dragging signature images into a PDF and exporting the result. It auto-loads a sample PDF plus three remote signature examples, but also supports uploading your own PDF/images.

## Features

- React 19 + Vite + Tailwind UI with fixed sidebar + sticky save bar
- Drag signatures from the left list onto any PDF page
- Move and resize signatures via direct manipulation (drag & resize handles)
- Built-in remote assets & sample PDF (re-fetch via “Tải PDF mẫu” / quick-add buttons)
- Save button composes images onto the PDF using `pdf-lib`
- Fully automated tests: Vitest for store logic, Playwright for end-to-end flow

## Setup

```bash
cd frontend
npm install
```

### Development server

```bash
npm run dev
```

Visit the printed URL (default `http://localhost:5173`). The sample PDF and sample images should load automatically; use the buttons if you want to re-fetch them.

### Tests

```bash
npm run lint          # ESLint
npm run test -- --run # Vitest
npx playwright test   # Playwright E2E
```

### Production build

```bash
npm run build
```

Artifacts land in `frontend/dist`. Use any static server (e.g., `npm run preview`) to inspect.

## Key Shortcuts

- Sidebar buttons “Ảnh mẫu nhanh” — inserts predefined remote signatures instantly.
- Footer “Lưu PDF” — always fixed; exports a new PDF containing all placed signatures.

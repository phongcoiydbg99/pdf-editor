## React PDF Editor Plan

### 1. Goals & Scope
- Build a browser-based PDF editor with React.
- Core flows: upload a PDF, drag thumbnails (images) from a left sidebar into the PDF, save the edited PDF.
- Target desktop browsers first; mobile support is nice-to-have.

### 2. Architecture Overview
- **Frontend stack**: React (with hooks), TypeScript, Vite (or CRA), Tailwind or CSS Modules for styling, Zustand/Recoil for lightweight state management.
- **PDF rendering**: `react-pdf` (PDF.js) to preview the uploaded file on the right panel.
- **Image handling**: store locally uploaded image blobs and render as thumbnails; use drag & drop to place them onto the PDF canvas.
- **PDF generation**: `pdf-lib` or `jspdf` to merge the edited canvas and export the final PDF.
- **File storage**: in-memory only; no backend initially.

### 3. UI Layout (Single Page)
- **Top bar**: branding + `Upload PDF` button.
- **Main split view**:
  - **Left sidebar (25%)**: vertical list of uploaded images with drag handles, plus a button to add more images.
  - **Right workspace (75%)**:
    - Upper area: live PDF preview with drop targets for images.
    - Lower area: `Save PDF` button and status messages.

### 4. Key Components
- `App`: orchestrates layout and providers (state store, DnD context).
- `PdfUploadButton`: accepts PDF file, parses into renderable pages.
- `ImageLibrary`: handles image uploads, displays draggable thumbnails.
- `PdfCanvas`: renders pages using `react-pdf`, supports drop zones, tracks placed image coordinates per page.
- `Toolbar`: houses actions like save/export, undo/redo (future).

### 5. State Model
- `pdfDocument`: metadata + array buffer of uploaded PDF.
- `pages`: list with dimensions for rendering scale.
- `images`: `{ id, src, width, height }`.
- `placements`: map keyed by page -> array of `{ imageId, x, y, scale }`.
- `ui`: upload status, drag state, save state, error messages.

### 6. User Flow
1. User uploads PDF → parse via `react-pdf` to display pages.
2. User uploads images → thumbnails appear in sidebar.
3. Drag image → drop onto a page → placement stored and rendered as overlay.
4. User hits `Save PDF` → compose placements onto PDF using `pdf-lib` → trigger download.

### 7. Implementation Steps
1. Bootstrap React project (`npm create vite@latest` with TypeScript).
2. Install dependencies: `react-pdf`, `pdf-lib`, `react-dnd`, `zustand`, styling library.
3. Implement layout skeleton with responsive CSS grid/flex.
4. Build PDF upload + preview using `react-pdf`.
5. Build image upload + thumbnail list.
6. Add drag & drop wiring with `react-dnd` between sidebar and PDF canvas.
7. Track and render placements atop pages using absolutely positioned elements.
8. Implement save/export via `pdf-lib` merging original PDF with image overlays.
9. Add basic error handling, loading states, save completion toast.
10. Polish UI: snapping, delete placement, multi-page support, persistent scale controls.

### 8. Future Enhancements
- Multi-user collaboration (backend sync).
- Text annotations, shape tools.
- History/undo-redo, keyboard shortcuts.
- Cloud storage integration (S3/GCS).

### 9. Testing & QA
- Component tests with React Testing Library for upload flows.
- Integration tests for drag/drop and export via Playwright.
- Manual QA on Chrome, Firefox, Safari.



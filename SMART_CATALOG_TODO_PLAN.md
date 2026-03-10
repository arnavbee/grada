# Smart Catalog Full Implementation Plan (Phased)

This document breaks down the Smart Catalog Feature Specification into actionable phases and TODO items.

## � Prerequisites / Starting Point
This plan **builds upon the existing catalog implementation**, which currently includes:
- [x] Clean UI with "Catalog" dashboard
- [x] "Add New Item" modal with form fields
- [x] Basic image upload area
- [x] Dropdown fields (Category, Style Name, Color, Fabric, Composition, Woven/Knits, etc.)
- [x] Table view showing all catalog items
- [x] Excel structure matching Styli format
- [x] Basic search and filter functionality

---

## �🚀 Phase 1: Core AI Automation (Week 1-2)
**Priority: CRITICAL | Impact: HIGH**

### 1.1: AI-Powered Image Analysis
- [x] Add real-time AI processing indicator to image upload section.
- [x] Create `POST /api/catalog/analyze-image` backend endpoint integrating AI vision analysis.
- [x] Implement auto-fill trigger to populate form fields with AI suggestions upon image upload.
- [x] Build "AI Suggestions Panel" to show confidence scores and allow bulk acceptance.
- [x] Store image hash for future ML learning loops.

### 1.2: Confidence Score Indicators
- [x] Add visual confidence badges (Green, Yellow, Red, Gray) to AI-populated form fields.
- [x] Build hover tooltip for confidence badges showing "Based on" and "Learned from" context.
- [x] Add `confidence` and `source` fields to the frontend state management.

### 1.3: Smart Style Code Generator
- [x] Add "Auto-Generate" button to Style No field.
- [x] Create `POST /api/catalog/generate-style-code` API endpoint.
- [ ] Implement pattern detection and generation (e.g., Brand + Category + Year + Serial). *(basic template-based generation is implemented; advanced pattern logic pending)*
- [x] Add duplicate checking against existing codes.
- [x] Support bulk pattern application for multi-item uploads.

### 1.4: Smart Defaults & Memory
- [x] Add "Remember Last Values" toggle at the top of the form.
- [x] Implement LocalStorage session memory to auto-populate fields based on recent entries.
- [ ] Add quick-fill buttons for common/average numeric values (e.g., PO Price, OSPS).
- [x] Build "Batch Apply" UI for common fields when processing bulk uploads.

---

## 🧠 Phase 2: Learning Loop (Week 2-3)
**Priority: HIGH | Impact: VERY HIGH**

### 2.1: User Correction Feedback System
- [x] Add inline feedback buttons (👍/👎) to AI-suggested fields.
- [x] Show prompt noting that manual overrides will "help AI learn."
- [x] Build detailed "Correction Modal" to capture context around why AI failed (e.g., "Image quality was poor").
- [x] Create `POST /api/catalog/log-correction` API endpoint.
- [x] Set up `ai_corrections` DB table and background queue for ML retraining.

### 2.2: Learning Progress Dashboard
- [x] Add new "AI Learning Progress" section to the Catalog view.
- [x] Display aggregate progress stats (Items Processed, Corrections Received, Time Saved).
- [x] Implement "Field Accuracy" bar charts using Chart.js or Recharts.
- [x] Summarize text-based insights ("What AI Has Learned").

### 2.3: Contextual Learning Suggestions
- [x] Build "Similar Items" visual helper displaying existing catalog items when AI confidence is low.
- [x] Add prompt to inherit values from visually similar matches.
- [x] Implement seasonal pattern detection/recommendations (e.g., suggesting "Fall Collection 2025" defaults).

---

## 🎨 Phase 3: Bulk & Batch Operations (Week 3)
**Priority: HIGH | Impact: HIGH**

### 3.1: Enhanced Bulk Upload
- [x] Replace basic bulk upload button with multi-image Drag & Drop UI.
- [x] Build "Common Settings" configurator allowing batch application of Brand, Composition, etc.
- [x] Create processing queue view showing real-time progress for each upload (Analyzing, In queue, Done).
- [x] Build a "Batch Review Interface" to filter, verify, edit, and approve items en masse before final save.

### 3.2: Batch Edit Operations
- [x] Add multi-select checkboxes to the main catalog table view.
- [x] Build "Batch Actions Dropdown" (Update Fabric, Duplicate, Export, Delete, etc.).
- [x] Implement Batch Edit Modal (Find and replace, replace all).
- [x] Create Price Adjustment Tool (percentage up/down, set exact, add fixed amount).

### 3.3: Templates & Collections
- [x] Create "Catalog Templates" database schema.
- [x] Build UI to create, edit, duplicate, and select templates (e.g., "Spring Collection 2026").
- [x] Enable defining default fields, restricted fabric/color pools, and expected style code patterns per template.

---

## 🔍 Phase 4: Quality Control & Validation (Week 3-4)
**Priority: MEDIUM | Impact: HIGH**

### 4.1: Pre-Export Quality Checks
- [ ] Build `POST /api/catalog/validate` endpoint.
- [ ] Create Validation Modal scanning the catalog for "Critical Issues" and "Warnings."
- [ ] Implement auto-fix algorithms (e.g., fill missings with defaults, auto-increment dupes).

### 4.2: Real-Time Field Validation
- [ ] Add inline validation on input blur/change matching against template standards.
- [ ] Highlight duplicate style codes dynamically.
- [ ] Warn on price outliers (e.g., >20% below average).
- [ ] Prompt user before saving anomalous data (e.g., fabric not in usual pool).

### 4.3: Anomaly Detection Agent
- [ ] Set up a background job processor to scan the DB for broader inconsistencies.
- [ ] Notify user to review unusual aggregate patterns (e.g., "All colors today are Black - Is this correct?").

---

## 📊 Phase 5: Analytics & Insights (Week 4)
**Priority: LOW | Impact: MEDIUM**

### 5.1: Catalog Analytics Dashboard
- [ ] Build a new "Analytics" tab providing a 30-day overview.
- [ ] Display Category Distribution and Price Analysis charts.
- [ ] Show aggregate time savings vs. manual entry estimated baseline.

### 5.2: Export History & Versioning
- [ ] Implement `catalog_versions` database tables to store snapshots.
- [ ] Add version dropdown history log.
- [ ] Build "Compare Versions" diff interface to highlight specific attribute changes across historical exports.

---

## 🎯 Phase 6: Advanced Intelligence (Week 5+)
**Priority: LOW | Impact: MEDIUM**

### 6.1: Tech Pack OCR Integration
- [ ] Add "Upload Tech Pack" PDF parsing capability to the item entry form.
- [x] Integrate OCR/measurement extraction pipeline in background jobs for tech-pack content.
- [ ] Create `POST /api/catalog/tech-pack-ocr` endpoint.

### 6.2: Marketplace-Specific Optimization
- [ ] Enable specific export formats (Styli, Myntra, Amazon, Ajio). *(Myntra/Amazon/Ajio plus additional marketplaces are implemented; Styli-specific format pending)*
- [ ] Use AI keyword injection to auto-expand basic style names into SEO-optimized marketplace titles.

### 6.3: Collaborative Features
- [ ] Show active user avatars to prevent collision tracking.
- [ ] Implement inline comment threads per catalog item.
- [ ] Build "Approval Workflow" states for managerial review before final marketplace sync.

# Design System Master File — Swiss International Typographic Style

> **STYLE:** `minimalism-and-swiss-style` (Swiss Style / 国际主义瑞士网格风格)  
> **TYPOGRAPHY:** `Inter` (Display & UI Sans) + `JetBrains Mono` (Index, Metrics & Tabular Data)

---

## Global Rules

### 1. Color Palette (Monochrome + Single Swiss Vermilion Accent)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Canvas Paper | `#F6F5F2` | `--swiss-bg` | Warm archival paper background |
| Surface Pure | `#FFFFFF` | `--swiss-surface` | Grid cell surface |
| Ink Primary | `#0A0A0A` | `--swiss-ink` | Primary typography, borders, active blocks |
| Ink Secondary | `#525252` | `--swiss-muted` | Captions, secondary descriptions |
| Grid Hairline | `#0A0A0A` | `--swiss-border-strong` | Structural grid frames (1px - 2px) |
| Sub-grid Line | `#D4D4D0` | `--swiss-border-subtle` | Internal row dividers |
| Swiss Accent Red | `#E61919` | `--swiss-red` | Single primary accent: CTAs, active markers, overdue alerts |
| Status Complete | `#0A0A0A` | `--swiss-done` | Solid black / inverted fill for completed states |

### 2. Core Swiss Design Principles
- **Zero Border Radius (`--border-radius: 0px`)**: Every card, button, badge, input, and progress bar uses sharp 90-degree geometric corners.
- **Exposed Mathematical Grid**: Layout is constructed with visible `1px solid` hairline borders and asymmetric 12-column divisions.
- **Index Numerals & Monospace Metadata**: Every module and section is prefixed with a tabular index (`01`, `02`, `03`...) in `JetBrains Mono`.
- **No Blur Shadows or Gradients**: Depth is achieved solely through typographic scale contrast, solid color inversion (`#0A0A0A` ↔ `#FFFFFF`), or crisp geometric offset (`3px 3px 0px #0A0A0A`).

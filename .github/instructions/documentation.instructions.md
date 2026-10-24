---
description: "Use when creating or updating Markdown documentation, architecture diagrams, AI context, or Copilot instructions in this project."
applyTo: "docs/**/*.md"
---

# Documentation conventions

- Document current, verified code behavior; label planned work and assumptions instead of presenting them as facts.
- Keep architecture docs focused on module boundaries and data flow. Use Mermaid for relationships or request-flow diagrams where helpful.
- Record durable technical decisions and current implementation state in `docs/ai-context/`; do not use it as an unmaintained task log.
- Link to source files with repository-relative links.
- Update existing documentation instead of creating duplicate descriptions.
- Keep project-wide agent rules concise in root `AGENTS.md`; put file-specific rules in `.github/instructions/`.

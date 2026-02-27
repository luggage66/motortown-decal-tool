---
name: implement-phase
description: Implements a single phase from PLAN.md for the MotorTown Decal Editor project.
disable-model-invocation: true
argument-hint: "[phase-number]"
---

You are implementing the MotorTown Decal Editor project phase by phase.

## Your Task

Implement **Phase $ARGUMENTS** from `PLAN.md`.

## Instructions

1. Read `PLAN.md` and `SPECIFICATION.md` to understand the full context and the specific phase to implement.
2. Read any existing source files that the phase builds on or modifies. Understand the current state of the codebase before writing code.
3. Implement every step listed under the target phase. Do not skip steps. Do not implement steps from other phases.
4. After implementing, verify your work:
   - Run `npm run build` (or the appropriate build command) and fix any type errors or build failures.
   - If the phase involves new components, make sure they are wired into the app (imported and rendered where appropriate).
   - If the phase involves the store, make sure actions are exported and used by the relevant components.
5. When finished, give a brief summary of what was implemented and what the next phase is.

## Guidelines

- Follow the tech stack from the spec: React + TypeScript, Adobe React Spectrum (dark theme), Zustand, react-colorful, file-saver.
- Use CSS modules for custom styling. Keep React Spectrum as the primary UI layer.
- Keep files focused and reasonably sized. Follow the file structure outlined in PLAN.md.
- Do not add features, tests, or tooling beyond what the phase specifies.
- Preserve full floating-point precision on numeric values (do not round).
- Write clean, minimal code. No over-engineering.

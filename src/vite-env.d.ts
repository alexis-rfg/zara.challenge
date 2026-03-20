// Standard Vite ambient declaration file.
// The triple-slash directive pulls in vite/client globally, augmenting ImportMeta
// with the env, hot, and glob properties that Vite exposes at build time.
// This file is included by tsconfig.app.json (via "include": ["src"]) and acts as
// a project-wide safety net on top of the explicit "types": ["vite/client"] entry
// in compilerOptions — ensuring import.meta.env is always typed regardless of
// which tsconfig is active.
/// <reference types="vite/client" />

# Create Project Step#1

`npx create-nx-workspace@latest`
```
✔ Where would you like to create your workspace? · basta
✔ Which starter do you want to use? · custom
✔ Which stack do you want to use? · angular
✔ Integrated monorepo, or standalone project? · integrated
✔ Application name · demo1
✔ Which bundler would you like to use? · esbuild
✔ Default stylesheet format · css
✔ Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? · No
✔ Which unit test runner would you like to use? · vitest-angular
✔ Test runner to use for end to end (E2E) tests · playwright
```

# Simplify ESlint (Step#2)
`nx generate @nx/eslint:convert-to-inferred`
-> you can now remove project specific lint
- [eslint.config.mjs](/eslint.config.mjs)

# Add Readme and AI support (Step#3)

## Coding Agent Introduction
- [CLAUDE.md](/CLAUDE.md): Claude Code
- [AGENTS.md](/AGENTS.md): Codex, Copilot, Gemini CLI

## MCP Server
- [.mcp.json](/.mcp.json): Sample for Claude Code

# Workspace Generators (Step#4)

"Write code that write code for you!"

`npx nx generate @sdc/workspace-plugin:domain --name=history --no-interactive`

`npx nx generate @sdc/workspace-plugin:library --domain=history --type=feature --no-interactive`
# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

## Project Overview

Add project information here.

**Tech Stack**: Angular 20, Nx, NgRx Signals, Vitest, Playwright

---

## MCP Tool Usage (ALWAYS USE FIRST)

**CRITICAL**: Always consult MCP tools before writing or reviewing code.

### Before ANY Angular Work

```
1. Call get_best_practices → Get current Angular standards
2. Call search_documentation → For API questions
3. Call find_examples → For modern patterns
```

### For Nx Questions

- `nx_workspace` → Workspace architecture
- `nx_project_details` → Project configuration
- `nx_docs` → Never assume Nx config, always check docs

---

## Code Review Checklist

Use this checklist when reviewing PRs or writing code.

### Component Review

| Check            | Rule                                                       |
| ---------------- | ---------------------------------------------------------- |
| Change Detection | `changeDetection: ChangeDetectionStrategy.OnPush` REQUIRED |
| Inputs/Outputs   | Use `input()` and `output()` functions, NOT decorators     |
| Injection        | Use `inject()` function, NOT constructor injection         |
| Control Flow     | Use `@if`, `@for`, `@switch`, NOT `*ngIf`, `*ngFor`        |
| Class Bindings   | Use `[class.x]`, NOT `ngClass`                             |
| Style Bindings   | Use `[style.x]`, NOT `ngStyle`                             |
| Host Bindings    | Use `host: {}` in decorator, NOT `@HostBinding`            |
| Private Members  | Use `#` prefix, NOT `private` keyword                      |
| Standalone       | Do NOT set `standalone: true` (default in v20+)            |

### Signal Store Review

| Check                 | Rule                                                               |
| --------------------- | ------------------------------------------------------------------ |
| Immutability          | Data NEVER mutated directly, only via store methods                |
| Single Responsibility | ALL transformations in store (computed/methods), NOT in components |
| DevTools              | `withTreeShakableDevTools` ALWAYS first feature                    |
| Error Handling        | Use `ToastService` + `parseError` for all errors                   |
| Loading States        | Track `isLoading` for ALL async operations                         |
| Optimistic Updates    | Update UI immediately, rollback on error                           |
| i18n                  | Use `$localize` for all user-facing messages                       |

### General Review

| Check         | Rule                                                              |
| ------------- | ----------------------------------------------------------------- |
| Typing        | No `any` type, use `unknown` if uncertain                         |
| File Names    | kebab-case (`my-component.ts`)                                    |
| Class Names   | PascalCase + suffix (`MyComponent`, `MyService`)                  |
| New Packages  | DO NOT add without team approval                                  |
| Linting Rules | NEVER ignore or disable; NEVER modify config without asking first |

---

## Coding Standards

### Modern Angular Component Pattern

```typescript
@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
      <div [class.active]="isActive()">{{ displayName() }}</div>
    }
    @for (item of items(); track item.id) {
      <div>{{ item.name }}</div>
    }
  `,
  host: {
    '[class.highlighted]': 'highlighted()',
    '(click)': 'onClick()',
  },
})
export class MyComponent {
  // Inputs (use input() function)
  readonly name = input.required<string>();
  readonly highlighted = input(false);

  // Outputs (use output() function)
  readonly clicked = output<void>();

  // Computed values (derived state)
  readonly displayName = computed(() => this.name().toUpperCase());
  readonly isActive = computed(() => this.name().length > 0);

  // Injection (use inject() function)
  readonly #myService = inject(MyService);

  // Methods
  onClick() {
    this.clicked.emit();
  }
}
```

### Naming Conventions

| Type               | Convention            | Example                     |
| ------------------ | --------------------- | --------------------------- |
| Files              | kebab-case            | `user-profile.component.ts` |
| Classes            | PascalCase            | `UserProfileComponent`      |
| Methods/Properties | camelCase             | `getUserName()`             |
| Constants          | UPPER_SNAKE_CASE      | `MAX_ITEMS`                 |
| Interfaces         | PascalCase + I prefix | `IUserProfile`              |
| Private Members    | # prefix              | `#myService`                |

---

## NgRx Signal Store Architecture

### Store Structure

```
libs/[domain]/domain-[name]/src/
├── _store/
│   ├── [name].store.ts                    # Main store
│   └── features/
│       ├── [name]-entity.store-feature.ts # Entity feature
│       └── [name]-state.feature.ts        # State feature
```

### Main Store Pattern

```typescript
import { signalStore } from '@ngrx/signals';
import { withTreeShakableDevTools } from '@sdc/shared/util-shared';

export const MyStore = signalStore(
  { providedIn: 'root' },
  withTreeShakableDevTools('MyStore'), // ALWAYS first
  withMyEntityFeature(),
  withMyStateFeature(),
);
```

### Feature Store Pattern

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { entityConfig, setAllEntities, removeEntity, withEntities } from '@ngrx/signals/entities';
import { ToastService } from '@siemens/ix-angular/standalone';
import { parseError } from '@sdc/shared/util-shared';
import { firstValueFrom } from 'rxjs';

type MyState = {
  isLoading: boolean;
  selectedId: string | undefined;
};

const initialState: MyState = {
  isLoading: false,
  selectedId: undefined,
};

const entityConfig = entityConfig({
  entity: type<MyEntity>(),
  collection: 'items',
  selectId: (e) => e.id,
});

export const withMyEntityFeature = () =>
  signalStoreFeature(
    withState(initialState),
    withEntities(entityConfig),

    // Computed - ALL data transformations here, NOT in components
    withComputed((store) => ({
      selectedItem: computed(() => store.itemsEntityMap()[store.selectedId() ?? '']),
      activeItems: computed(() => store.itemsEntities().filter((i) => i.isActive)),
      itemsCount: computed(() => store.itemsEntities().length),
    })),

    // Methods - ALL business logic here
    withMethods((store, api = inject(MyApiService), toasty = inject(ToastService)) => ({
      // Sync method
      selectItem(id: string) {
        patchState(store, { selectedId: id });
      },

      // Async with loading state
      async loadItems() {
        patchState(store, { isLoading: true });
        try {
          const { items } = await firstValueFrom(api.getItems());
          patchState(store, setAllEntities(items, entityConfig));
        } catch (error: unknown) {
          const parsed = parseError(error);
          await toasty.show({
            type: 'error',
            title: parsed.title ?? $localize`Error`,
            message: parsed.detail ?? $localize`Load failed`,
          });
        } finally {
          patchState(store, { isLoading: false });
        }
      },

      // Async with optimistic update
      async deleteItem(id: string) {
        const backup = store.itemsEntityMap()[id];
        patchState(store, removeEntity(id, entityConfig)); // Optimistic
        try {
          await firstValueFrom(api.deleteItem(id));
        } catch (error: unknown) {
          patchState(store, setEntity(backup, entityConfig)); // Rollback
          // Show error toast...
        }
      },
    })),
  );
```

### Store Architecture Principles

**1. Immutability**

- Store data NEVER mutated directly
- Only modify through store methods (load, update, delete)
- Components treat store data as read-only

**2. Single Responsibility**

- ALL transformations in store (computed/methods)
- Components ONLY read data and call methods
- NO filtering, mapping, or formatting in components

```typescript
// BAD - in component
get activeItems() {
  return this.store.items().filter(i => i.isActive);  // DON'T
}

// GOOD - in store
withComputed((store) => ({
  activeItems: computed(() => store.itemsEntities().filter(i => i.isActive)),
}))
```

### Entity Operations

```typescript
import { addEntity, addEntities, setEntity, setAllEntities, updateEntity, upsertEntity, upsertEntities, removeEntity, removeEntities, removeAllEntities } from '@ngrx/signals/entities';

patchState(store, setAllEntities(items, entityConfig));
patchState(store, updateEntity({ id, changes: { name: 'New' } }, entityConfig));
patchState(store, removeEntity(id, entityConfig));
```

---

## Library Structure

All libraries MUST be in `libs/` folder.

```
libs/[domain]/[library-name]/src/
├── _store/           # Signal Store (see patterns above)
├── feature/          # Smart components, services, models
├── ui/               # Presentational components
├── feature.routes.ts # Route definitions
└── index.ts          # Public API
```

---

## Pull Request Review Process

### 1. Access PR

```bash
gh pr view [PR_NUMBER] --repo github.siemens.cloud/sdc/siemens-data-cloud-frontend
```

### 2. Summarize Changes

```bash
gh pr comment [PR_NUMBER] --repo github.siemens.cloud/sdc/siemens-data-cloud-frontend --body "# 📊 PR Summary

## 🔄 Changes
- ✨ Change 1
- 🔧 Change 2

---
*Generated by [Claude Code](https://claude.ai/code)* 🤖"
```

### 3. Suggest Improvements

```bash
gh pr comment [PR_NUMBER] --repo github.siemens.cloud/sdc/siemens-data-cloud-frontend --body "# 🔍 Suggestions

## 💡 Category

\`\`\`typescript
// Current
code

// Suggested
improved code
\`\`\`

---
*Generated by [Claude Code](https://claude.ai/code)* 🤖"
```

---

## Internationalization (i18n)

### Templates

```html
<h1 i18n="@@welcomeHeader">Welcome</h1>
<p i18n="@@greeting">Hello, {{ username }}!</p>
<img i18n-alt="@@logoAlt" alt="Logo" />
```

### TypeScript

```typescript
const msg = $localize`:@@welcomeMessage:Welcome`;
const err = $localize`:@@fileNotFound:File ${fileName}:fileName: not found`;
```

### Setup Requirements for `$localize`

- **Build**: Libraries using `$localize` MUST have `"types": ["@angular/localize"]` in `tsconfig.lib.json`
- **Tests**: The `test-setup.ts` MUST include `import '@angular/localize/init';` to initialize `$localize` at runtime

### Best Practices

- Use `@@featureAction` pattern for IDs
- Use `$localize` in stores for error messages
- Never concatenate translated strings

---

<!-- nx configuration start-->

# Nx Guidelines

- Run tasks through `nx` (`nx run`, `nx run-many`, `nx affected`)
- Use `nx_workspace` for architecture understanding
- Use `nx_docs` for config questions - never assume
<!-- nx configuration end-->

<!-- angular configuration start-->

# Angular Guidelines

- **ALWAYS** call `get_best_practices` before writing/reviewing Angular code
- Use `search_documentation` for API questions
- Never assume patterns - verify with MCP tools
<!-- angular configuration end-->

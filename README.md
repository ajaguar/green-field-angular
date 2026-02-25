# Basta

## Library Structure

All libraries MUST be placed inside the `libs/` folder, organized by domain. Each library follows a domain-specific directory structure pattern organized by functionality types:

```typescript
libs/[domain]/[library-name]/src/
├── _store/                  # State management
│   ├── features/            # Store feature slices
│   └── [library-name].store.ts # State definition
├── components/              # Main components and smart components
│   └── [component-name]/    # Component folders with HTML, CSS, TS files
├── dialogs/                 # Dialog components
│   └── [dialog-name]/       # Dialog folders with HTML, CSS, TS files
├── services/                # Business logic services
│   └── [service-name]/      # Service folders with implementation and tests
├── util/                    # Utility functions and helpers
│   └── [utility-files].ts   # Pure utility functions
├── feature.routes.ts        # Route definitions (for feature libraries)
└── index.ts                 # Public API
```

### Domain Organization

Libraries are organized into domain-specific folders within `libs/`:

- **domain1/**: User and role management functionality
- **domain2/**: User and role management functionality
- **shared/**: Common utilities and shared components

### Key Directory Structure Concepts

1. **components/** - Contains main application components:
   - Smart components that handle business logic and data fetching
   - Feature-specific components with state management integration
   - Components organized in individual folders with HTML, CSS, and TypeScript files

2. **dialogs/** - Contains modal and dialog components:
   - Dialog components for user interactions (add, edit, delete operations)
   - Confirmation dialogs and forms
   - Each dialog in its own folder with complete component files

3. **services/** - Contains business logic and data access:
   - Services with HTTP calls and API integration
   - Business rule implementations
   - Data transformation and validation logic
   - Each service in its own folder with implementation and test files

4. **util/** - Contains utility functions and helpers:
   - Pure functions for data manipulation
   - Helper functions for common operations
   - Type definitions and constants
   - Shared utility logic across the library

5. **\_store/** - Contains state management logic:
   - NgRx Signal Store with feature-based architecture
   - Store feature slices organized in the `features/` subfolder
   - Main store composes multiple features
   - **Key Principles**:
     - **Immutability**: Never mutate store data directly, only through store methods
     - **Single Responsibility**: All data transformations belong in the store (computed/methods), NOT in components

```typescript
// Main store: libs/[domain]/domain-[name]/src/_store/[name].store.ts
import { signalStore } from '@ngrx/signals';
import { withTreeShakableDevTools } from '@sdc/shared/util-shared';
import { withMyEntityFeature } from './features/my-entity.store-feature';

export const MyStore = signalStore({ providedIn: 'root' }, withTreeShakableDevTools('MyStore'), withMyEntityFeature());
```

```typescript
// Feature: libs/[domain]/domain-[name]/src/_store/features/my-entity.store-feature.ts
import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withComputed, withMethods, withState } from '@ngrx/signals';
import { entityConfig, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { ToastService } from '@siemens/ix-angular/standalone';
import { parseError } from '@sdc/shared/util-shared';
import { firstValueFrom } from 'rxjs';

type MyState = { isLoading: boolean; selectedId: string | undefined };

const initialState: MyState = { isLoading: false, selectedId: undefined };

const entityConfig = entityConfig({
  entity: type<MyEntity>(),
  collection: 'items',
  selectId: (e) => e.id,
});

export const withMyEntityFeature = () =>
  signalStoreFeature(
    withState(initialState),
    withEntities(entityConfig),
    withComputed((store) => ({
      selectedItem: computed(() => store.itemsEntityMap()[store.selectedId() ?? '']),
      itemsCount: computed(() => store.itemsEntities().length),
    })),
    withMethods((store, api = inject(MyApiService), toasty = inject(ToastService)) => ({
      async loadItems() {
        patchState(store, { isLoading: true });
        try {
          const { items } = await firstValueFrom(api.getItems());
          patchState(store, setAllEntities(items, entityConfig));
        } catch (error: unknown) {
          const parsed = parseError(error);
          await toasty.show({ type: 'error', message: parsed.detail ?? $localize`Load failed` });
        } finally {
          patchState(store, { isLoading: false });
        }
      },
    })),
  );
```

6. **feature.routes.ts** - Defines routes for the feature:
   - Exports a `routes` constant that defines all routes
   - Implements lazy loading of components

### Testing Files

Each service and component must have an associated spec file for testing:

- Service spec files: `[service-name].service.spec.ts`
- Component spec files: `[component-name].component.spec.ts`

These spec files should be placed in the same directory as the file they're testing.

## Domain Architecture

The project follows a domain-driven architecture approach using Nx tags to enforce module boundaries and prevent unwanted dependencies between different domains.

### Visual Architecture Overview

This architecture illustrates our domain-driven approach with vertical slices organized by business domains and horizontal layers within each domain. The structure ensures separation of concerns while allowing controlled cross-domain communication.

### Domain Tags

Libraries are organized into domains using a tag-based system:

```typescript
// Example project.json
{
  "name": "my-capability",
  "tags": ["scope:feature", "domain:capability"]
}
```

### Available Scopes

- **`scope:app`** - Applications (e.g., sdc-console, sdc-landingpage)
- **`scope:feature`** - Feature libraries containing business logic
- **`scope:api`** - API layer libraries for domain-specific endpoints
- **`scope:shared`** - Shared utilities and components used across domains

### Available Domains

- **`domain:capability`** - Libraries related to capability management and execution
- **`domain:canvas`** - Libraries related to visual data flow and canvas functionality

### Dependency Rules

The module boundary rules are enforced via ESLint configuration:

1. **Apps** (`scope:app`) can only depend on `scope:shared` libraries
2. **Feature libraries** (`scope:feature`) can only depend on `scope:api` and `scope:shared` libraries
3. **Domain isolation**: Libraries within a domain can access other libraries from the same domain:
   - `domain:capability` + `scope:feature` can access other `domain:capability` libraries, `scope:api`, and `scope:shared`
   - `domain:canvas` + `scope:feature` can access other `domain:canvas` libraries, `scope:api`, and `scope:shared`
4. **Cross-domain dependencies are forbidden**: Libraries from different domains cannot depend on each other directly
5. **Shared libraries** (`scope:shared`) can only depend on other `scope:shared` libraries

### Domain Communication

When domains need to communicate with each other, they must use:

- **`scope:shared`** libraries for common utilities and components
- **`scope:api`** libraries for API communication
- Events or state management solutions in the shared layer

### Adding New Domains

When adding a new domain:

1. Create libraries with appropriate tags:

   ```json
   {
     "tags": ["scope:feature", "domain:your-new-domain"]
   }
   ```

2. Add the domain rule to `eslint.config.mjs`:

   ```javascript
   {
     allSourceTags: ['domain:your-new-domain', 'scope:feature'],
     onlyDependOnLibsWithTags: ['domain:your-new-domain', 'scope:api', 'scope:shared'],
   }
   ```

This architecture ensures clean separation of concerns and prevents tight coupling between different business domains.

## Shared Resources

**IMPORTANT**: Cross-referencing between feature libraries is strictly forbidden. For shared functionality across features, the shared library must be used.

The `libs/shared/` directory contains resources that can be used across the entire application:

1. **shared/ui** - Contains reusable dumb components:
   - Generic UI components that can be used in any feature
   - All components receive data via @Input properties
   - Components emit events via @Output properties
   - No state management
   - No application logic
   - No direct service dependencies or business logic

2. **shared/util** - Contains application-wide utility functions:
   - Helper functions and common utilities
   - Type definitions used across multiple features
   - Constants and configuration values

3. **shared/api** - Contains auto-generated API clients:
   - Auto-generated from OpenAPI specifications
   - Services for interacting with backend APIs
   - Models and interfaces representing API data structures
import { libraryGenerator, UnitTestRunner } from '@nx/angular/generators';
import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateJson,
} from '@nx/devkit';
import * as path from 'path';
import { LibraryGeneratorSchema } from './schema';

export async function domainLibraryGenerator(tree: Tree, schema: LibraryGeneratorSchema) {
  const name = schema.name ? `${schema.type}-${schema.name}` : `${schema.type}-${schema.domain}`;
  const projectRoot = `libs/${schema.domain}/${name}`;

  // Create Library
  await libraryGenerator(tree, {
    name,
    directory: projectRoot,
    buildable: true,
    linter: 'eslint',
    prefix: 'sdc',
    standalone: true,
    strict: true,
    style: 'css',
    unitTestRunner: UnitTestRunner.VitestAngular,
    changeDetection: 'OnPush',
    routing: schema.routing,
    tags: `domain:${schema.domain}, scope:${schema.type}`,
    importPath: `@sdc/${schema.domain}/${name}`,
  });

  // Modify files
  const { root, sourceRoot } = readProjectConfiguration(tree, name);
  const rootOffset = offsetFromRoot(root);

  // Modify test-setup.ts & vite.config.mts
  generateFiles(tree, path.join(__dirname, 'files/src'), `${sourceRoot}`, {
    ...schema,
    name,
    rootOffset,
  });

  // Move vite.config.mts
  tree.rename(`${sourceRoot}/vite.config.mts`, `${root}/vite.config.mts`);

  // Delete eslint.config.mjs
  tree.delete(`${root}/eslint.config.mjs`);

  // Modify tsconfig.lib
  updateJson(tree, joinPathFragments(root, 'tsconfig.lib.json'), (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions['types'] = ['@angular/localize'];
    return json;
  });

  // Modify package.json
  updateJson(tree, joinPathFragments(root, 'package.json'), (json) => {
    json.peerDependencies ??= {};
    delete json.peerDependencies['@angular/common'];
    json.peerDependencies['@angular/core'] = '*';
    return json;
  });

  // modify project.json
  updateJson(tree, joinPathFragments(root, 'project.json'), (json) => {
    delete json.targets.test;
    json.targets.test ??= {};
    json.targets.test['outputs'] = [
      '{projectRoot}/{options.coverage.reportsDirectory}',
      `{workspaceRoot}/coverage/libs/${schema.domain}/${name}`,
    ];
    json.targets.test['options'] = {
      'coverage.reportsDirectory': `../../../coverage/libs/${schema.domain}/${name}`,
    };
    delete json.targets.lint;
    json.targets.lint ??= {};
    json.targets.lint['inputs'] = [
      'default',
      '{workspaceRoot}/.eslintrc.json',
      '{workspaceRoot}/.eslintignore',
      '{workspaceRoot}/eslint.config.mjs',
      {
        externalDependencies: ['eslint'],
      },
    ];
    return json;
  });

  // Delete component if not a feature
  if (schema.type !== 'feature') {
    tree.delete(`${sourceRoot}/lib/`);
    tree.write(`${sourceRoot}/index.ts`, '');
  }

  // Move routes.ts
  if (schema.routing && schema.type === 'feature') {
    tree.rename(`${sourceRoot}/lib/lib.routes.ts`, `${sourceRoot}/feature.routes.ts`);
    tree.write(
      `${sourceRoot}/feature.routes.ts`,
      `import { Route } from '@angular/router';\n\n export const routes: Route[] = [{ path: '', loadComponent: () => import('./lib/${name}/${name}.component').then((c) => c.${names(name).className}Component) }];`,
    );
    tree.write(`${sourceRoot}/index.ts`, `export * from './feature.routes';\n`);
  }

  await formatFiles(tree);
}

export default domainLibraryGenerator;

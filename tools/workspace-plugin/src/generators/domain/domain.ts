import { formatFiles, Tree } from '@nx/devkit';
import * as ts from 'typescript';
import { DomainGeneratorSchema } from './schema';

const LIBRARY_GENERATOR_SCHEMA = 'tools/workspace-plugin/src/generators/library/schema.json';
const ESLINT_CONFIG = 'eslint.config.mjs';

function updateLibrarySchema(tree: Tree, domainName: string) {
  const schemaContent = tree.read(LIBRARY_GENERATOR_SCHEMA, 'utf-8');
  const schema = JSON.parse(schemaContent);
  const domainProp = schema.properties.domain;

  if (domainProp.enum.includes(domainName)) {
    throw new Error(`Domain '${domainName}' already exists in ${LIBRARY_GENERATOR_SCHEMA}.`);
  }

  domainProp.enum.push(domainName);
  domainProp.enum.sort();

  domainProp.pattern = domainProp.enum.join('|');

  if (domainProp['x-prompt'] && Array.isArray(domainProp['x-prompt'].items)) {
    domainProp['x-prompt'].items.push({ value: domainName, label: domainName });
    domainProp['x-prompt'].items.sort((a, b) => a.label.localeCompare(b.label));
  }

  tree.write(LIBRARY_GENERATOR_SCHEMA, JSON.stringify(schema, null, 2));
}

function updateEslintConfig(tree: Tree, domainName: string) {
  const fileContent = tree.read(ESLINT_CONFIG, 'utf-8');
  const sourceFile = ts.createSourceFile(ESLINT_CONFIG, fileContent, ts.ScriptTarget.Latest, true);

  let depConstraintsNode: ts.ArrayLiteralExpression | null = null;
  let lastDomainRuleNode: ts.ObjectLiteralExpression | null = null;

  function findDepConstraints(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'depConstraints') {
      if (ts.isArrayLiteralExpression(node.initializer)) {
        depConstraintsNode = node.initializer;
      }
    }
    ts.forEachChild(node, findDepConstraints);
  }

  findDepConstraints(sourceFile);

  for (const element of depConstraintsNode.elements) {
    if (ts.isObjectLiteralExpression(element)) {
      for (const prop of element.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          prop.name.getText(sourceFile) === 'sourceTag' &&
          ts.isStringLiteral(prop.initializer)
        ) {
          const tagValue = prop.initializer.text;
          if (tagValue === `domain:${domainName}`) {
            throw new Error(`Domain '${domainName}' already has a dependency constraint in ${ESLINT_CONFIG}.`);
          }
          if (tagValue.startsWith('domain:')) {
            lastDomainRuleNode = element;
          }
        }
      }
    }
  }

  const newRuleText = `
            {
              sourceTag: 'domain:${domainName}',
              onlyDependOnLibsWithTags: ['domain:${domainName}', 'domain:shared', 'domain:backend', 'scope:api']
            }`;

  let insertionPosition: number;
  let textToInsert: string;

  if (lastDomainRuleNode) {
    insertionPosition = lastDomainRuleNode.getEnd();
    textToInsert = ',' + newRuleText;
  } else {
    insertionPosition = depConstraintsNode.getEnd() - 1;
    if (depConstraintsNode.elements.length > 0 && !depConstraintsNode.elements.hasTrailingComma) {
      textToInsert = ',' + newRuleText;
    } else {
      textToInsert = newRuleText;
    }
  }

  const newFileContent = fileContent.slice(0, insertionPosition) + textToInsert + fileContent.slice(insertionPosition);

  tree.write(ESLINT_CONFIG, newFileContent);
}

export default async function (tree: Tree, schema: DomainGeneratorSchema) {
  updateLibrarySchema(tree, schema.name);
  updateEslintConfig(tree, schema.name);
  await formatFiles(tree);
}

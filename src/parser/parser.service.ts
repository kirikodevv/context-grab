import * as parser from '@babel/parser';

import babel from '@babel/core';
import generate from '@babel/generator';

import fs from 'fs';

import traverse, { Node, NodePath } from '@babel/traverse';
import { OutputResults, ParserOptions } from '../types';
import { Project } from '../services/project.service';
import { defaultOptions } from '../config';
import { aliasName } from '../utils';
import { EntityData } from './entity.class';

export default class Parser extends Project {
  methods: OutputResults = {};

  private functions: EntityData[] = [];

  constructor(path: string, functionName: string, options: ParserOptions) {
    super();
    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.functions.push({
      path,
      name: functionName,
      alias: aliasName(functionName, path),
      depth: 1,
    });
  }

  getContext() {
    while (this.functions.length) {
      const func = this.functions.shift();

      try {
        if (!this.methods[func.alias]) {
          this.debug('Executing', func.name);

          // Dont dig on classes
          if (['classes' || 'imports'].includes(func.type)) {
            continue;
          }

          const references = this.getFunction(func);

          // Insert new references
          if (references?.length) {
            this.functions.push(
              ...references
                .map((ref) => ({
                  ...ref,
                  depth: ref.path === func.path ? func.depth : func.depth + 1,
                }))
                .filter((o) => !this.methods[o.alias] && o.depth <= this.options.depth),
            );
          }
        }
      } catch (e) {
        this.error(e);
        this.error('Failed to resolve one or more functions');
      }
    }

    this.getContainerContents();
    return this.outputResults(this.methods);
  }

  getFunction(func: EntityData) {
    const { code, ast } = this.getAbstractSyntaxTree(func.path);

    const newReferences = [];
    let type = func.type || 'functions';

    const handleResult = (
      path,
      value: string,
      hasContainers: boolean = false,
    ) => {
      if (value) {
        this.methods[func.alias] = new EntityData({
          ...func,
          contents: value,
          type,
        });

        this.getPathImports(func.path);

        newReferences.push(
          ...this.getFunctionReferrers(func, path).filter((o) => {
            return !!o.path;
          }),
        );

        if (hasContainers) {
          const container = this.findContainer(path, func);

          this.methods[container.alias] ??= new EntityData({
            ...container,
            type: 'classes',
          });
          this.methods[container.alias].contains.add(func.alias);
        }
      }
    };

    const getNodeCode = (node: Node, type: string, name: string) => {
      if (!type || !name) {
        return '';
      }

      if (type === 'Identifier' && name === func.name) {
        return `${this.extractComments(node)}${generate(node).code}`;
      }
      return ``;
    };

    traverse(ast, {
      ClassMethod: (path) => {
        handleResult(
          path,
          getNodeCode(path.node, path.node.key?.type, path.node.key?.['name']),
          true,
        );
      },
      FunctionDeclaration: (path) => {
        handleResult(
          path,
          getNodeCode(path.node, path.node.id?.type, path.node.id?.['name']),
        );
      },
      FunctionExpression: (path) => {
        handleResult(
          path,
          getNodeCode(path.node, path.node.id?.type, path.node.id?.['name']),
        );
      },
      ArrowFunctionExpression: (path) => {
        let contents = '';

        if (
          path.parent.type === 'VariableDeclarator' &&
          path.parentPath.parent.type === 'VariableDeclaration'
        ) {
          if (
            path.parent.id.type === 'Identifier' &&
            path.parent.id.name === func.name
          ) {
            const declarationNode = path.parentPath.parent;
            contents = code.substring(
              declarationNode.start!,
              declarationNode.end!,
            );

            contents = this.extractComments(declarationNode) + contents;
          }
        }

        handleResult(path, contents);
      },
      TSTypeAliasDeclaration: (path) => {
        if (path.node.id.name === func.name) {
          handleResult(path, generate(path.node).code);
          type = 'types';
        }
      },
      TSInterfaceDeclaration: (path) => {
        if (path.node.id.name === func.name) {
          console.log('Found a interface', func.name);
          handleResult(path, generate(path.node).code);
          type = 'types';
        }
      },
    });

    return newReferences;
  }

  findContainer(path: NodePath, func: EntityData): EntityData {
    let parent = path.findParent(
      (p) => p.isClassDeclaration() || p.isFunctionDeclaration(),
    );
    if (parent) {
      const node = parent.node;
      const name =
        node.type === 'ClassDeclaration'
          ? node.id.name
          : node['id']?.name || 'anonymous';

      return {
        path: func.path,
        alias: aliasName(name, func.path),
        name,
      };
    }
    return null;
  }

  getPathImports(basePath: string) {
    const code = fs.readFileSync(basePath, 'utf-8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: this.parserPlugins,
    });

    const imports: Record<string, string> = {};
    traverse(ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        path.node.specifiers.forEach((specifier) => {
          if (
            ['ImportSpecifier', 'ImportDefaultSpecifier'].includes(
              specifier.type,
            )
          ) {
            const name = specifier.local.name;
            const fullImportString = code.slice(path.node.start, path.node.end);
            const pathname = this.resolveImportPath(source, basePath);

            this.methods[name] = new EntityData({
              path: pathname,
              name,
              contents: `${this.extractComments(specifier)}${fullImportString}`,
              alias: aliasName(name, pathname),
              type: 'imports',
            });
          }
        });
      },
    });

    return imports;
  }

  getFunctionReferrers(func: EntityData, path, imports = {}) {
    const referTo: EntityData[] = [];

    const findImport = (name: string) => {
      return this.methods[name]?.path;
    };

    path.traverse({
      TSTypeReference: (callPath: NodePath<babel.types.TSTypeReference>) => {
        if (callPath.node.typeName.type === 'Identifier') {
          const objectName = generate(callPath.node).code;
          const importPath = findImport(objectName);
          const path = importPath || func.path;

          referTo.push({
            path,
            name: callPath.node.typeName.name,
            alias: aliasName(callPath.node.typeName.name, path),
            type: 'types',
          });
        }
      },
      CallExpression: (callPath) => {
        const callee = callPath.node.callee;
        if (callee.type === 'MemberExpression') {
          const objectName = generate(callee.object).code;
          const propertyName = generate(callee.property).code;
          const importPath = findImport(objectName);
          const path = importPath || func.path;

          referTo.push({
            path,
            name: `${propertyName}`,
            alias: aliasName(propertyName, path),
            type: 'functions',
          });
        } else if (callee.type === 'Identifier') {
          const path = findImport(callee.name) || func.path;

          referTo.push({
            path,
            name: callee.name,
            alias: aliasName(callee.name, path),
            type: 'functions',
          });
        }
      },
    });

    return referTo;
  }

  getContainerContents() {
    const containers = Object.keys(this.methods)
      .map((o) => this.methods[o])
      .filter((o) => o.type === 'classes');

    for (const container of containers) {
      const { ast } = this.getAbstractSyntaxTree(container.path);

      traverse(ast, {
        ClassDeclaration: (path) => {
          if (path.node.id.name === container.name) {
            container.contents = `class ${container.name}`;
          }
        },
        VariableDeclaration: (path) => {
          // I think this is for react code i.e const x = () => {}
          const declaration = path.node.declarations[0];
          if (declaration.id['name'] === container.name) {
            container.contents = generate(path.node).code;
          }
        },
      });
    }
  }
}

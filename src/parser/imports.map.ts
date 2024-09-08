import { EntityData } from "./entity.class";

export const createImportSection = (importList: EntityData[]) => {
  const set = new Set([]);

  const data: Record<string, {defaults: string[], regular: string[]}> = {

  }

  for (const i of importList) {
    const defaults = extractDefaultImports(i.contents)
    const regular = extractImportNames(i.contents)
    const extractPath = extractImportPath(i.contents)

    data[extractPath] ??= {defaults: [], regular: []};

    data[extractPath].defaults.push(...defaults)
    data[extractPath].regular.push(...regular)
  }

  for (const path in data) {
    const {regular, defaults} = data[path]

    const reg = regular.length ? `{ ${Array.from(new Set(regular)).join(', ')} }` : ''
    const def = defaults.length ? (Array.from(new Set(defaults)).join(', ') + (regular.length ? "," : "") + " ") : ""

    set.add(
      `import ${def}${reg} from "${path}"`
    )
  }

  return Array.from(set)
};

function extractDefaultImports(importStatement: string): string[] {
  const match = importStatement.match(/import\s+(\w+)/);
  return match ? [match[1]] : [];
}

function extractImportNames(importStatement: string): string[] {
  const match = importStatement.match(/{([^}]+)}/);
  return match ? match[1].split(',').map((name) => name.trim()) : [];
}

function extractImportPath(importStatement: string): string {
  const match = importStatement.match(/from\s+['"]([^'"]+)['"]/);
  return match ? match[1] : '';
}

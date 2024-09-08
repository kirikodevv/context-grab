import { OutputResults, ParserOptions } from "../types";
import path from "path";
import fs from "fs";
import { extensionOptions } from "../config";
import * as parser from "@babel/parser";
import { ParserPlugin } from "@babel/parser";
import babel from "@babel/core";
import prettier from "prettier";
import { Node } from "@babel/traverse";
import { copyToClipboard } from "../os/clipboard";

export class Project {
  options: ParserOptions;
  parserPlugins: ParserPlugin[] = ["decorators"];

  error(...args) {
    console.log(...args);
  }

  debug(...args) {
    if (this.options.isDebug) {
      console.log(...args);
    }
  }

  getAbstractSyntaxTree(path: string): { code: string; ast: babel.types.File } {
    const code = fs.readFileSync(path, "utf-8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: this.parserPlugins,
    });

    return {
      ast,
      code,
    };
  }

  resolveImportPath(relativePath: string, currentFilePath: string): string {
    const { aliasConfig, root, type } = this.options;
    const isTs = type === "typescript";
    // Check if it's an alias path
    const aliasMatch = Object.keys(aliasConfig).find((alias) => {
      const start = relativePath.split("/")[0];
      return start === alias;
    });

    let absolutePath = "";

    // Check if its an aliased location, if so extract absolute path from alias
    if (aliasMatch) {
      const aliasPath = aliasConfig[aliasMatch];
      const restOfPath = relativePath.slice(aliasMatch.length);
      absolutePath = path.join(root, aliasPath, restOfPath);
    } else {
      // Otherwise, get absolute path from the path itself
      absolutePath = path.resolve(path.dirname(currentFilePath), relativePath);
    }

    let freezePath = absolutePath;

    // Start by favoring fetch by extension
    for (const ext of extensionOptions[isTs ? "ts" : "js"]) {
      const extensionPath = `${absolutePath}.${ext}`;

      if (fs.existsSync(extensionPath)) {
        return extensionPath;
      }
    }

    // If there was no extension match, see if an index file exists
    for (const ext of extensionOptions[isTs ? "ts" : "js"]) {
      const extensionPath = `${absolutePath}/index.${ext}`;

      if (fs.existsSync(extensionPath)) {
        return extensionPath;
      }
    }

    // Lastly, if none of the above, is the file just there?
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    // If still not found, don't bother trying to go deeper on this one. Just set no path
    if (relativePath.includes("./") || relativePath.includes("@")) {
      this.debug(`Could not resolve import path: ${relativePath}`, freezePath);
    }
    return null;
  }

  extractComments(node: Node) {
    const comments = node.leadingComments || node.trailingComments;
    if (comments) {
      return `/*${comments.map((c) => c.value).join("\n")}*/\n`;
    }

    return "";
  }

  outputResults(results: OutputResults) {
    const data = Object.keys(results)
      .map((o) => results[o])
      .filter((o) => !!o.contents)
      .sort((a, b) => (a.path > b.path ? 1 : -1));

    const functionList = data.filter((o) => o.type === "functions");
    const containerList = data.filter((o) => o.type === "classes");
    const importList = data.filter((o) => o.type === "imports");
    const typeList = data.filter((o) => o.type === "types");

    const entry: string[] = [];

    const appendImports = () => {
      // add import list
      if (this.options.includeImports) {
        entry.push(`${importList.map((o) => o.contents).join("\n")}\n\n`);
      }
    };

    const appendClasses = () => {
      for (const container of containerList) {
        // add the opening container
        entry.push(`//${container.fileName}\n${container.contents} {\n`);

        // add relevant functions
        for (const func of container.contains) {
          const contents = results[func].contents;
          entry.push(`\n ${contents}`);
        }

        // close out the file
        entry.push(`\n } \n\n`);
      }
    };

    const appendTypes = () => {
      appendAction(typeList);
    };

    const appendFunctions = () => {
      appendAction(functionList);
    };

    const appendAction = (list: any[]) => {
      // write any isolated functions at the bottom
      let lastFileName = "";
      for (const func of list) {
        const isPartOfContainer = containerList.find((container) => {
          return container.contains.has(func.alias);
        });

        if (!isPartOfContainer) {
          let spacing = "\n";
          if (lastFileName !== func.fileName) {
            entry.push(
              `${
                lastFileName === "" ? "" : "//======================"
              }\n\n\n//${func.fileName}\n`,
            );
            lastFileName = func.fileName;
            spacing = "";
          }
          entry.push(`${spacing}${func.contents} \n`);
        }
      }

      if (lastFileName) {
        entry.push("//======================\n\n\n\n");
      }
    };

    for (const order of this.options.order) {
      if (order === "imports") {
        appendImports();
      } else if (order === "types") {
        appendTypes();
      } else if (order === "classes") {
        appendClasses();
      } else if (order === "functions") {
        appendFunctions();
      }
    }

    const filePath = `${this.options.root}/grab.${
      this.options.type === "typescript" ? "ts" : "js"
    }`;
    fs.writeFileSync(filePath, entry.join(""), { flag: "w" });
    return this.applyPrettierToFile(filePath).then(() => {
      const contents = fs.readFileSync(filePath, "utf-8"); // Read file contents after prettified
      copyToClipboard(contents);
      if (!this.options.file) {
        fs.unlinkSync(filePath);
      }
    });
  }

  async applyPrettierToFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf-8");
    const formatted = await prettier.format(content, {
      singleQuote: true,
      trailingComma: "all",
      endOfLine: "lf",
      ...this.options.prettier,
      filepath: filePath,
    });
    fs.writeFileSync(filePath, formatted);
  }
}

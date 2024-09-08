import path from "path";
import fs from "fs";
import { ParserOptions } from "../types";

type Args = {
  pathname: string;
  functionName: string;
  args: ParserOptions;
};

export const extractArgs = (): Args => {
  const [, , basePath, filePath, functionName] = process.argv;

  if (!basePath || !functionName || !filePath) {
    console.error("Usage: yarn start <basePath> <filePath> <functionName>");
    process.exit(1);
  }

  const pathname = path.join(basePath, filePath);

  if (!fs.existsSync(pathname)) {
    console.error("Invalid path", pathname);
    process.exit(1);
  }

  let config: any = {};
  try {
    config = JSON.parse(
      fs.readFileSync(path.join(basePath, "grab.json"), "utf-8") ?? "{}",
    ); // Read file contents
  } catch (e) {}

  config ??= {};

  return {
    pathname,
    functionName,
    args: {
      ...config,
      root: basePath,
    },
  };
};

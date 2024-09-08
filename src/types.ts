import { EntityData } from "./parser/entity.class";
import { RequiredOptions } from "prettier";

export type ParserOptions = {
  type: 'typescript' | 'javascript';
  aliasConfig?: Record<string, string>;
  root?: string;
  isDebug?: boolean;
  includeImports?: boolean;
  order?: [EntryType, EntryType, EntryType, EntryType];
  file?: boolean;
  prettier?: Partial<RequiredOptions>;
  depth: number;
};

export type EntryType = "types" | "classes" | "functions" | "imports";

export type OutputResults = Record<string, EntityData>;

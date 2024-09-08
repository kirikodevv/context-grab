import { ParserOptions } from './types';

export const extensionOptions = {
  ts: ['ts', 'tsx'],
  js: ['jsx', 'js'],
};

export const defaultOptions: ParserOptions = {
  isDebug: false,
  includeImports: true,
  order: ['imports', 'types', 'classes', 'functions'],
  prettier: {},
  aliasConfig: {},
  depth: 3,
  file: true
};

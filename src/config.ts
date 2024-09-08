import { ParserOptions } from './types';

export const extensionOptions = {
  ts: ['ts', 'tsx'],
  js: ['jsx', 'js'],
};

export const defaultOptions: ParserOptions = {
  type: 'typescript',
  isDebug: false,
  isSilent: false,
  isInfo: false,
  includeImports: true,
  order: ['imports', 'types', 'classes', 'functions'],
  prettier: {},
  depth: 3
};

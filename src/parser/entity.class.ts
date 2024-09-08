import {EntryType} from "../types";
import {getFilename} from "../utils";

export class EntityData {
  path: string;
  name: string;
  alias: string;
  contents?: string;
  fileName?: string;
  contains?: Set<string>;
  type?: EntryType;
  depth?: number;

  constructor(props: EntityData) {
    this.contains = new Set([]);
    this.type = 'functions';
    for (const key in props) {
      this[key] = props[key]
    }

    if (!this.fileName && this.path) {
      this.fileName = getFilename(this.path)
    }
  }
}

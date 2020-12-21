import Config from "./base.ts";

import Parser from "../parser/parser.ts";
import Storage from "../storage.ts";

import Component from "../component.ts";

import { walk } from "https://deno.land/std@0.80.0/fs/mod.ts";

import { OptionsInterface } from "../../lib/types.ts";

Config.prototype.config = async function (options: OptionsInterface) {
  try {
    let vue;
    const { entry, label } = options;

    if (!entry) {
      throw "an entry path is required inside of your config method";
    }
    if (!label) {
      throw "a label is required to identify the root of your application";
    }

    const ready = await this.walk(entry, label);

    if (!ready) {
      throw "an error occured building out the queue";
    }

    const { root } = this;
    options.vue ? { vue } = options : null;

    const children = Object.values(Storage);

    const read = new (Parser as any)(root, [root, ...children], vue && vue);
    const bundled = await read.parse();

    if (bundled) return true;
  } catch (error) {
    return console.error("Error inside of Config.config", { error });
  }
};

Config.prototype.walk = async function (entry: string, id: string) {
  for await (const file of walk(`${entry}`, { exts: ["vue"] })) {
    const { path } = file;

    if (path.includes(id)) this.root = new (Component as any)(id, path);
    else {
      const regex: RegExp = new RegExp(/\/(?<label>\w*)(\.vue)$/);
      const label: string | undefined = path.match(regex)?.groups?.label;
      if (label) Storage[label] = new (Component as any)(label, path);
    }
  }
  if (this.root) return true;
};

export default Config;

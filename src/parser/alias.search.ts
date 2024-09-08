import path from "path";
import fs from "fs";

export const findAliases = (root: string) => {
  const configFiles = [
    "tsconfig.json",
    "tsconfig.app.json",
    "package.json",
    "vite.config.js",
    "webpack.config.js",
    "webpack.config.ts",
    "jest.config.js",
    "jest.config.ts",
    ".babelrc",
    "babel.config.js",
  ];

  const cleanAlias = (alias: any) => {
    const cleanedAlias: { [key: string]: string } = {};
    for (const key in alias) {
      const newKey = key.replace(/\/\*$/, "");
      cleanedAlias[newKey] = Array.isArray(alias[key])
        ? alias[key][0].replace(/\/\*$/, "")
        : alias[key].replace(/\/\*$/, "");
    }
    return cleanedAlias;
  };

  const search = () => {
    for (const configFile of configFiles) {
      const configPath = path.join(root, configFile);
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

        if (configFile.includes("tsconfig")) {
          if (config.compilerOptions && config.compilerOptions.paths) {
            return config.compilerOptions.paths;
          }
        } else if (configFile === "package.json") {
          if (config._moduleAliases) {
            return config._moduleAliases;
          }
        } else if (configFile === "vite.config.js") {
          const viteConfig = require(configPath);
          if (viteConfig.resolve && viteConfig.resolve.alias) {
            return viteConfig.resolve.alias;
          }
        } else if (configFile.includes("webpack.config")) {
          const webpackConfig = require(configPath);
          if (webpackConfig.resolve && webpackConfig.resolve.alias) {
            return webpackConfig.resolve.alias;
          }
        } else if (configFile.includes("jest.config")) {
          const jestConfig = require(configPath);
          if (jestConfig.moduleNameMapper) {
            return jestConfig.moduleNameMapper;
          }
        } else if (configFile.includes("babel")) {
          if (config.plugins) {
            for (const plugin of config.plugins) {
              if (Array.isArray(plugin) && plugin[0] === "module-resolver") {
                return plugin[1].alias;
              }
            }
          }
        }
      }
    }
  }

  const aliases = search();
  if (aliases) {
    return cleanAlias(aliases)
  }

  return null;
};

import {execSync} from "child_process";

export const copyToClipboard = (text: string) => {
  const { execSync } = require('child_process');

  const platform = process.platform;

  if (platform === 'darwin') {
    execSync(`echo "${text}" | pbcopy`);
  } else if (platform === 'win32') {
    execSync(`echo ${text} | clip`);
  } else {
    execSync(`echo "${text}" | xclip -selection clipboard`);
  }
};

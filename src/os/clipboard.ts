export const copyToClipboard = (text: string) => {
  try {
    const {execSync} = require('child_process');
    const escapedText = text.replace(/'/g, "'\\''");

    if (process.platform === 'darwin') {
      execSync(`echo '${escapedText}' | pbcopy`);
    } else if (process.platform === 'win32') {
      execSync(`echo ${escapedText} | clip`);
    } else {
      execSync(`echo '${escapedText}' | xclip -selection clipboard`);
    }
  } catch (e) {
    console.log('Clipboard Failed', e);
  }
};

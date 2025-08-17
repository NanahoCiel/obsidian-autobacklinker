import { Plugin, Notice } from "obsidian";

export default class AutoBacklinker extends Plugin {
  async onload() {
    this.addCommand({
      id: "autobacklink-current-file",
      name: "AutoBacklink: Link matching words in current file",
      callback: () => this.autoLinkCurrentFile()
    });
  }

  async autoLinkCurrentFile() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("No active file.");
      return;
    }

    const titles = this.app.vault.getMarkdownFiles()
      .map(f => f.basename)
      .sort((a, b) => b.length - a.length); 

    let content = await this.app.vault.read(file);

    for (const title of titles) {
      const regex = new RegExp(`(?<!\\[\\[)\\b(${title})\\b(?!\\]\\])`, "g");
      content = content.replace(regex, "[[$1]]");
    }

    await this.app.vault.modify(file, content);
    new Notice("🔗 auto link complete!");
  }
}

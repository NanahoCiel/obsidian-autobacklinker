import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    TAbstractFile
} from "obsidian";

/* ========== 기본 설정 ========== */
interface AutoBacklinkerSettings {
    allowKoreanParticles: boolean;
    lastRunISO: string | null;
    autoLinkOnSave: boolean;
    batchSize: number;
    excludeFolders: string;
}

const DEFAULT_SETTINGS: AutoBacklinkerSettings = {
    allowKoreanParticles: true,
    lastRunISO: null,
    autoLinkOnSave: false,
    batchSize: 50,
    excludeFolders: ""
};

const PARTICLES = "의|이|가|은|는|을|를|에|에서|에게|께|으로|로|와|과|도|만|뿐|까지|부터|보다|처럼|마다|씩|조차|마저|라도|께서";

const isAsciiOnly = (s: string) => /^[\x00-\x7F]+$/.test(s);
const hasHangul = (s: string) => /[\u3131-\u318E\uAC00-\uD7A3]/.test(s);

const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/* 마스킹: [[링크]]는 잠시 보호 */
const MOPEN = "\uE000", MCLOSE = "\uE001";
function mask(input: string) {
    const slots: string[] = [];
    const masked = input.replace(/\[\[[\s\S]*?\]\]/g, (m) => `${MOPEN}${slots.push(m) - 1}${MCLOSE}`);
    return { masked, slots };
}
const unmask = (masked: string, slots: string[]) =>
    masked.replace(new RegExp(`${MOPEN}(\\d+)${MCLOSE}`, "g"), (_m, n) => slots[+n]);

/* ========== 플러그인 본체 ========== */
export default class AutoBacklinker extends Plugin {
    settings: AutoBacklinkerSettings = { ...DEFAULT_SETTINGS };

    titleSet: Set<string> = new Set();
    excludedRoots: string[] = [];
    inFlight: Set<string> = new Set();
    statusBarEl: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.computeExcludedRoots();
        this.rebuildTitleIndex();

        // 파일 시스템 이벤트
        this.registerEvent(this.app.vault.on("create", (f) => this.onFSChange(f)));
        this.registerEvent(this.app.vault.on("delete", (f) => this.onFSChange(f)));
        this.registerEvent(this.app.vault.on("rename", () => this.rebuildTitleIndex()));

        // 저장시 자동 링크
        this.registerEvent(this.app.vault.on("modify", async (f) => {
            if (!this.settings.autoLinkOnSave) return;
            if (!(f instanceof TFile) || !this.isMd(f) || this.isExcluded(f)) return;

            const key = f.path;
            if (this.inFlight.has(key)) return;

            try {
                this.inFlight.add(key);
                await this.linkNote(f);
            } finally {
                this.inFlight.delete(key);
            }
        }));

        // 리본 버튼
        const icon = this.addRibbonIcon("link", "Toggle AutoBacklinker (auto mode)", () => this.toggleAutoMode());
        icon.addClass("ab-ribbon");

        // 상태바 표시
        this.statusBarEl = this.addStatusBarItem();
        this.updateStatusBar();

        // 명령어 등록
        this.addCommand({
            id: "ab-toggle-auto",
            name: "AutoBacklinker: Toggle auto mode (on-save)",
            callback: () => this.toggleAutoMode()
        });
        this.addCommand({
            id: "ab-rebuild-index",
            name: "AutoBacklinker: Rebuild title index",
            callback: () => { this.rebuildTitleIndex(); new Notice("🔄 Title index rebuilt."); }
        });
        this.addCommand({
            id: "ab-current",
            name: "AutoBacklinker: Process current note (one-off)",
            callback: () => this.processCurrent()
        });
        this.addCommand({
            id: "ab-incremental",
            name: "AutoBacklinker: Process notes changed since last run",
            callback: () => this.processIncremental()
        });
        this.addCommand({
            id: "ab-vault",
            name: "AutoBacklinker: Process whole vault (one-off)",
            callback: () => this.processVault()
        });

        this.addSettingTab(new ABSettingTab(this.app, this));

        new Notice("🧠 AutoBacklinker loaded.");
    }

    /* ========== UI ========== */
    updateStatusBar() {
        if (!this.statusBarEl) return;
        this.statusBarEl.setText(this.settings.autoLinkOnSave ? "AutoBacklinker: AUTO" : "AutoBacklinker: MANUAL");
    }

    async toggleAutoMode() {
        this.settings.autoLinkOnSave = !this.settings.autoLinkOnSave;
        await this.saveSettings();
        this.updateStatusBar();
        new Notice(`Auto mode: ${this.settings.autoLinkOnSave ? "ON (on-save)" : "OFF (manual only)"}`);
    }

    /* ========== 인덱스/필터 ========== */
    computeExcludedRoots() {
        this.excludedRoots = this.settings.excludeFolders
            .split(";")
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.replace(/\\/g, "/"));
    }

    isExcluded(f: TFile) {
        if (!this.excludedRoots.length) return false;
        const path = f.path.replace(/\\/g, "/");
        return this.excludedRoots.some(root => path === root || path.startsWith(root + "/"));
    }

    isMd(f: TFile) {
        return f.extension.toLowerCase() === "md";
    }

    rebuildTitleIndex() {
        this.titleSet.clear();
        for (const f of this.app.vault.getMarkdownFiles()) {
            if (this.isExcluded(f)) continue;
            this.titleSet.add(f.basename);
        }
    }

    onFSChange(f: TAbstractFile) {
        if (f instanceof TFile && this.isMd(f) && !this.isExcluded(f))
            this.rebuildTitleIndex();
    }

    /* ========== 매칭 로직 ========== */
    useTitle(title: string, selfName?: string) {
        const t = title.trim();
        if (!t) return false;
        if (selfName && t === selfName) return false;
        if (t.includes(" ")) return true; // 영어 문구 허용
        return t.length >= 2; // 한 글자 제목은 과잉링크 방지
    }

    prepareTitles(selfName: string) {
        const arr = Array.from(this.titleSet).sort((a, b) => b.length - a.length);
        const kept: string[] = [];

        for (let i = 0; i < arr.length; i++) {
            const t = arr[i];
            if (!this.useTitle(t, selfName)) continue;

            let isSub = false;
            for (let j = 0; j < i; j++) {
                if (arr[j].includes(t)) {
                    isSub = true;
                    break;
                }
            }
            if (!isSub) kept.push(t);
        }
        return kept;
    }

    buildPattern(title: string) {
        const escaped = esc(title);
        if (isAsciiOnly(title) && !hasHangul(title)) {
            return new RegExp(`\\b(${escaped})\\b`, "gi");
        } else {
            const post = this.settings.allowKoreanParticles ? `(${PARTICLES})?` : "";
            return new RegExp(`(${escaped})${post}`, "gu");
        }
    }

    linkify(raw: string, titles: string[], selfName: string) {
        const { masked, slots } = mask(raw);
        let text = masked;
        let changed = false;
        let count = 0;

        for (const title of titles) {
            const rx = this.buildPattern(title);
            if (!rx.test(text)) continue;

            if (isAsciiOnly(title) && !hasHangul(title)) {
                text = text.replace(rx, () => { count++; return `[[${title}]]`; });
            } else {
                const escaped = esc(title);
                const post = this.settings.allowKoreanParticles ? `(${PARTICLES})?` : "";
                const splitter = new RegExp(`(${escaped})${post}`, "gu");

                text = text.replace(splitter, (_m, _word, particle) => {
                    count++;
                    return `[[${title}]]${particle ?? ""}`;
                });
            }
            changed = true;
        }
        return { content: unmask(text, slots), changed, count };
    }

    /* ========== 동작 ========== */
    async linkNote(file: TFile) {
        if (this.isExcluded(file)) return;
        const titles = this.prepareTitles(file.basename);
        const original = await this.app.vault.read(file);
        const { content, changed } = this.linkify(original, titles, file.basename);
        if (!changed) return;
        await this.app.vault.modify(file, content);
    }

    async processCurrent() {
        const f = this.app.workspace.getActiveFile();
        if (!f || !this.isMd(f)) return new Notice("📄 No active Markdown note.");
        await this.linkNote(f);
        new Notice(`✅ Processed: ${f.basename}`);
    }

    async processIncremental() {
        const since = this.settings.lastRunISO ? new Date(this.settings.lastRunISO).getTime() : 0;
        const files = this.app.vault.getMarkdownFiles().filter(f => !this.isExcluded(f));
        const targets = files.filter(f => (f.stat.mtime ?? 0) > since);

        let done = 0;
        for (const chunk of this.chunks(targets, this.settings.batchSize)) {
            const paths = new Set(chunk.map(f => f.path));
            paths.forEach(p => this.inFlight.add(p));
            await Promise.all(chunk.map(f => this.linkNote(f)));
            paths.forEach(p => this.inFlight.delete(p));
            done += chunk.length;
            new Notice(`⏩ Incremental linking… ${done}/${targets.length}`);
            await sleep(0);
        }

        this.settings.lastRunISO = new Date().toISOString();
        await this.saveSettings();
        new Notice(`🔗 Incremental complete. ${done} note(s) checked.`);
    }

    async processVault() {
        const files = this.app.vault.getMarkdownFiles().filter(f => !this.isExcluded(f));
        let done = 0;

        for (const chunk of this.chunks(files, this.settings.batchSize)) {
            const paths = new Set(chunk.map(f => f.path));
            paths.forEach(p => this.inFlight.add(p));
            await Promise.all(chunk.map(f => this.linkNote(f)));
            paths.forEach(p => this.inFlight.delete(p));
            done += chunk.length;
            new Notice(`🚚 Vault-wide linking… ${done}/${files.length}`);
            await sleep(0);
        }

        this.settings.lastRunISO = new Date().toISOString();
        await this.saveSettings();
        new Notice("✅ Vault-wide linking complete.");
    }

    *chunks<T>(arr: T[], size: number): Generator<T[]> {
        for (let i = 0; i < arr.length; i += size) {
            yield arr.slice(i, i + size);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

/* ========== 설정 탭 ========== */
class ABSettingTab extends PluginSettingTab {
    plugin: AutoBacklinker;

    constructor(app: App, plugin: AutoBacklinker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "AutoBacklinker" });

        new Setting(containerEl)
            .setName("Allow Korean particles after title")
            .setDesc("Example: Ciel을 → [[Ciel]]을")
            .addToggle(t => t
                .setValue(this.plugin.settings.allowKoreanParticles)
                .onChange(async (v) => {
                    this.plugin.settings.allowKoreanParticles = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Auto-link on save/modify (auto mode)")
            .setDesc("When ON, the plugin links the note automatically whenever you save/modify it. Use the ribbon icon or command to toggle quickly.")
            .addToggle(t => t
                .setValue(this.plugin.settings.autoLinkOnSave)
                .onChange(async (v) => {
                    this.plugin.settings.autoLinkOnSave = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Exclude folders (optional)")
            .setDesc('Semicolon-separated root folders. Example: "Templates;Daily Notes"')
            .addText(t => t
                .setPlaceholder("Templates;Daily Notes")
                .setValue(this.plugin.settings.excludeFolders)
                .onChange(async (v) => {
                    this.plugin.settings.excludeFolders = v;
                    this.plugin.computeExcludedRoots();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Batch size (advanced)")
            .setDesc("Number of notes to process per batch during bulk operations (default 50).")
            .addText(t => t
                .setValue(String(this.plugin.settings.batchSize))
                .onChange(async (v) => {
                    const n = Math.max(1, Number(v) || 50);
                    this.plugin.settings.batchSize = n;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl("div", { text: `Last incremental run: ${this.plugin.settings.lastRunISO ?? "—"}` });
    }
}

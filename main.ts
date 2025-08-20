import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    TAbstractFile
} from "obsidian";

import { I18n, SupportedLanguage, SUPPORTED_LANGUAGES, EN_TRANSLATIONS } from './i18n';

/* ========== 기본 설정 ========== */
interface AutoBacklinkerSettings {
    // 기본 설정
    allowKoreanParticles: boolean;
    lastRunISO: string | null;
    autoLinkOnSave: boolean;
    batchSize: number;
    excludeFolders: string;
    
    // 스마트 링크 필터링
    avoidOverlinking: boolean;
    respectExistingLinks: boolean;
    contextualRelevance: boolean;
    maxLinksPerParagraph: number;
    
    // 링크 미리보기
    showPreview: boolean;
    requireConfirmation: boolean;
    
    // 양방향 링크
    autoCreateBacklinks: boolean;
    backlinkSection: string;
    updateExistingBacklinks: boolean;
    
    // 링크 품질
    enableSynonyms: boolean;
    ignoreCase: boolean;
    enablePartialMatch: boolean;
    synonyms: Record<string, string[]>;
    
    // 통계 및 분석
    enableStats: boolean;
    showLinkCount: boolean;
    
    // 고급 제외 규칙
    excludeTags: string;
    minNoteSize: number;
    maxNoteSize: number;
    excludeRecentDays: number;
    
    // 링크 스타일
    useDisplayText: boolean;
    preserveCase: boolean;
    addTooltips: boolean;
    
    // 스마트 기능
    enableSmart: boolean;
    confidenceThreshold: number;
    enableTemplates: boolean;
    
    // 언어 설정
    language: SupportedLanguage;
}

type ProcessingStatus = {
    processed: number;
    total: number;
    errors: number;
    paused: boolean;
    startTime: number;
};

type LinkResult = {
    content: string;
    changed: boolean;
    count: number;
    suggestions: LinkSuggestion[];
};

type LinkSuggestion = {
    original: string;
    target: string;
    position: number;
    confidence: number;
    context: string;
    approved?: boolean;
};

type LinkStats = {
    totalLinksCreated: number;
    linksPerNote: Map<string, number>;
    mostLinkedNotes: string[];
    linkCreationHistory: LinkEvent[];
    sessionStats: SessionStats;
};

type LinkEvent = {
    timestamp: number;
    noteFile: string;
    linksAdded: number;
    linkTargets: string[];
};

type SessionStats = {
    notesProcessed: number;
    linksCreated: number;
    timeSpent: number;
    averageLinksPerNote: number;
};

type LinkTemplate = {
    id: string;
    name: string;
    pattern: string;
    replacement: string;
    conditions: string[];
    enabled: boolean;
};

type SynonymGroup = {
    primary: string;
    variants: string[];
    caseSensitive: boolean;
};

const DEFAULT_SETTINGS: AutoBacklinkerSettings = {
    // 기본 설정
    allowKoreanParticles: true,
    lastRunISO: null,
    autoLinkOnSave: false,
    batchSize: 50,
    excludeFolders: "",
    
    // 스마트 링크 필터링
    avoidOverlinking: true,
    respectExistingLinks: true,
    contextualRelevance: true,
    maxLinksPerParagraph: 3,
    
    // 링크 미리보기
    showPreview: false,
    requireConfirmation: false,
    
    // 양방향 링크
    autoCreateBacklinks: false,
    backlinkSection: "## 관련 노트",
    updateExistingBacklinks: true,
    
    // 링크 품질
    enableSynonyms: false,
    ignoreCase: false,
    enablePartialMatch: false,
    synonyms: {},
    
    // 통계 및 분석
    enableStats: true,
    showLinkCount: true,
    
    // 고급 제외 규칙
    excludeTags: "",
    minNoteSize: 0,
    maxNoteSize: 0,
    excludeRecentDays: 0,
    
    // 링크 스타일
    useDisplayText: false,
    preserveCase: false,
    addTooltips: false,
    
    // 스마트 기능
    enableSmart: false,
    confidenceThreshold: 0.7,
    enableTemplates: false,
    
    // 언어 설정
    language: 'ko'
};

const PARTICLES = "의|이|가|은|는|을|를|에|에서|에게|께|으로|로|와|과|도|만|뿐|까지|부터|보다|처럼|마다|씩|조차|마저|라도|께서";

const PROCESSING_DELAY = 0; // 배치 간 대기 시간 (ms)
const MIN_TITLE_LENGTH = 2; // 최소 제목 길이
const MAX_BATCH_SIZE = 100; // 최대 배치 크기
const MAX_LINKS_PER_PARAGRAPH = 10; // 문단당 최대 링크 수
const CONFIDENCE_THRESHOLD = 0.5; // AI 추천 최소 확신도
const CONTEXT_WINDOW = 50; // 컨텍스트 분석 창 크기
const BACKLINK_SECTION_HEADER = "## 관련 노트"; // 백링크 섹션 헤더
const STATS_UPDATE_INTERVAL = 1000; // 통계 업데이트 간격 (ms)

/* ========== 유틸리티 함수 ========== */
class LinkUtils {
    static isAsciiOnly(s: string): boolean {
        return /^[\x00-\x7F]+$/.test(s);
    }
    
    static hasHangul(s: string): boolean {
        return /[\u3131-\u318E\uAC00-\uD7A3]/.test(s);
    }
    
    static escapeRegExp(s: string): string {
        return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    
    static sleep(ms: number): Promise<void> {
        return new Promise(res => setTimeout(res, ms));
    }
    
    static clampNumber(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
    
    static createCacheKey(...parts: (string | boolean | number)[]): string {
        return parts.join('|');
    }
    
    static async retryOperation<T>(
        operation: () => Promise<T>, 
        maxRetries: number = 3, 
        delay: number = 100
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === maxRetries) {
                    throw lastError;
                }
                
                // Exponential backoff
                await LinkUtils.sleep(delay * Math.pow(2, attempt - 1));
            }
        }
        
        throw lastError!;
    }
}

// Backward compatibility
const isAsciiOnly = LinkUtils.isAsciiOnly;
const hasHangul = LinkUtils.hasHangul;
const esc = LinkUtils.escapeRegExp;
const sleep = LinkUtils.sleep;

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
    i18n!: I18n;

    titleSet: Set<string> = new Set();
    excludedRoots: string[] = [];
    excludedTags!: Set<string>;
    synonymGroups!: SynonymGroup[];
    linkStats!: LinkStats;
    linkTemplates!: LinkTemplate[];
    patternCache: Map<string, RegExp> = new Map();
    inFlight: Set<string> = new Set();
    statusBarEl: HTMLElement | null = null;
    ribbonIcon: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.i18n = new I18n(this.settings.language);
        this.computeExcludedRoots();
        this.computeExcludedTags();
        this.loadSynonyms();
        this.loadTemplates();
        this.initializeLinkStats();
        await this.loadStats();
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

        // 리본 버튼 - 전체 볼트 스캔
        this.ribbonIcon = this.addRibbonIcon("search", "🔍 Scan vault for links / 볼트 링크 탐색", () => this.scanEntireVault());
        this.ribbonIcon.addClass("ab-ribbon");

        // 상태바 표시
        this.statusBarEl = this.addStatusBarItem();
        this.updateStatusBar();

        // 명령어 등록
        this.addCommand({
            id: "ab-toggle-auto",
            name: this.i18n.t().commands.toggleAuto,
            callback: () => this.toggleAutoMode()
        });
        
        this.addCommand({
            id: "ab-scan-vault",
            name: "🔍 Scan entire vault for links / 전체 볼트 링크 탐색",
            callback: () => this.scanEntireVault()
        });
        
        this.addCommand({
            id: "ab-process-current",
            name: this.i18n.t().commands.processCurrent,
            callback: () => this.processCurrent()
        });

        this.addSettingTab(new ABSettingTab(this.app, this));

        new Notice(`🧠 ${this.i18n ? this.i18n.t().pluginLoaded : 'AutoBacklinker loaded with enhanced features'}`);
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
    computeExcludedRoots(): void {
        this.excludedRoots = this.settings.excludeFolders
            .split(";")
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.replace(/\\/g, "/"));
    }
    
    computeExcludedTags(): void {
        this.excludedTags = new Set(
            this.settings.excludeTags
                .split(";")
                .map(s => s.trim())
                .filter(Boolean)
        );
    }
    
    loadSynonyms(): void {
        this.synonymGroups = [];
        for (const [primary, variants] of Object.entries(this.settings.synonyms)) {
            this.synonymGroups.push({
                primary,
                variants: variants || [],
                caseSensitive: !this.settings.ignoreCase
            });
        }
    }
    
    loadTemplates(): void {
        // 기본 템플릿들 로드 (나중에 설정에서 관리)
        this.linkTemplates = [
            {
                id: "date-format",
                name: "날짜 형식",
                pattern: "\\d{4}-\\d{2}-\\d{2}",
                replacement: "[[Daily Notes/$&]]",
                conditions: ["is-date"],
                enabled: false
            },
            {
                id: "hashtag-convert",
                name: "해시태그 변환",
                pattern: "#(\\w+)",
                replacement: "[[Tags/$1]]",
                conditions: ["not-in-code"],
                enabled: false
            }
        ];
    }
    
    initializeLinkStats(): void {
        this.linkStats = {
            totalLinksCreated: 0,
            linksPerNote: new Map(),
            mostLinkedNotes: [],
            linkCreationHistory: [],
            sessionStats: {
                notesProcessed: 0,
                linksCreated: 0,
                timeSpent: 0,
                averageLinksPerNote: 0
            }
        };
    }
    
    async loadStats(): Promise<void> {
        const savedStats = await this.loadData();
        if (savedStats?.linkStats) {
            this.linkStats = {
                ...this.linkStats,
                ...savedStats.linkStats,
                linksPerNote: new Map(savedStats.linkStats.linksPerNote || []),
                sessionStats: {
                    notesProcessed: 0,
                    linksCreated: 0,
                    timeSpent: 0,
                    averageLinksPerNote: 0
                }
            };
        }
    }
    
    async saveStats(): Promise<void> {
        const data = await this.loadData() || {};
        data.linkStats = {
            ...this.linkStats,
            linksPerNote: Array.from(this.linkStats.linksPerNote.entries())
        };
        await this.saveData(data);
    }

    isExcluded(f: TFile): boolean {
        // 기본 폴더 제외
        if (this.excludedRoots.length > 0) {
            const path = f.path.replace(/\\/g, "/");
            if (this.excludedRoots.some(root => path === root || path.startsWith(root + "/"))) {
                return true;
            }
        }
        
        // 태그 기반 제외
        if (this.excludedTags.size > 0) {
            const cache = this.app.metadataCache.getFileCache(f);
            if (cache?.tags) {
                for (const tag of cache.tags) {
                    if (this.excludedTags.has(tag.tag.substring(1))) { // # 제거
                        return true;
                    }
                }
            }
        }
        
        // 파일 크기 기반 제외
        if (this.settings.minNoteSize > 0 && f.stat.size < this.settings.minNoteSize) {
            return true;
        }
        if (this.settings.maxNoteSize > 0 && f.stat.size > this.settings.maxNoteSize) {
            return true;
        }
        
        // 최근 수정일 기반 제외
        if (this.settings.excludeRecentDays > 0) {
            const daysSinceModified = (Date.now() - (f.stat.mtime || 0)) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < this.settings.excludeRecentDays) {
                return true;
            }
        }
        
        return false;
    }

    isMd(f: TFile): boolean {
        return f.extension.toLowerCase() === "md";
    }

    rebuildTitleIndex(): void {
        this.titleSet.clear();
        const markdownFiles = this.app.vault.getMarkdownFiles();
        
        for (const file of markdownFiles) {
            if (this.isExcluded(file)) continue;
            this.titleSet.add(file.basename);
        }
    }

    onFSChange(f: TAbstractFile): void {
        if (f instanceof TFile && this.isMd(f) && !this.isExcluded(f)) {
            this.rebuildTitleIndex();
            
            // 삭제된 파일의 통계 제거
            if (!this.app.vault.getAbstractFileByPath(f.path)) {
                this.linkStats.linksPerNote.delete(f.path);
                this.linkStats.linkCreationHistory = this.linkStats.linkCreationHistory
                    .filter(event => event.noteFile !== f.path);
            }
        }
    }

    /* ========== 매칭 로직 ========== */
    useTitle(title: string, selfName?: string): boolean {
        const t = title.trim();
        if (!t) return false;
        if (selfName && t === selfName) return false;
        if (t.includes(" ")) return true; // 영어 문구 허용
        return t.length >= MIN_TITLE_LENGTH; // 짧은 제목은 과잉링크 방지
    }
    
    // 동의어/변형어 처리
    expandTitlesWithSynonyms(titles: string[]): string[] {
        if (!this.settings.enableSynonyms || this.synonymGroups.length === 0) {
            return titles;
        }
        
        const expandedTitles = new Set(titles);
        
        for (const group of this.synonymGroups) {
            const allVariants = [group.primary, ...group.variants];
            const hasMatch = allVariants.some(variant => 
                titles.some(title => 
                    group.caseSensitive ? title === variant : title.toLowerCase() === variant.toLowerCase()
                )
            );
            
            if (hasMatch) {
                allVariants.forEach(variant => expandedTitles.add(variant));
            }
        }
        
        return Array.from(expandedTitles);
    }
    
    // 컨텍스트 기반 링크 필터링
    shouldCreateLink(text: string, position: number, title: string, existingLinks: number[]): boolean {
        if (!this.settings.avoidOverlinking) return true;
        
        // 문단 내 링크 수 제한
        const paragraphs = text.split(/\n\s*\n/);
        let currentParagraph = 0;
        let charCount = 0;
        
        for (let i = 0; i < paragraphs.length; i++) {
            charCount += paragraphs[i].length + 2; // \n\n 고려
            if (charCount > position) {
                currentParagraph = i;
                break;
            }
        }
        
        const paragraphText = paragraphs[currentParagraph];
        const linksInParagraph = (paragraphText.match(/\[\[.*?\]\]/g) || []).length;
        
        if (linksInParagraph >= this.settings.maxLinksPerParagraph) {
            return false;
        }
        
        // 기존 링크 근처 획인
        if (this.settings.respectExistingLinks) {
            const minDistance = title.length + 10; // 링크 길이 + 여백
            for (const linkPos of existingLinks) {
                if (Math.abs(position - linkPos) < minDistance) {
                    return false;
                }
            }
        }
        
        return true;
    }

    prepareTitles(selfName: string): string[] {
        let arr = Array.from(this.titleSet).sort((a, b) => b.length - a.length);
        
        // 동의어 확장
        if (this.settings.enableSynonyms) {
            arr = this.expandTitlesWithSynonyms(arr);
            arr.sort((a, b) => b.length - a.length); // 다시 정렬
        }
        
        const kept: string[] = [];
        const usedTitles = new Set<string>();

        for (const title of arr) {
            if (!this.useTitle(title, selfName)) continue;
            
            // 더 긴 제목에 포함되어 있는지 확인
            let isSubstring = false;
            for (const usedTitle of usedTitles) {
                if (usedTitle.includes(title)) {
                    isSubstring = true;
                    break;
                }
            }
            
            if (!isSubstring) {
                kept.push(title);
                usedTitles.add(title);
            }
        }
        return kept;
    }

    buildPattern(title: string): RegExp {
        // Create cache key based on title and relevant settings
        const cacheKey = LinkUtils.createCacheKey(
            title, 
            this.settings.ignoreCase, 
            this.settings.enablePartialMatch, 
            this.settings.allowKoreanParticles
        );
        
        // Check cache first
        if (this.patternCache.has(cacheKey)) {
            return this.patternCache.get(cacheKey)!;
        }
        
        const escaped = LinkUtils.escapeRegExp(title);
        
        // 대소문자 무시 옵션
        const flags = this.settings.ignoreCase ? "gi" : "g";
        const koreanFlags = this.settings.ignoreCase ? "giu" : "gu";
        
        let pattern: RegExp;
        
        if (isAsciiOnly(title) && !hasHangul(title)) {
            if (this.settings.enablePartialMatch) {
                pattern = new RegExp(`(${escaped})`, flags);
            } else {
                pattern = new RegExp(`\\b(${escaped})\\b`, flags);
            }
        } else {
            const post = this.settings.allowKoreanParticles ? `(${PARTICLES})?` : "";
            pattern = new RegExp(`(${escaped})${post}`, koreanFlags);
        }
        
        // Cache the pattern
        this.patternCache.set(cacheKey, pattern);
        
        return pattern;
    }

    linkify(raw: string, titles: string[], selfName: string): LinkResult {
        const { masked, slots } = mask(raw);
        let text = masked;
        let changed = false;
        let count = 0;
        const suggestions: LinkSuggestion[] = [];
        
        // 기존 링크 위치 찾기
        const existingLinks = this.findExistingLinkPositions(text);

        for (const title of titles) {
            const { newSuggestions, updatedText, linkCount } = this.processTitle(text, title, existingLinks);
            
            suggestions.push(...newSuggestions);
            text = updatedText;
            count += linkCount;
            if (linkCount > 0) changed = true;
        }
        
        return { 
            content: unmask(text, slots), 
            changed, 
            count,
            suggestions: suggestions.filter(s => s.approved)
        };
    }
    
    private findExistingLinkPositions(text: string): number[] {
        const existingLinks: number[] = [];
        const linkPattern = /\[\[.*?\]\]/g;
        let linkMatch;
        while ((linkMatch = linkPattern.exec(text)) !== null) {
            existingLinks.push(linkMatch.index);
        }
        return existingLinks;
    }
    
    private processTitle(text: string, title: string, existingLinks: number[]): {
        newSuggestions: LinkSuggestion[];
        updatedText: string;
        linkCount: number;
    } {
        const suggestions: LinkSuggestion[] = [];
        let updatedText = text;
        let linkCount = 0;
        
        const rx = this.buildPattern(title);
        
        // 매치 찾기 및 제안 생성
        const newSuggestions = this.generateLinkSuggestions(text, title, rx, existingLinks);
        suggestions.push(...newSuggestions);
        
        // 실제 링크 생성 (승인된 것만)
        rx.lastIndex = 0;
        const { text: processedText, count } = this.createLinksFromSuggestions(updatedText, title, rx, suggestions);
        
        return {
            newSuggestions: suggestions,
            updatedText: processedText,
            linkCount: count
        };
    }
    
    private generateLinkSuggestions(text: string, title: string, rx: RegExp, existingLinks: number[]): LinkSuggestion[] {
        const suggestions: LinkSuggestion[] = [];
        let match;
        
        while ((match = rx.exec(text)) !== null) {
            const position = match.index;
            const matchedText = match[0];
            
            // 컨텍스트 기반 필터링
            if (!this.shouldCreateLink(text, position, title, existingLinks)) {
                continue;
            }
            
            // 링크 제안 생성
            const context = this.extractContext(text, position, CONTEXT_WINDOW);
            const confidence = this.calculateLinkConfidence(title, matchedText, context);
            
            suggestions.push({
                original: matchedText,
                target: title,
                position,
                confidence,
                context,
                approved: !this.settings.requireConfirmation || confidence > this.settings.confidenceThreshold
            });
        }
        
        return suggestions;
    }
    
    private createLinksFromSuggestions(text: string, title: string, rx: RegExp, suggestions: LinkSuggestion[]): {
        text: string;
        count: number;
    } {
        let count = 0;
        let processedText = text;
        
        if (isAsciiOnly(title) && !hasHangul(title)) {
            processedText = text.replace(rx, (match, ...args) => {
                const pos = args[args.length - 2]; // offset
                const suggestion = suggestions.find(s => s.position === pos && s.approved);
                if (!suggestion) return match;
                
                count++;
                
                if (this.settings.useDisplayText && this.settings.preserveCase) {
                    return `[[${title}|${match}]]`;
                }
                return `[[${title}]]`;
            });
        } else {
            processedText = this.createKoreanLinks(text, title, suggestions);
            count = suggestions.filter(s => s.approved).length;
        }
        
        return { text: processedText, count };
    }
    
    private createKoreanLinks(text: string, title: string, suggestions: LinkSuggestion[]): string {
        const escaped = esc(title);
        const post = this.settings.allowKoreanParticles ? `(${PARTICLES})?` : "";
        const splitter = new RegExp(`(${escaped})${post}`, "gu");

        return text.replace(splitter, (match, word, particle, offset) => {
            const suggestion = suggestions.find(s => s.position === offset && s.approved);
            if (!suggestion) return match;
            
            const linkText = this.settings.useDisplayText && this.settings.preserveCase 
                ? `[[${title}|${word}]]` 
                : `[[${title}]]`;
            
            return linkText + (particle ?? "");
        });
    }
    
    // 컨텍스트 추출
    extractContext(text: string, position: number, windowSize: number): string {
        const start = Math.max(0, position - windowSize);
        const end = Math.min(text.length, position + windowSize);
        return text.substring(start, end);
    }
    
    // 링크 확신도 계산
    calculateLinkConfidence(title: string, matchedText: string, context: string): number {
        let confidence = 0.5; // 기본 확신도
        
        // 제목 일치도
        if (title.toLowerCase() === matchedText.toLowerCase()) {
            confidence += 0.3;
        }
        
        // 컨텍스트 분석
        const contextWords = context.toLowerCase().split(/\s+/);
        const titleWords = title.toLowerCase().split(/\s+/);
        
        let contextMatches = 0;
        for (const titleWord of titleWords) {
            if (contextWords.includes(titleWord)) {
                contextMatches++;
            }
        }
        
        confidence += (contextMatches / titleWords.length) * 0.2;
        
        return Math.min(1.0, confidence);
    }

    /* ========== 동작 ========== */
    async linkNote(file: TFile): Promise<LinkResult | null> {
        if (this.isExcluded(file)) return null;
        
        try {
            const titles = this.prepareTitles(file.basename);
            
            // Retry file read operation
            const original = await LinkUtils.retryOperation(
                () => this.app.vault.read(file),
                3,
                50
            );
            
            const result = this.linkify(original, titles, file.basename);
            
            if (!result.changed) return null;
            
            // 템플릿 적용
            let finalContent = result.content;
            if (this.settings.enableTemplates) {
                finalContent = this.applyTemplates(finalContent);
            }
            
            // Retry file write operation
            await LinkUtils.retryOperation(
                () => this.app.vault.modify(file, finalContent),
                3,
                50
            );
            
            // 통계 업데이트
            this.updateLinkStats(file, result.count, result.suggestions.map(s => s.target));
            
            return result;
        } catch (error) {
            console.error(`AutoBacklinker: 파일 처리 중 오류 ${file.path}:`, error);
            
            // More informative error messages
            const errorMsg = error instanceof Error 
                ? `${file.basename}: ${error.message}` 
                : `${file.basename}: 알 수 없는 오류`;
            
            new Notice(`⚠️ 파일 처리 실패: ${errorMsg}`, 5000);
            return null;
        }
    }
    
    // 템플릿 적용
    applyTemplates(content: string): string {
        let result = content;
        
        for (const template of this.linkTemplates) {
            if (!template.enabled) continue;
            
            const regex = new RegExp(template.pattern, 'g');
            result = result.replace(regex, (match) => {
                // 조건 검사
                if (!this.checkTemplateConditions(match, template.conditions)) {
                    return match;
                }
                
                return template.replacement.replace(/\$&/g, match);
            });
        }
        
        return result;
    }
    
    // 템플릿 조건 검사
    checkTemplateConditions(match: string, conditions: string[]): boolean {
        for (const condition of conditions) {
            switch (condition) {
                case 'is-date':
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(match)) return false;
                    break;
                case 'not-in-code':
                    // 단순화된 검사 - 실제로는 더 정교한 검사 필요
                    break;
            }
        }
        return true;
    }
    
    // 링크 통계 업데이트
    updateLinkStats(file: TFile, linksAdded: number, targets: string[]): void {
        if (!this.settings.enableStats) return;
        
        this.linkStats.totalLinksCreated += linksAdded;
        this.linkStats.sessionStats.linksCreated += linksAdded;
        this.linkStats.sessionStats.notesProcessed += 1;
        
        // 노트별 링크 수 업데이트
        const currentCount = this.linkStats.linksPerNote.get(file.path) || 0;
        this.linkStats.linksPerNote.set(file.path, currentCount + linksAdded);
        
        // 링크 생성 이벤트 기록
        this.linkStats.linkCreationHistory.push({
            timestamp: Date.now(),
            noteFile: file.path,
            linksAdded,
            linkTargets: targets
        });
        
        // 최대 1000개의 이벤트만 보관
        if (this.linkStats.linkCreationHistory.length > 1000) {
            this.linkStats.linkCreationHistory = this.linkStats.linkCreationHistory.slice(-1000);
        }
        
        // 세션 평균 계살
        this.linkStats.sessionStats.averageLinksPerNote = 
            this.linkStats.sessionStats.notesProcessed > 0 
                ? this.linkStats.sessionStats.linksCreated / this.linkStats.sessionStats.notesProcessed 
                : 0;
        
        // 상태바 업데이트
        this.updateStatusBar();
        
        // 주기적으로 통계 저장
        if (this.linkStats.linkCreationHistory.length % 10 === 0) {
            this.saveStats();
        }
    }

    async processCurrent(): Promise<void> {
        const f = this.app.workspace.getActiveFile();
        if (!f || !this.isMd(f)) {
            new Notice("📄 활성된 마크다운 노트가 없습니다.");
            return;
        }
        
        const result = await this.linkNote(f);
        if (result) {
            new Notice(`✅ 처리 완료: ${f.basename} (${result.count}개 링크 생성)`);
        } else {
            new Notice(`ℹ️ 생성할 링크가 없습니다: ${f.basename}`);
        }
    }


    async scanEntireVault(): Promise<void> {
        const t = this.i18n.t();
        const files = this.app.vault.getMarkdownFiles().filter(f => !this.isExcluded(f));
        
        if (files.length === 0) {
            new Notice("ℹ️ No markdown notes to process / 처리할 마크다운 노트가 없습니다");
            return;
        }

        new Notice(`🔍 Scanning ${files.length} notes for links... / ${files.length}개 노트에서 링크를 탐색합니다...`);
        
        let processed = 0;
        let linksCreated = 0;
        let errors = 0;

        for (const file of files) {
            try {
                if (!this.inFlight.has(file.path)) {
                    this.inFlight.add(file.path);
                    const result = await this.linkNote(file);
                    if (result) {
                        linksCreated += result.count;
                    }
                    this.inFlight.delete(file.path);
                }
                processed++;
                
                // Progress update every 10 files
                if (processed % 10 === 0) {
                    new Notice(`🔄 Progress: ${processed}/${files.length} files / 진행률: ${processed}/${files.length} 파일`);
                }
                
                // Small delay to prevent UI freezing
                if (processed % 20 === 0) {
                    await sleep(50);
                }
            } catch (error) {
                errors++;
                console.error(`AutoBacklinker: Error processing ${file.path}:`, error);
            }
        }

        this.settings.lastRunISO = new Date().toISOString();
        await this.saveSettings();
        
        const message = `✅ Scan complete! ${linksCreated} links created in ${processed} files${errors > 0 ? ` (${errors} errors)` : ''} / 탐색 완료! ${processed}개 파일에서 ${linksCreated}개 링크 생성${errors > 0 ? ` (${errors}개 오류)` : ''}`;
        new Notice(message);
    }


    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        this.computeExcludedRoots();
        this.computeExcludedTags();
        this.loadSynonyms();
        this.clearPatternCache(); // Clear cache when settings change
        this.updateStatusBar();
    }
    
    clearPatternCache(): void {
        this.patternCache.clear();
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
        const t = this.plugin.i18n?.t() || EN_TRANSLATIONS;
        
        containerEl.empty();
        containerEl.createEl("h2", { text: t.settings.title });

        // === 기본 설정 ===
        containerEl.createEl("h3", { text: "Basic Settings / 기본 설정" });

        new Setting(containerEl)
            .setName(t.settings.autoLinkOnSave.name)
            .setDesc(t.settings.autoLinkOnSave.desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoLinkOnSave)
                .onChange(async (value) => {
                    this.plugin.settings.autoLinkOnSave = value;
                    await this.plugin.saveSettings();
                    // Ribbon icon은 단순히 스캔 기능만 제공
                }));

        new Setting(containerEl)
            .setName(t.settings.koreanParticles.name)
            .setDesc(t.settings.koreanParticles.desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.allowKoreanParticles)
                .onChange(async (value) => {
                    this.plugin.settings.allowKoreanParticles = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.settings.excludeFolders.name)
            .setDesc(t.settings.excludeFolders.desc)
            .addText(text => text
                .setPlaceholder("Templates;Daily Notes")
                .setValue(this.plugin.settings.excludeFolders)
                .onChange(async (value) => {
                    this.plugin.settings.excludeFolders = value;
                    this.plugin.computeExcludedRoots();
                    await this.plugin.saveSettings();
                }));

        // === 언어 설정 ===
        containerEl.createEl("h3", { text: t.settings.language.name + " / Language" });
        
        new Setting(containerEl)
            .setName(t.settings.language.name)
            .setDesc(t.settings.language.desc)
            .addDropdown(dropdown => {
                const languages = this.plugin.i18n?.getSupportedLanguages() || SUPPORTED_LANGUAGES;
                Object.entries(languages).forEach(([code, name]) => {
                    dropdown.addOption(code, name);
                });
                
                dropdown.setValue(this.plugin.settings.language);
                dropdown.onChange(async (value: string) => {
                    this.plugin.settings.language = value as SupportedLanguage;
                    this.plugin.i18n.setLanguage(value as SupportedLanguage);
                    await this.plugin.saveSettings();
                    this.display(); // Refresh UI
                    new Notice(`Language changed to ${languages[value]}`);
                });
            });

        // === 고급 설정 ===
        const advancedHeader = containerEl.createEl("h3", { text: "Advanced Settings / 고급 설정" });
        advancedHeader.style.marginTop = "2em";
        advancedHeader.style.borderTop = "1px solid var(--background-modifier-border)";
        advancedHeader.style.paddingTop = "1em";

        new Setting(containerEl)
            .setName(t.settings.smartFiltering.showPreview.name)
            .setDesc(t.settings.smartFiltering.showPreview.desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showPreview)
                .onChange(async (value) => {
                    this.plugin.settings.showPreview = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.settings.smartFiltering.avoidOverlinking.name)
            .setDesc(t.settings.smartFiltering.avoidOverlinking.desc)
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.avoidOverlinking)
                .onChange(async (value) => {
                    this.plugin.settings.avoidOverlinking = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.settings.batchSize.name)
            .setDesc(t.settings.batchSize.desc)
            .addText(text => text
                .setValue(String(this.plugin.settings.batchSize))
                .onChange(async (value) => {
                    const parsed = Number(value);
                    const batchSize = LinkUtils.clampNumber(parsed || 50, 1, 100);
                    this.plugin.settings.batchSize = batchSize;
                    await this.plugin.saveSettings();
                }));

        // === 상태 정보 ===
        const statusDiv = containerEl.createDiv();
        statusDiv.style.marginTop = "2em";
        statusDiv.style.padding = "1em";
        statusDiv.style.backgroundColor = "var(--background-secondary)";
        statusDiv.style.borderRadius = "5px";
        
        statusDiv.createEl("div", { 
            text: `${t.settings.lastIncrementalRun}: ${this.plugin.settings.lastRunISO ?? "—"}` 
        });
        
        if (this.plugin.settings.enableStats) {
            statusDiv.createEl("div", { 
                text: `Total links created: ${this.plugin.linkStats?.totalLinksCreated || 0}` 
            });
        }
    }
}

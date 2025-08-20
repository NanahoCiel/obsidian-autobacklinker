import { App, Modal } from "obsidian";

/* ========== 타입 정의 ========== */
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

type SynonymGroup = {
    primary: string;
    variants: string[];
    caseSensitive: boolean;
};

type LinkTemplate = {
    id: string;
    name: string;
    pattern: string;
    replacement: string;
    conditions: string[];
    enabled: boolean;
};

/* ========== 모달 클래스들 ========== */

// 링크 미리보기 모달
export class LinkPreviewModal extends Modal {
    suggestions: LinkSuggestion[];
    onConfirm: (approved: LinkSuggestion[]) => void;
    
    constructor(app: App, suggestions: LinkSuggestion[], onConfirm: (approved: LinkSuggestion[]) => void) {
        super(app);
        this.suggestions = suggestions;
        this.onConfirm = onConfirm;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: '링크 미리보기' });
        
        const container = contentEl.createEl('div', { cls: 'link-preview-container' });
        
        this.suggestions.forEach((suggestion, index) => {
            const item = container.createEl('div', { cls: 'link-preview-item' });
            
            const checkbox = item.createEl('input', { type: 'checkbox' });
            checkbox.checked = suggestion.approved || false;
            checkbox.id = `suggestion-${index}`;
            
            const label = item.createEl('label');
            label.htmlFor = `suggestion-${index}`;
            label.createEl('strong', { text: suggestion.original });
            label.createSpan({ text: ' → ' });
            label.createEl('code', { text: `[[${suggestion.target}]]` });
            
            const confidence = item.createEl('span', { cls: 'confidence-score' });
            confidence.textContent = `확신도: ${(suggestion.confidence * 100).toFixed(1)}%`;
            
            const context = item.createEl('div', { cls: 'context-preview' });
            context.textContent = `컨텍스트: ...${suggestion.context}...`;
        });
        
        const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });
        
        const confirmButton = buttonContainer.createEl('button', { text: '선택된 링크 생성' });
        confirmButton.addEventListener('click', () => {
            const approved = this.suggestions.filter((_, index) => {
                const checkbox = contentEl.querySelector(`#suggestion-${index}`) as HTMLInputElement;
                return checkbox.checked;
            });
            this.onConfirm(approved);
            this.close();
        });
        
        const cancelButton = buttonContainer.createEl('button', { text: '취소' });
        cancelButton.addEventListener('click', () => this.close());
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 링크 통계 모달
export class LinkStatsModal extends Modal {
    stats: LinkStats;
    
    constructor(app: App, stats: LinkStats) {
        super(app);
        this.stats = stats;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: '링크 통계' });
        
        // 전체 통계
        const overallSection = contentEl.createEl('div', { cls: 'stats-section' });
        overallSection.createEl('h3', { text: '전체 통계' });
        overallSection.createEl('p', { text: `총 링크 수: ${this.stats.totalLinksCreated}` });
        overallSection.createEl('p', { text: `처리된 노트 수: ${this.stats.linksPerNote.size}` });
        
        // 세션 통계
        const sessionSection = contentEl.createEl('div', { cls: 'stats-section' });
        sessionSection.createEl('h3', { text: '현재 세션' });
        sessionSection.createEl('p', { text: `처리된 노트: ${this.stats.sessionStats.notesProcessed}` });
        sessionSection.createEl('p', { text: `생성된 링크: ${this.stats.sessionStats.linksCreated}` });
        sessionSection.createEl('p', { text: `평균 링크/노트: ${this.stats.sessionStats.averageLinksPerNote.toFixed(2)}` });
        
        // 최근 활동
        if (this.stats.linkCreationHistory.length > 0) {
            const recentSection = contentEl.createEl('div', { cls: 'stats-section' });
            recentSection.createEl('h3', { text: '최근 활동' });
            
            const recentEvents = this.stats.linkCreationHistory.slice(-5).reverse();
            for (const event of recentEvents) {
                const eventEl = recentSection.createEl('div', { cls: 'recent-event' });
                const date = new Date(event.timestamp).toLocaleString();
                eventEl.textContent = `${date}: ${event.noteFile} (+${event.linksAdded} 링크)`;
            }
        }
        
        const closeButton = contentEl.createEl('button', { text: '닫기' });
        closeButton.addEventListener('click', () => this.close());
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 동의어 관리 모달
export class SynonymManagerModal extends Modal {
    groups: SynonymGroup[];
    onSave: (groups: SynonymGroup[]) => void;
    
    constructor(app: App, groups: SynonymGroup[], onSave: (groups: SynonymGroup[]) => void) {
        super(app);
        this.groups = [...groups];
        this.onSave = onSave;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: '동의어 관리' });
        
        const container = contentEl.createEl('div', { cls: 'synonym-container' });
        
        this.renderGroups(container);
        
        const addButton = contentEl.createEl('button', { text: '동의어 그룹 추가' });
        addButton.addEventListener('click', () => {
            this.groups.push({
                primary: '',
                variants: [],
                caseSensitive: false
            });
            this.renderGroups(container);
        });
        
        const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });
        
        const saveButton = buttonContainer.createEl('button', { text: '저장' });
        saveButton.addEventListener('click', () => {
            this.onSave(this.groups);
            this.close();
        });
        
        const cancelButton = buttonContainer.createEl('button', { text: '취소' });
        cancelButton.addEventListener('click', () => this.close());
    }
    
    renderGroups(container: HTMLElement) {
        container.empty();
        
        this.groups.forEach((group, index) => {
            const groupEl = container.createEl('div', { cls: 'synonym-group' });
            
            const primaryInput = groupEl.createEl('input', { type: 'text', placeholder: '주 단어' });
            primaryInput.value = group.primary;
            primaryInput.addEventListener('input', () => {
                group.primary = primaryInput.value;
            });
            
            const variantsInput = groupEl.createEl('input', { type: 'text', placeholder: '동의어 (쉼표로 구분)' });
            variantsInput.value = group.variants.join(', ');
            variantsInput.addEventListener('input', () => {
                group.variants = variantsInput.value.split(',').map(s => s.trim()).filter(Boolean);
            });
            
            const deleteButton = groupEl.createEl('button', { text: '삭제' });
            deleteButton.addEventListener('click', () => {
                this.groups.splice(index, 1);
                this.renderGroups(container);
            });
        });
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 템플릿 관리 모달
export class TemplateManagerModal extends Modal {
    templates: LinkTemplate[];
    onSave: (templates: LinkTemplate[]) => void;
    
    constructor(app: App, templates: LinkTemplate[], onSave: (templates: LinkTemplate[]) => void) {
        super(app);
        this.templates = [...templates];
        this.onSave = onSave;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: '링크 템플릿 관리' });
        
        const container = contentEl.createEl('div', { cls: 'template-container' });
        
        this.renderTemplates(container);
        
        const buttonContainer = contentEl.createEl('div', { cls: 'button-container' });
        
        const saveButton = buttonContainer.createEl('button', { text: '저장' });
        saveButton.addEventListener('click', () => {
            this.onSave(this.templates);
            this.close();
        });
        
        const cancelButton = buttonContainer.createEl('button', { text: '취소' });
        cancelButton.addEventListener('click', () => this.close());
    }
    
    renderTemplates(container: HTMLElement) {
        container.empty();
        
        this.templates.forEach((template, index) => {
            const templateEl = container.createEl('div', { cls: 'template-item' });
            
            const enabledCheckbox = templateEl.createEl('input', { type: 'checkbox' });
            enabledCheckbox.checked = template.enabled;
            enabledCheckbox.addEventListener('change', () => {
                template.enabled = enabledCheckbox.checked;
            });
            
            const nameEl = templateEl.createEl('span', { cls: 'template-name' });
            nameEl.textContent = template.name;
            
            const patternEl = templateEl.createEl('div', { cls: 'template-pattern' });
            patternEl.textContent = `패턴: ${template.pattern}`;
            
            const replacementEl = templateEl.createEl('div', { cls: 'template-replacement' });
            replacementEl.textContent = `치환: ${template.replacement}`;
        });
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 스마트 추천 모달
export class SmartSuggestionsModal extends Modal {
    suggestions: LinkSuggestion[];
    
    constructor(app: App, suggestions: LinkSuggestion[]) {
        super(app);
        this.suggestions = suggestions;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: '스마트 링크 추천' });
        
        const container = contentEl.createEl('div', { cls: 'ai-suggestions-container' });
        
        this.suggestions.forEach(suggestion => {
            const item = container.createEl('div', { cls: 'ai-suggestion-item' });
            
            const titleEl = item.createEl('div', { cls: 'suggestion-title' });
            titleEl.createEl('strong', { text: suggestion.target });
            titleEl.createSpan({ text: ` (확신도: ${(suggestion.confidence * 100).toFixed(1)}%)` });
            
            const contextEl = item.createEl('div', { cls: 'suggestion-context' });
            contextEl.textContent = suggestion.context;
        });
        
        const closeButton = contentEl.createEl('button', { text: '닫기' });
        closeButton.addEventListener('click', () => this.close());
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
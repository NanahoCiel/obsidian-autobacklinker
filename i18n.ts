// i18n (Internationalization) system for AutoBacklinker
export interface Translation {
    // Plugin basics
    pluginName: string;
    pluginLoaded: string;
    
    // Main interface
    auto: string;
    manual: string;
    paused: string;
    
    // Commands
    commands: {
        toggleAuto: string;
        rebuildIndex: string;
        processCurrent: string;
        processIncremental: string;
        processVault: string;
        preview: string;
        stats: string;
        synonyms: string;
        templates: string;
        pause: string;
        smartSuggestions: string;
    };
    
    // Notices
    notices: {
        noActiveNote: string;
        processSuccess: string;
        incrementalComplete: string;
        vaultComplete: string;
        noNewNotes: string;
        noLinksToCreate: string;
        linkCreated: string;
        processingPaused: string;
        processingResumed: string;
        indexRebuilt: string;
        fileProcessError: string;
        smartDisabled: string;
        noSmartSuggestions: string;
    };
    
    // Settings
    settings: {
        title: string;
        koreanParticles: {
            name: string;
            desc: string;
        };
        autoLinkOnSave: {
            name: string;
            desc: string;
        };
        excludeFolders: {
            name: string;
            desc: string;
        };
        batchSize: {
            name: string;
            desc: string;
        };
        smartFiltering: {
            title: string;
            avoidOverlinking: {
                name: string;
                desc: string;
            };
            showPreview: {
                name: string;
                desc: string;
            };
        };
        linkQuality: {
            title: string;
            enableSynonyms: {
                name: string;
                desc: string;
            };
            ignoreCase: {
                name: string;
                desc: string;
            };
        };
        bidirectionalLinks: {
            title: string;
            autoCreateBacklinks: {
                name: string;
                desc: string;
            };
        };
        advanced: {
            title: string;
            enableStats: {
                name: string;
                desc: string;
            };
            enableSmart: {
                name: string;
                desc: string;
            };
        };
        language: {
            name: string;
            desc: string;
        };
        lastIncrementalRun: string;
    };
    
    // Modals
    modals: {
        linkPreview: {
            title: string;
            confidence: string;
            context: string;
            selectAndCreate: string;
            cancel: string;
        };
        linkStats: {
            title: string;
            overall: string;
            currentSession: string;
            recentActivity: string;
            totalLinks: string;
            processedNotes: string;
            averageLinks: string;
            close: string;
        };
        synonymManager: {
            title: string;
            addGroup: string;
            primaryWord: string;
            synonymsPlaceholder: string;
            delete: string;
            save: string;
            cancel: string;
        };
        templateManager: {
            title: string;
            pattern: string;
            replacement: string;
            save: string;
            cancel: string;
        };
        smartSuggestions: {
            title: string;
            confidence: string;
            close: string;
        };
    };
    
    // Processing status
    processing: {
        incrementalLinking: string;
        vaultLinking: string;
        processed: string;
        errors: string;
        withErrors: string;
    };
}

// Language configurations
export const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'ko': '한국어',
    'ja': '日本語',
    'zh': '中文',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'pt': 'Português',
    'ru': 'Русский'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// English translations
export const EN_TRANSLATIONS: Translation = {
    pluginName: "AutoBacklinker",
    pluginLoaded: "AutoBacklinker loaded with enhanced features",
    
    auto: "AUTO",
    manual: "MANUAL", 
    paused: "PAUSED",
    
    commands: {
        toggleAuto: "Toggle auto mode (on-save)",
        rebuildIndex: "Rebuild title index",
        processCurrent: "Process current note (one-off)",
        processIncremental: "Process notes changed since last run",
        processVault: "Process whole vault (one-off)",
        preview: "Link preview",
        stats: "View link statistics",
        synonyms: "Manage synonyms",
        templates: "Manage link templates",
        pause: "Pause/resume batch processing",
        smartSuggestions: "Smart link suggestions"
    },
    
    notices: {
        noActiveNote: "📄 No active Markdown note",
        processSuccess: "✅ Processing complete",
        incrementalComplete: "🔗 Incremental linking complete",
        vaultComplete: "✅ Vault-wide linking complete", 
        noNewNotes: "ℹ️ No new notes to process",
        noLinksToCreate: "🔍 No links to create found",
        linkCreated: "link(s) created",
        processingPaused: "Batch processing paused",
        processingResumed: "Batch processing resumed",
        indexRebuilt: "🔄 Title index rebuilt",
        fileProcessError: "⚠️ File processing failed",
        smartDisabled: "Smart suggestions are disabled",
        noSmartSuggestions: "🔍 No smart link suggestions found"
    },
    
    settings: {
        title: "AutoBacklinker",
        koreanParticles: {
            name: "Allow Korean particles after title",
            desc: "Example: Ciel을 → [[Ciel]]을"
        },
        autoLinkOnSave: {
            name: "Auto-link on save/modify (auto mode)",
            desc: "When ON, the plugin links the note automatically whenever you save/modify it. Use the ribbon icon or command to toggle quickly."
        },
        excludeFolders: {
            name: "Exclude folders (optional)",
            desc: 'Semicolon-separated root folders. Example: "Templates;Daily Notes"'
        },
        batchSize: {
            name: "Batch size (advanced)",
            desc: "Number of notes to process per batch during bulk operations (default 50)."
        },
        smartFiltering: {
            title: "Smart Link Filtering",
            avoidOverlinking: {
                name: "Avoid over-linking",
                desc: "Prevents creating too many links in the same paragraph."
            },
            showPreview: {
                name: "Show link preview",
                desc: "Display preview before creating links."
            }
        },
        linkQuality: {
            title: "Link Quality",
            enableSynonyms: {
                name: "Enable synonyms",
                desc: "Recognize synonyms and variations for link creation."
            },
            ignoreCase: {
                name: "Ignore case",
                desc: "Create links without distinguishing case."
            }
        },
        bidirectionalLinks: {
            title: "Bidirectional Links",
            autoCreateBacklinks: {
                name: "Auto-create backlinks",
                desc: "Automatically add backlinks to target notes when creating links."
            }
        },
        advanced: {
            title: "Advanced Features",
            enableStats: {
                name: "Enable statistics",
                desc: "Track link creation statistics and display in status bar."
            },
            enableSmart: {
                name: "Smart suggestions",
                desc: "Enable intelligent link recommendation features."
            }
        },
        language: {
            name: "Language",
            desc: "Select interface language"
        },
        lastIncrementalRun: "Last incremental run"
    },
    
    modals: {
        linkPreview: {
            title: "Link Preview",
            confidence: "Confidence",
            context: "Context",
            selectAndCreate: "Create Selected Links",
            cancel: "Cancel"
        },
        linkStats: {
            title: "Link Statistics",
            overall: "Overall Statistics",
            currentSession: "Current Session",
            recentActivity: "Recent Activity",
            totalLinks: "Total links",
            processedNotes: "Processed notes",
            averageLinks: "Average links/note",
            close: "Close"
        },
        synonymManager: {
            title: "Synonym Management",
            addGroup: "Add Synonym Group",
            primaryWord: "Primary word",
            synonymsPlaceholder: "Synonyms (comma-separated)",
            delete: "Delete",
            save: "Save",
            cancel: "Cancel"
        },
        templateManager: {
            title: "Link Template Management",
            pattern: "Pattern",
            replacement: "Replacement",
            save: "Save",
            cancel: "Cancel"
        },
        smartSuggestions: {
            title: "Smart Link Suggestions",
            confidence: "Confidence",
            close: "Close"
        }
    },
    
    processing: {
        incrementalLinking: "Incremental linking in progress",
        vaultLinking: "Vault-wide linking in progress",
        processed: "processed",
        errors: "errors",
        withErrors: "processing complete with"
    }
};

// Korean translations
export const KO_TRANSLATIONS: Translation = {
    pluginName: "AutoBacklinker",
    pluginLoaded: "AutoBacklinker 로드 완료 (향상된 기능 지원)",
    
    auto: "자동",
    manual: "수동",
    paused: "일시정지",
    
    commands: {
        toggleAuto: "자동 모드 전환 (저장시)",
        rebuildIndex: "제목 인덱스 재구축",
        processCurrent: "현재 노트 처리 (일회성)",
        processIncremental: "마지막 실행 이후 변경된 노트 처리",
        processVault: "전체 볼트 처리 (일회성)",
        preview: "링크 미리보기",
        stats: "링크 통계 보기",
        synonyms: "동의어 관리",
        templates: "링크 템플릿 관리",
        pause: "배치 처리 일시정지/재개",
        smartSuggestions: "스마트 링크 추천"
    },
    
    notices: {
        noActiveNote: "📄 활성된 마크다운 노트가 없습니다",
        processSuccess: "✅ 처리 완료",
        incrementalComplete: "🔗 증분 링킹 완료",
        vaultComplete: "✅ 전체 볼트 링킹 완료",
        noNewNotes: "ℹ️ 처리할 새로운 노트가 없습니다",
        noLinksToCreate: "🔍 생성할 링크가 없습니다",
        linkCreated: "개 링크 생성",
        processingPaused: "배치 처리 일시정지",
        processingResumed: "배치 처리 재개",
        indexRebuilt: "🔄 제목 인덱스 재구축 완료",
        fileProcessError: "⚠️ 파일 처리 실패",
        smartDisabled: "스마트 추천이 비활성화되어 있습니다",
        noSmartSuggestions: "🔍 스마트 추천 링크가 없습니다"
    },
    
    settings: {
        title: "AutoBacklinker",
        koreanParticles: {
            name: "한국어 조사 허용",
            desc: "예시: Ciel을 → [[Ciel]]을"
        },
        autoLinkOnSave: {
            name: "저장시 자동 링크 (자동 모드)",
            desc: "켜지면 노트를 저장/수정할 때마다 자동으로 링크를 생성합니다. 리본 아이콘이나 명령어로 빠르게 전환할 수 있습니다."
        },
        excludeFolders: {
            name: "제외 폴더 (선택사항)",
            desc: '세미콜론으로 구분된 루트 폴더. 예시: "Templates;Daily Notes"'
        },
        batchSize: {
            name: "배치 크기 (고급)",
            desc: "대량 작업 시 배치당 처리할 노트 수 (기본 50)."
        },
        smartFiltering: {
            title: "스마트 링크 필터링",
            avoidOverlinking: {
                name: "과도한 링크 방지",
                desc: "같은 문단에서 너무 많은 링크 생성을 방지합니다."
            },
            showPreview: {
                name: "링크 미리보기",
                desc: "링크 생성 전에 미리보기를 표시합니다."
            }
        },
        linkQuality: {
            title: "링크 품질",
            enableSynonyms: {
                name: "동의어 지원",
                desc: "동의어와 변형어를 인식하여 링크를 생성합니다."
            },
            ignoreCase: {
                name: "대소문자 무시",
                desc: "대소문자를 구분하지 않고 링크를 생성합니다."
            }
        },
        bidirectionalLinks: {
            title: "양방향 링크",
            autoCreateBacklinks: {
                name: "자동 백링크 생성",
                desc: "링크를 생성할 때 대상 노트에 백링크도 자동으로 추가합니다."
            }
        },
        advanced: {
            title: "고급 기능",
            enableStats: {
                name: "통계 기능",
                desc: "링크 생성 통계를 추적하고 상태바에 표시합니다."
            },
            enableSmart: {
                name: "스마트 추천",
                desc: "지능형 링크 추천 기능을 활성화합니다."
            }
        },
        language: {
            name: "언어",
            desc: "인터페이스 언어 선택"
        },
        lastIncrementalRun: "마지막 증분 실행"
    },
    
    modals: {
        linkPreview: {
            title: "링크 미리보기",
            confidence: "확신도",
            context: "컨텍스트",
            selectAndCreate: "선택된 링크 생성",
            cancel: "취소"
        },
        linkStats: {
            title: "링크 통계",
            overall: "전체 통계",
            currentSession: "현재 세션",
            recentActivity: "최근 활동",
            totalLinks: "총 링크 수",
            processedNotes: "처리된 노트 수",
            averageLinks: "평균 링크/노트",
            close: "닫기"
        },
        synonymManager: {
            title: "동의어 관리",
            addGroup: "동의어 그룹 추가",
            primaryWord: "주 단어",
            synonymsPlaceholder: "동의어 (쉼표로 구분)",
            delete: "삭제",
            save: "저장",
            cancel: "취소"
        },
        templateManager: {
            title: "링크 템플릿 관리",
            pattern: "패턴",
            replacement: "치환",
            save: "저장",
            cancel: "취소"
        },
        smartSuggestions: {
            title: "스마트 링크 추천",
            confidence: "확신도",
            close: "닫기"
        }
    },
    
    processing: {
        incrementalLinking: "증분 링킹 진행중",
        vaultLinking: "전체 볼트 링킹 진행중",
        processed: "개 처리",
        errors: "개 오류",
        withErrors: "처리 완료"
    }
};

// Simple i18n class
export class I18n {
    private currentLanguage: SupportedLanguage = 'en';
    private translations: Record<SupportedLanguage, Translation> = {
        'en': EN_TRANSLATIONS,
        'ko': KO_TRANSLATIONS,
        // Add more languages as needed
        'ja': EN_TRANSLATIONS, // Fallback to English for now
        'zh': EN_TRANSLATIONS,
        'es': EN_TRANSLATIONS,
        'fr': EN_TRANSLATIONS,
        'de': EN_TRANSLATIONS,
        'pt': EN_TRANSLATIONS,
        'ru': EN_TRANSLATIONS
    };
    
    constructor(language?: SupportedLanguage) {
        if (language && this.isSupported(language)) {
            this.currentLanguage = language;
        } else {
            this.currentLanguage = this.detectLanguage();
        }
    }
    
    private detectLanguage(): SupportedLanguage {
        // Try to detect language from Obsidian locale or system language
        if (typeof navigator !== 'undefined') {
            const browserLang = navigator.language.toLowerCase();
            
            if (browserLang.startsWith('ko')) return 'ko';
            if (browserLang.startsWith('ja')) return 'ja';
            if (browserLang.startsWith('zh')) return 'zh';
            if (browserLang.startsWith('es')) return 'es';
            if (browserLang.startsWith('fr')) return 'fr';
            if (browserLang.startsWith('de')) return 'de';
            if (browserLang.startsWith('pt')) return 'pt';
            if (browserLang.startsWith('ru')) return 'ru';
        }
        
        return 'en'; // Default to English
    }
    
    private isSupported(language: string): language is SupportedLanguage {
        return language in SUPPORTED_LANGUAGES;
    }
    
    public setLanguage(language: SupportedLanguage): void {
        if (this.isSupported(language)) {
            this.currentLanguage = language;
        }
    }
    
    public getLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }
    
    public getSupportedLanguages(): Record<string, string> {
        return SUPPORTED_LANGUAGES;
    }
    
    public t(): Translation {
        return this.translations[this.currentLanguage];
    }
    
    // Helper method for getting nested translations
    public get(path: string): string {
        const keys = path.split('.');
        let value: any = this.translations[this.currentLanguage];
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                // Fallback to English if translation is missing
                value = this.translations['en'];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return `[Missing translation: ${path}]`;
                    }
                }
                break;
            }
        }
        
        return typeof value === 'string' ? value : `[Invalid translation path: ${path}]`;
    }
}
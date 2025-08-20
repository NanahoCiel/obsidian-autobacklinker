# AutoBacklinker for Obsidian 🌍

> **[한국어 README](./README-ko.md)** | **English README**

An intelligent auto-linking plugin for Obsidian that transforms your note-taking experience with advanced features, multi-language support, and smart AI-powered suggestions.

## 🌟 Features

### 🧠 Smart Link Filtering
- **Context-aware linking** - Avoids over-linking in the same paragraph
- **Intelligent relevance** - Only creates meaningful links based on context
- **Existing link respect** - Skips areas near existing links

### 👀 Link Preview & Control
- **Pre-creation preview** - See all potential links before applying
- **Confidence scoring** - Each suggestion comes with a confidence percentage
- **Selective application** - Choose which links to create

### 🔗 Bidirectional Link Management
- **Auto-backlinks** - Automatically creates backlinks in target notes
- **Backlink sections** - Organizes backlinks in dedicated sections
- **Smart updates** - Updates existing backlink sections intelligently

### 🌐 Multi-Language Support
- **9+ Languages** - English, Korean, Japanese, Chinese, Spanish, French, German, Portuguese, Russian
- **Auto-detection** - Automatically detects your system language
- **Dynamic switching** - Change language without restarting

### 📊 Advanced Statistics
- **Real-time tracking** - Monitor links created in real-time
- **Session statistics** - Track your current session's activity
- **Historical data** - View creation history and trends
- **Status bar integration** - See stats directly in your status bar

### 🎯 Korean Language Excellence
- **Particle handling** - Correctly processes Korean particles (의, 이, 가, 은, 는, etc.)
- **Cultural adaptation** - UI designed for Korean users
- **Native experience** - Feels like a Korean-first application

### 🧠 Smart Features
- **Intelligent suggestions** - Analyzes your content for link opportunities
- **Confidence scoring** - Relevance-based assessment
- **Pattern recognition** - Learns from your linking patterns

### ⚡ Performance & Quality
- **Batch processing** - Process hundreds of notes efficiently
- **Pause/resume** - Control long-running operations
- **Error recovery** - Robust error handling and recovery
- **Progress tracking** - Real-time progress indicators

### 🎨 Advanced Customization
- **Synonym support** - Create synonym groups for flexible linking
- **Template system** - Use regex patterns for custom link creation
- **Exclusion rules** - Exclude by tags, file size, or modification date
- **Link styles** - Customize how links appear

## 🚀 Quick Start

1. **Install** the plugin from Obsidian Community Plugins
2. **Enable** in Settings → Community Plugins
3. **Configure** your preferences in Settings → AutoBacklinker
4. **Choose your language** in the Language section
5. **Start linking** with automatic or manual modes

## 🎮 Usage Modes

### 🔄 Automatic Mode
- Links are created automatically when you save/modify notes
- Perfect for continuous writing workflows
- Toggle with ribbon icon or command palette

### 🎯 Manual Mode
- Full control over when links are created
- Use commands for targeted processing:
  - **Current note** - Process just the active note
  - **Incremental** - Process only changed notes since last run
  - **Whole vault** - Process your entire vault

### 🔍 Preview Mode
- See all potential links before creation
- Review confidence scores and context
- Select exactly which links to create

## 🛠️ Advanced Features

### Synonym Management
Create groups of related terms that should link to the same note:
```
Primary: "JavaScript"
Synonyms: "JS", "ECMAScript", "자바스크립트"
```

### Template System
Use regex patterns for automatic link creation:
```
Pattern: \d{4}-\d{2}-\d{2}
Replacement: [[Daily Notes/$&]]
```

### Smart Exclusions
- **By tags**: Exclude notes with specific tags
- **By size**: Skip very small or very large notes
- **By date**: Exclude recently modified notes
- **By folder**: Traditional folder-based exclusion

## 🌍 Language Support

| Language | Code | Status | Native Name |
|----------|------|--------|-------------|
| English | `en` | ✅ Complete | English |
| Korean | `ko` | ✅ Complete | 한국어 |
| Japanese | `ja` | 🚧 Planned | 日本語 |
| Chinese | `zh` | 🚧 Planned | 中文 |
| Spanish | `es` | 🚧 Planned | Español |
| French | `fr` | 🚧 Planned | Français |
| German | `de` | 🚧 Planned | Deutsch |
| Portuguese | `pt` | 🚧 Planned | Português |
| Russian | `ru` | 🚧 Planned | Русский |

## 📊 Performance

- **Optimized algorithms** - O(n) complexity for title matching
- **Batch processing** - Handle thousands of notes efficiently
- **Memory efficient** - Minimal memory footprint
- **Interruption safe** - Pause and resume operations

## 🔧 Configuration

### Basic Settings
- **Auto-link on save** - Enable/disable automatic mode
- **Korean particles** - Handle Korean grammar particles
- **Batch size** - Control processing chunk size
- **Exclude folders** - Skip specific folders

### Advanced Settings
- **Smart filtering** - Avoid over-linking and context analysis
- **Link quality** - Synonyms, case sensitivity, partial matching
- **Bidirectional links** - Auto-backlink creation
- **Smart features** - Enable intelligent suggestions
- **Statistics** - Real-time tracking and status bar display

## 🤝 Contributing

We welcome contributions in all languages! Here's how you can help:

1. **Translations** - Add support for your language
2. **Bug reports** - Report issues with detailed steps
3. **Feature requests** - Suggest improvements
4. **Code contributions** - Submit pull requests

### Adding a New Language

1. Edit `i18n.ts` and add your language to `SUPPORTED_LANGUAGES`
2. Create a complete translation object following the `Translation` interface
3. Add your translation to the `translations` object in the `I18n` class
4. Test all UI elements in your language
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Obsidian team for the amazing platform
- Community plugin developers for inspiration
- All translators and contributors
- Korean Obsidian community for feedback and support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Korean Community**: [Obsidian Korea Discord](discord-link)

---

**Made with ❤️ for the global Obsidian community**

*AutoBacklinker transforms your notes into an intelligent, interconnected knowledge base with support for multiple languages and advanced AI features.*
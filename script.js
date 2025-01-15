class ResumeGenerator {
    constructor() {
        this.container = document.querySelector('.container');
        this.editor = document.querySelector('.editor');
        this.preview = document.querySelector('.preview');
        this.sections = [];
        this.currentTemplate = 'classic';
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupSectionControls();
        this.setupFormListeners();
        this.setupCopyButton();
        this.setupTemplateSelector();
        this.setupMobilePreview();
        this.setupDataPersistence();
        this.loadSavedData();
    }

    setupDragAndDrop() {
        const sectionsContainer = this.editor;
        let draggedItem = null;

        sectionsContainer.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                e.preventDefault();
                return;
            }
            
            const isHandle = e.target.tagName === 'H2' || 
                           e.target.classList.contains('section') ||
                           e.target.classList.contains('section-content');
                           
            if (!isHandle) {
                e.preventDefault();
                return;
            }

            if (e.target.classList.contains('section')) {
                draggedItem = e.target;
                setTimeout(() => {
                    e.target.classList.add('dragging');
                }, 0);
            }
        });

        sectionsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(sectionsContainer, e.clientY);
            const currentDragged = document.querySelector('.dragging');
            
            // 防止拖拽到操作按钮下方
            if (afterElement && afterElement.classList.contains('section-controls')) {
                return;
            }
            
            if (afterElement == null) {
                sectionsContainer.insertBefore(currentDragged, document.querySelector('.section-controls'));
            } else {
                sectionsContainer.insertBefore(currentDragged, afterElement);
            }
        });

        sectionsContainer.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            this.updatePreview();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.section:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupSectionControls() {
        const addSectionButtons = document.querySelectorAll('.add-section');
        
        addSectionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = button.dataset.type;
                this.addSection(type);
            });
        });
    }

    addSection(type) {
        const section = document.createElement('div');
        section.className = 'section';
        section.dataset.type = type;
        section.draggable = true;

        // 创建内容容器
        const content = document.createElement('div');
        content.className = 'section-content';

        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-section';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (type === 'basic') {
                this.showNotification('基本信息不能删除');
                return;
            }
            section.remove();
            this.updatePreview();
        });

        switch(type) {
            case 'basic':
                content.innerHTML = `
                    <h2>基本信息</h2>
                    <div class="form-group">
                        <label>姓名:</label>
                        <input type="text" class="name" placeholder="请输入您的姓名">
                    </div>
                    <div class="form-group">
                        <label>电话:</label>
                        <input type="tel" class="phone" placeholder="请输入您的联系电话">
                    </div>
                    <div class="form-group">
                        <label>邮箱:</label>
                        <input type="email" class="email" placeholder="请输入您的电子邮箱">
                    </div>
                    <div class="form-group">
                        <label>地址:</label>
                        <input type="text" class="address" placeholder="请输入您的地址">
                    </div>
                    <div class="form-group">
                        <label>个人简介:</label>
                        <textarea class="summary" placeholder="请输入您的个人简介"></textarea>
                    </div>
                `;
                break;
            case 'experience':
                content.innerHTML = `
                    <h2>工作经验</h2>
                    <div class="form-group">
                        <label>公司名称:</label>
                        <input type="text" class="company" placeholder="请输入公司名称">
                    </div>
                    <div class="form-group">
                        <label>职位:</label>
                        <input type="text" class="position" placeholder="请输入您的职位">
                    </div>
                    <div class="form-group">
                        <label>工作时间:</label>
                        <input type="text" class="duration" placeholder="请输入工作时间（如：2020.01 - 2022.12）">
                    </div>
                    <div class="form-group">
                        <label>工作描述:</label>
                        <textarea class="description" placeholder="请输入您的工作职责和成就"></textarea>
                    </div>
                `;
                break;
            case 'education':
                content.innerHTML = `
                    <h2>教育背景</h2>
                    <div class="form-group">
                        <label>学校名称:</label>
                        <input type="text" class="school" placeholder="请输入学校名称">
                    </div>
                    <div class="form-group">
                        <label>学位:</label>
                        <input type="text" class="degree" placeholder="请输入学位">
                    </div>
                    <div class="form-group">
                        <label>毕业时间:</label>
                        <input type="text" class="graduation" placeholder="请输入毕业时间">
                    </div>
                    <div class="form-group">
                        <label>专业:</label>
                        <input type="text" class="major" placeholder="请输入专业">
                    </div>
                `;
                break;
            case 'skills':
                content.innerHTML = `
                    <h2>技能</h2>
                    <div class="skills-container">
                        <div class="skill-item">
                            <div class="form-group">
                                <label>技能描述:</label>
                                <textarea class="skill-name" placeholder="请输入技能描述" rows="3"></textarea>
                            </div>
                            <button class="remove-skill">删除技能</button>
                        </div>
                    </div>
                    <button class="add-skill">添加技能</button>
                `;
                break;
            case 'projects':
                content.innerHTML = `
                    <h2>项目经历</h2>
                    <div class="form-group">
                        <label>项目名称:</label>
                        <input type="text" class="project-name" placeholder="请输入项目名称">
                    </div>
                    <div class="form-group">
                        <label>技术栈:</label>
                        <input type="text" class="tech-stack" placeholder="请输入使用的技术栈">
                    </div>
                    <div class="form-group">
                        <label>项目描述:</label>
                        <textarea class="project-description" placeholder="请输入项目描述"></textarea>
                    </div>
                    <div class="form-group">
                        <label>职责:</label>
                        <textarea class="responsibilities" placeholder="请输入您的职责"></textarea>
                    </div>
                `;
                break;
            case 'custom':
                content.innerHTML = `
                    <div class="form-group">
                        <label>标题:</label>
                        <input type="text" class="custom-title" placeholder="请输入板块标题">
                    </div>
                    <div class="form-group">
                        <label>内容:</label>
                        <textarea class="custom-content" placeholder="请输入内容"></textarea>
                    </div>
                `;
                // 添加标题输入事件监听
                const titleInput = content.querySelector('.custom-title');
                const h2 = document.createElement('h2');
                h2.textContent = '自定义板块';
                content.insertBefore(h2, content.firstChild);
                
                titleInput.addEventListener('input', (e) => {
                    h2.textContent = e.target.value || '自定义板块';
                });
                break;
        }

        // 按照正确的顺序添加元素
        section.appendChild(deleteBtn);
        section.appendChild(content);
        this.editor.insertBefore(section, document.querySelector('.section-controls'));

        // 如果是技能板块，添加技能相关的事件监听
        if (type === 'skills') {
            const addSkillBtn = section.querySelector('.add-skill');
            const skillsContainer = section.querySelector('.skills-container');

            addSkillBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newSkill = document.createElement('div');
                newSkill.className = 'skill-item';
                newSkill.innerHTML = `
                    <div class="form-group">
                        <label>技能描述:</label>
                        <textarea class="skill-name" placeholder="请输入技能描述" rows="3"></textarea>
                    </div>
                    <button class="remove-skill">删除技能</button>
                `;
                skillsContainer.appendChild(newSkill);
                this.updatePreview();
            });

            section.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-skill')) {
                    e.stopPropagation();
                    e.target.closest('.skill-item').remove();
                    this.updatePreview();
                }
            });
        }

        this.setupFormListeners();
        this.updatePreview();
    }

    setupFormListeners() {
        this.editor.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.updatePreview();
            }
        });
    }

    setupCopyButton() {
        const copyBtn = document.querySelector('.copy-md');
        copyBtn.addEventListener('click', () => {
            const text = this.generateMarkdown();
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.showNotification('Markdown已复制到剪贴板');
                })
                .catch(() => {
                    this.showNotification('复制失败，请重试');
                });
        });

        // 设置导出功能
        const exportBtn = document.querySelector('.export-resume');
        const exportModal = document.getElementById('exportModal');
        const closeModalBtn = exportModal.querySelector('.close-modal');
        const exportOptions = exportModal.querySelectorAll('.export-option');

        exportBtn.addEventListener('click', () => {
            exportModal.classList.add('show');
        });

        closeModalBtn.addEventListener('click', () => {
            exportModal.classList.remove('show');
        });

        exportModal.addEventListener('click', (e) => {
            if (e.target === exportModal) {
                exportModal.classList.remove('show');
            }
        });

        exportOptions.forEach(option => {
            option.addEventListener('click', () => {
                const format = option.dataset.format;
                this.exportResume(format);
                exportModal.classList.remove('show');
            });
        });
    }

    exportResume(format) {
        const fileName = `resume_${new Date().toISOString().slice(0, 10)}`;
        
        if (format === 'markdown') {
            const markdown = this.generateMarkdown();
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            this.downloadFile(blob, `${fileName}.md`);
            this.showNotification('Markdown文件已下载');
        } else if (format === 'word') {
            // 生成Word文档内容
            const content = this.generateMarkdown();
            // 添加基本的HTML样式
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: 'Times New Roman', serif;
                            line-height: 1.6;
                            margin: 2.54cm;
                        }
                        h1 {
                            font-size: 24pt;
                            color: #2D3748;
                            text-align: center;
                            margin-bottom: 20pt;
                        }
                        h2 {
                            font-size: 18pt;
                            color: #2D3748;
                            margin: 16pt 0 10pt;
                            border-bottom: 1pt solid #E2E8F0;
                        }
                        h3 {
                            font-size: 14pt;
                            color: #4A5568;
                            margin: 12pt 0 8pt;
                        }
                        p {
                            margin: 8pt 0;
                        }
                        ul {
                            margin: 8pt 0;
                            padding-left: 20pt;
                        }
                    </style>
                </head>
                <body>
                    ${this.markdownToHtml(content)}
                </body>
                </html>
            `;

            // 创建Blob对象
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word;charset=utf-8' });
            this.downloadFile(blob, `${fileName}.doc`);
            this.showNotification('Word文档已下载');
        }
    }

    markdownToHtml(markdown) {
        // 简单的Markdown到HTML转换
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`)
            .replace(/<\/ul>\s*<ul>/g, '');
    }

    getCurrentTemplateStyles() {
        // 获取当前模板的样式
        switch (this.currentTemplate) {
            case 'classic':
                return `
                    .markdown-preview {
                        font-family: 'Times New Roman', serif;
                        line-height: 1.6;
                    }
                    .markdown-preview h1 {
                        font-size: 24pt;
                        color: #2D3748;
                        border-bottom: 2px solid #4A5568;
                        padding-bottom: 0.5rem;
                        margin-bottom: 1rem;
                    }
                    .markdown-preview h2 {
                        font-size: 18pt;
                        color: #2D3748;
                        border-bottom: 1px solid #E2E8F0;
                        padding-bottom: 0.25rem;
                        margin: 1.5rem 0 1rem;
                    }
                    .markdown-preview h3 {
                        font-size: 14pt;
                        color: #4A5568;
                        margin: 1rem 0 0.5rem;
                    }
                    .markdown-preview ul {
                        margin: 0.5rem 0;
                        padding-left: 1.5rem;
                    }
                    .markdown-preview p {
                        margin: 0.5rem 0;
                    }
                `;
            case 'modern':
                return `
                    .markdown-preview {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.7;
                    }
                    .markdown-preview h1 {
                        font-size: 26pt;
                        color: #2B6CB0;
                        text-align: center;
                        margin-bottom: 1.5rem;
                    }
                    .markdown-preview h2 {
                        font-size: 18pt;
                        color: #2C5282;
                        border-bottom: 2px solid #BEE3F8;
                        margin: 2rem 0 1rem;
                    }
                    .markdown-preview h3 {
                        font-size: 14pt;
                        color: #2A4365;
                        margin: 1.2rem 0 0.5rem;
                    }
                    .markdown-preview ul {
                        list-style-type: none;
                        padding-left: 1.2rem;
                    }
                    .markdown-preview ul li::before {
                        content: "•";
                        color: #4299E1;
                        font-weight: bold;
                        display: inline-block;
                        width: 1em;
                        margin-left: -1em;
                    }
                `;
            // ... 其他模板样式保持不变 ...
            default:
                return '';
        }
    }

    downloadFile(blob, fileName) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    setupTemplateSelector() {
        const templateSelect = document.getElementById('template-select');
        templateSelect.addEventListener('change', () => {
            this.currentTemplate = templateSelect.value;
            this.updatePreview();
        });
    }

    setupMobilePreview() {
        const previewToggle = document.querySelector('.preview-toggle');
        if (previewToggle) {
            previewToggle.addEventListener('click', () => {
                this.preview.classList.toggle('active');
                previewToggle.textContent = this.preview.classList.contains('active') ? '编辑' : '预览';
            });
        }
    }

    setupDataPersistence() {
        const saveButton = document.querySelector('.save-resume');
        const loadButton = document.querySelector('.load-resume');

        saveButton.addEventListener('click', () => {
            this.saveData();
        });

        loadButton.addEventListener('click', () => {
            this.loadSavedData();
        });
    }

    saveData() {
        const data = {
            sections: Array.from(this.editor.querySelectorAll('.section')).map(section => {
                const type = section.dataset.type;
                const inputs = {};
                section.querySelectorAll('input, textarea').forEach(input => {
                    inputs[input.className] = input.value;
                });
                return { type, inputs };
            }),
            template: this.currentTemplate
        };
        localStorage.setItem('resumeData', JSON.stringify(data));
        this.showNotification('简历已保存');
    }

    loadSavedData() {
        const savedData = localStorage.getItem('resumeData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // 清除现有sections
            this.editor.querySelectorAll('.section').forEach(section => {
                if (section.dataset.type !== 'basic') {
                    section.remove();
                }
            });

            // 加载保存的sections
            data.sections.forEach(sectionData => {
                if (sectionData.type !== 'basic') {
                    this.addSection(sectionData.type);
                }
                const section = this.editor.querySelector(`.section[data-type="${sectionData.type}"]`);
                if (section) {
                    Object.entries(sectionData.inputs).forEach(([className, value]) => {
                        const input = section.querySelector(`.${className}`);
                        if (input) input.value = value;
                    });
                }
            });

            // 设置模板
            if (data.template) {
                document.getElementById('template-select').value = data.template;
                this.currentTemplate = data.template;
            }

            this.updatePreview();
            this.showNotification('简历已加载');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updatePreview() {
        this.preview.classList.add('loading');
        const markdownContent = this.generateMarkdown();
        
        // 根据不同模板应用不同样式
        let templateStyles = '';
        switch (this.currentTemplate) {
            case 'classic':
                templateStyles = `
                    <style>
                        .markdown-preview {
                            font-family: 'Times New Roman', serif;
                            line-height: 1.6;
                            max-width: 800px;
                            margin: 0 auto;
                            color: #2D3748;
                            background: white;
                            padding: 2rem;
                        }
                        .markdown-preview h1 {
                            font-size: 2.2rem;
                            color: #2D3748;
                            border-bottom: 2px solid #4A5568;
                            padding-bottom: 0.5rem;
                            margin-bottom: 1rem;
                        }
                        .markdown-preview h2 {
                            font-size: 1.5rem;
                            color: #2D3748;
                            border-bottom: 1px solid #E2E8F0;
                            padding-bottom: 0.25rem;
                            margin-top: 1.5rem;
                            margin-bottom: 1rem;
                        }
                        .markdown-preview h3 {
                            font-size: 1.2rem;
                            color: #4A5568;
                            margin-top: 1rem;
                            margin-bottom: 0.5rem;
                        }
                        .markdown-preview ul {
                            list-style-type: disc;
                            padding-left: 1.5rem;
                            margin: 0.5rem 0;
                        }
                        .markdown-preview p {
                            margin: 0.5rem 0;
                            padding-left: 0.5rem;
                        }
                        .markdown-preview strong {
                            color: #2D3748;
                        }
                        .markdown-preview em {
                            color: #4A5568;
                        }
                    </style>
                `;
                break;
            case 'modern':
                templateStyles = `
                    <style>
                        .markdown-preview {
                            font-family: 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.7;
                            max-width: 850px;
                            margin: 0 auto;
                            color: #1A202C;
                            background: white;
                            padding: 2.5rem;
                        }
                        .markdown-preview h1 {
                            font-size: 2.5rem;
                            color: #2B6CB0;
                            text-align: center;
                            border: none;
                            margin-bottom: 1.5rem;
                            font-weight: 600;
                        }
                        .markdown-preview h2 {
                            font-size: 1.6rem;
                            color: #2C5282;
                            border: none;
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                            padding-bottom: 0.3rem;
                            border-bottom: 2px solid #BEE3F8;
                        }
                        .markdown-preview h3 {
                            font-size: 1.3rem;
                            color: #2A4365;
                            margin-top: 1.2rem;
                            margin-bottom: 0.5rem;
                        }
                        .markdown-preview ul {
                            list-style-type: none;
                            padding-left: 1.2rem;
                        }
                        .markdown-preview ul li::before {
                            content: "•";
                            color: #4299E1;
                            font-weight: bold;
                            display: inline-block;
                            width: 1em;
                            margin-left: -1em;
                        }
                        .markdown-preview p {
                            margin: 0.7rem 0;
                            padding-left: 0.5rem;
                        }
                        .markdown-preview strong {
                            color: #2A4365;
                            font-weight: 600;
                        }
                        .markdown-preview em {
                            color: #4A5568;
                            font-style: normal;
                            background: #EBF8FF;
                            padding: 0.1rem 0.3rem;
                            border-radius: 0.2rem;
                        }
                    </style>
                `;
                break;
            case 'professional':
                templateStyles = `
                    <style>
                        .markdown-preview {
                            font-family: 'Calibri', 'Segoe UI', sans-serif;
                            line-height: 1.6;
                            max-width: 900px;
                            margin: 0 auto;
                            color: #333333;
                            background: white;
                            padding: 2.5rem;
                            border: 1px solid #E5E7EB;
                        }
                        .markdown-preview h1 {
                            font-size: 2.4rem;
                            color: #1A365D;
                            border-bottom: 3px solid #2B6CB0;
                            padding-bottom: 0.5rem;
                            margin-bottom: 1.5rem;
                        }
                        .markdown-preview h2 {
                            font-size: 1.7rem;
                            color: #2B6CB0;
                            border-bottom: 1px solid #CBD5E0;
                            padding-bottom: 0.3rem;
                            margin-top: 2rem;
                            margin-bottom: 1rem;
                        }
                        .markdown-preview h3 {
                            font-size: 1.3rem;
                            color: #2D3748;
                            margin-top: 1.2rem;
                            margin-bottom: 0.5rem;
                            font-weight: 600;
                        }
                        .markdown-preview ul {
                            list-style-type: square;
                            padding-left: 1.5rem;
                            margin: 0.7rem 0;
                        }
                        .markdown-preview p {
                            margin: 0.7rem 0;
                            padding-left: 0.5rem;
                        }
                        .markdown-preview strong {
                            color: #2D3748;
                            font-weight: 600;
                        }
                        .markdown-preview em {
                            color: #4A5568;
                            font-style: italic;
                        }
                    </style>
                `;
                break;
            // ... existing templates ...
        }

        const htmlContent = marked.parse(markdownContent);
        this.preview.querySelector('.markdown-preview').innerHTML = templateStyles + htmlContent;
        
        setTimeout(() => {
            this.preview.classList.remove('loading');
        }, 300);
    }

    generateMarkdown() {
        const sections = [...document.querySelectorAll('.section')];
        let markdown = '';
        let experienceSections = [];

        // 先处理基本信息
        const basicSection = sections.find(section => section.dataset.type === 'basic');
        if (basicSection) {
            markdown += this.generateBasicInfo(basicSection);
            markdown += '\n\n';
        }

        // 收集所有工作经验
        sections.forEach(section => {
            if (section.dataset.type === 'experience') {
                experienceSections.push(section);
            }
        });

        // 如果有工作经验，统一生成
        if (experienceSections.length > 0) {
            markdown += '## 工作经验\n\n';
            experienceSections.forEach(section => {
                markdown += this.generateExperienceItem(section);
            });
        }

        // 处理其他类型的板块
        sections.forEach(section => {
            const type = section.dataset.type;
            if (type !== 'basic' && type !== 'experience') {
                switch(type) {
                    case 'education':
                        markdown += this.generateEducation(section);
                        break;
                    case 'skills':
                        markdown += this.generateSkills(section);
                        break;
                    case 'projects':
                        markdown += this.generateProjects(section);
                        break;
                    case 'custom':
                        markdown += this.generateCustom(section);
                        break;
                }
                markdown += '\n\n';
            }
        });

        return markdown;
    }

    generateExperienceItem(section) {
        const data = {
            company: section.querySelector('.company').value,
            position: section.querySelector('.position').value,
            duration: section.querySelector('.duration').value,
            description: section.querySelector('.description').value
        };

        if (!data.company && !data.position && !data.duration && !data.description) {
            return '';
        }
        
        // 改进工作经验的格式
        let markdown = `### ${data.company || ''}\n`;
        
        if (data.position && data.duration) {
            markdown += `**${data.position}** | *${data.duration}*\n\n`;
        } else {
            markdown += `${data.position ? `**${data.position}**\n\n` : ''}`;
            markdown += `${data.duration ? `*${data.duration}*\n\n` : ''}`;
        }

        // 处理工作描述，添加适当的缩进和格式化
        if (data.description) {
            const descriptionLines = data.description.split('\n').filter(line => line.trim());
            descriptionLines.forEach(line => {
                markdown += `- ${line.trim()}\n`;
            });
        }

        return markdown + '\n';
    }

    generateEducation(section) {
        const data = {
            school: section.querySelector('.school').value,
            degree: section.querySelector('.degree').value,
            graduation: section.querySelector('.graduation').value,
            major: section.querySelector('.major').value
        };

        if (!data.school && !data.degree && !data.graduation && !data.major) {
            return '';
        }
        
        return `## 教育背景
**${data.school || ''}**  
*${data.degree || ''}*  
${data.graduation ? `- 毕业时间: ${data.graduation}\n` : ''}\
${data.major ? `- 专业: ${data.major}\n` : ''}`;
    }

    generateSkills(section) {
        const skillItems = section.querySelectorAll('.skill-item');
        let skillsMarkdown = '## 技能\n';
        
        skillItems.forEach(item => {
            const skill = item.querySelector('.skill-name').value;
            if (skill) {
                skillsMarkdown += `- ${skill}\n`;
            }
        });

        return skillsMarkdown.trim();
    }

    generateProjects(section) {
        const data = {
            name: section.querySelector('.project-name').value,
            tech: section.querySelector('.tech-stack').value,
            description: section.querySelector('.project-description').value,
            responsibilities: section.querySelector('.responsibilities').value
        };

        if (!data.name && !data.tech && !data.description && !data.responsibilities) {
            return '';
        }
        
        return `## 项目经历
**${data.name || ''}**  
*技术栈: ${data.tech || ''}*  

${data.description || ''}

**职责:**  
${data.responsibilities || ''}`;
    }

    generateCustom(section) {
        const data = {
            title: section.querySelector('.custom-title').value,
            content: section.querySelector('.custom-content').value
        };

        if (!data.title && !data.content) {
            return '';
        }
        
        return `## ${data.title || ''}
${data.content || ''}`;
    }

    generateBasicInfo(section) {
        const data = {
            name: section.querySelector('.name').value,
            phone: section.querySelector('.phone').value,
            email: section.querySelector('.email').value,
            address: section.querySelector('.address').value,
            summary: section.querySelector('.summary').value
        };

        if (!data.name && !data.phone && !data.email && !data.address && !data.summary) {
            return '';
        }
        
        return `# ${data.name || ''}
${data.phone ? `- 电话: ${data.phone}\n` : ''}\
${data.email ? `- 邮箱: ${data.email}\n` : ''}\
${data.address ? `- 地址: ${data.address}\n` : ''}

${data.summary || ''}`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ResumeGenerator();
});

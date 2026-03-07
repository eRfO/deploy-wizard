/**
 * Deploy Wizard - Main Application
 * 
 * Telegram Mini App for collecting deploy configuration
 * and triggering deployment processes.
 */

class DeployWizard {
    constructor(config) {
        this.config = config;
        this.questions = [];
        this.currentStep = 0;
        this.answers = {};
        this.tg = window.Telegram?.WebApp;
        this.isLoading = true;
        
        this.init();
    }
    
    /**
     * Initialize the application.
     */
    async init() {
        // Initialize Telegram WebApp
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            
            // Apply Telegram theme
            this.applyTelegramTheme();
            
            // Handle back button
            this.tg.BackButton.onClick(() => this.prevStep());
        }
        
        // Set app title (from local config initially)
        document.getElementById('app-title').textContent = this.config.app.title;
        document.getElementById('app-subtitle').textContent = this.config.app.subtitle;
        
        // Show loading state
        this.showLoadingState(true);
        
        // Load questions from backend
        try {
            await this.loadQuestionsFromBackend();
        } catch (error) {
            console.error('Failed to load questions from backend, using fallback:', error);
            // Fallback to local config
            this.questions = this.config.questions || [];
            this.showToast('Usando configurazione locale', 'info');
        }
        
        if (this.questions.length === 0) {
            this.showError('Nessuna domanda configurata');
            return;
        }
        
        // Hide loading, show content
        this.showLoadingState(false);
        
        // Setup MainButton if configured
        if (this.config.app.useTelegramMainButton) {
            this.setupTelegramMainButton();
        }
        
        // Initialize answers with defaults
        this.initializeDefaults();
        
        // Render first question
        this.renderQuestion();
        this.updateProgress();
        
        // Setup navigation buttons
        this.setupNavigation();
    }
    
    /**
     * Load questions configuration from backend.
     */
    async loadQuestionsFromBackend() {
        const url = `${this.config.app.backendUrl.replace('/deploy', '')}/config/questions`;
        
        console.log('Loading questions from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Telegram-Init-Data': this.tg?.initData || ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update app config if provided
        if (data.app) {
            Object.assign(this.config.app, data.app);
            document.getElementById('app-title').textContent = this.config.app.title;
            document.getElementById('app-subtitle').textContent = this.config.app.subtitle;
        }
        
        // Set questions
        this.questions = data.questions || [];
        
        console.log(`Loaded ${this.questions.length} questions from backend`);
    }
    
    /**
     * Show/hide loading state.
     */
    showLoadingState(show) {
        this.isLoading = show;
        
        const container = document.getElementById('question-container');
        const navigation = document.querySelector('.navigation');
        const progress = document.querySelector('.progress-container');
        
        if (show) {
            container.innerHTML = `
                <div class="loading-questions">
                    <div class="spinner"></div>
                    <p>Caricamento configurazione...</p>
                </div>
            `;
            navigation.style.display = 'none';
            progress.style.display = 'none';
        } else {
            navigation.style.display = 'flex';
            progress.style.display = 'block';
        }
    }
    
    /**
     * Show error state.
     */
    showError(message) {
        const container = document.getElementById('question-container');
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Errore</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Riprova</button>
            </div>
        `;
        document.querySelector('.navigation').style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
    }
    
    /**
     * Apply Telegram theme colors to CSS variables.
     */
    applyTelegramTheme() {
        if (!this.tg?.themeParams) return;
        
        const root = document.documentElement;
        const theme = this.tg.themeParams;
        
        if (theme.bg_color) root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
        if (theme.text_color) root.style.setProperty('--tg-theme-text-color', theme.text_color);
        if (theme.hint_color) root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
        if (theme.link_color) root.style.setProperty('--tg-theme-link-color', theme.link_color);
        if (theme.button_color) root.style.setProperty('--tg-theme-button-color', theme.button_color);
        if (theme.button_text_color) root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
        if (theme.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
    }
    
    /**
     * Setup Telegram's MainButton.
     */
    setupTelegramMainButton() {
        if (!this.tg?.MainButton) return;
        
        this.tg.MainButton.setText('Avanti →');
        this.tg.MainButton.show();
        this.tg.MainButton.onClick(() => this.handleMainButtonClick());
    }
    
    /**
     * Handle MainButton click based on current state.
     */
    handleMainButtonClick() {
        if (this.isLastStep()) {
            this.submitDeploy();
        } else if (this.isSummaryVisible()) {
            this.submitDeploy();
        } else {
            this.nextStep();
        }
    }
    
    /**
     * Initialize answers with default values.
     */
    initializeDefaults() {
        this.questions.forEach(question => {
            if (question.type === 'toggle') {
                // Initialize toggle values
                this.answers[question.id] = {};
                question.options.forEach(opt => {
                    this.answers[question.id][opt.value] = opt.default || false;
                });
            } else if (question.type === 'checkbox') {
                // Initialize checkbox as empty array
                this.answers[question.id] = [];
            } else if (question.type === 'radio') {
                // Set default radio value if exists
                const defaultOpt = question.options.find(o => o.default);
                if (defaultOpt) {
                    this.answers[question.id] = defaultOpt.value;
                }
            } else if (question.type === 'text') {
                this.answers[question.id] = '';
            }
        });
    }
    
    /**
     * Setup navigation button event listeners.
     */
    setupNavigation() {
        document.getElementById('btn-prev').addEventListener('click', () => this.prevStep());
        document.getElementById('btn-next').addEventListener('click', () => this.nextStep());
        document.getElementById('btn-submit').addEventListener('click', () => this.submitDeploy());
    }
    
    /**
     * Render the current question.
     */
    renderQuestion() {
        const question = this.questions[this.currentStep];
        const container = document.getElementById('question-container');
        
        let html = `
            <div class="question">
                <h2 class="question-title">${question.title}</h2>
                ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
        `;
        
        switch (question.type) {
            case 'radio':
                html += this.renderRadioOptions(question);
                break;
            case 'checkbox':
                html += this.renderCheckboxOptions(question);
                break;
            case 'toggle':
                html += this.renderToggleOptions(question);
                break;
            case 'text':
                html += this.renderTextInput(question);
                break;
        }
        
        html += '</div>';
        container.innerHTML = html;
        
        // Attach event listeners
        this.attachOptionListeners(question);
    }
    
    /**
     * Render radio button options.
     */
    renderRadioOptions(question) {
        const currentValue = this.answers[question.id];
        
        let html = '<div class="options-list">';
        
        question.options.forEach(option => {
            const isSelected = currentValue === option.value;
            html += `
                <label class="option-item ${isSelected ? 'selected' : ''}" data-value="${option.value}">
                    <input type="radio" name="${question.id}" value="${option.value}" ${isSelected ? 'checked' : ''}>
                    <span class="option-radio"></span>
                    <div class="option-content">
                        <span class="option-label">${option.label}</span>
                        ${option.hint ? `<span class="option-hint">${option.hint}</span>` : ''}
                    </div>
                </label>
            `;
        });
        
        html += '</div>';
        
        // Add conditional text input if configured
        if (question.conditionalInput) {
            const ci = question.conditionalInput;
            const showInput = currentValue === ci.triggerValue;
            const inputValue = this.answers[ci.inputId] || '';
            
            html += `
                <div class="text-input-container" id="conditional-${ci.inputId}" style="display: ${showInput ? 'block' : 'none'}; margin-top: 16px;">
                    <input type="text" 
                           class="text-input" 
                           id="${ci.inputId}" 
                           placeholder="${ci.placeholder || ''}"
                           value="${inputValue}">
                </div>
            `;
        }
        
        return html;
    }
    
    /**
     * Render checkbox options.
     */
    renderCheckboxOptions(question) {
        const currentValues = this.answers[question.id] || [];
        
        let html = '<div class="options-list">';
        
        question.options.forEach(option => {
            const isSelected = currentValues.includes(option.value);
            html += `
                <label class="option-item ${isSelected ? 'selected' : ''}" data-value="${option.value}">
                    <input type="checkbox" name="${question.id}" value="${option.value}" ${isSelected ? 'checked' : ''}>
                    <span class="option-checkbox"></span>
                    <div class="option-content">
                        <span class="option-label">${option.label}</span>
                        ${option.hint ? `<span class="option-hint">${option.hint}</span>` : ''}
                    </div>
                </label>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Render toggle switch options.
     */
    renderToggleOptions(question) {
        const currentValues = this.answers[question.id] || {};
        
        let html = '<div class="toggle-list">';
        
        question.options.forEach(option => {
            const isEnabled = currentValues[option.value] || false;
            html += `
                <div class="toggle-item">
                    <div class="toggle-content">
                        <span class="toggle-label">${option.label}</span>
                        ${option.hint ? `<span class="toggle-hint">${option.hint}</span>` : ''}
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" data-key="${option.value}" ${isEnabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    /**
     * Render text input.
     */
    renderTextInput(question) {
        const currentValue = this.answers[question.id] || '';
        const maxLength = question.validation?.maxLength || '';
        
        return `
            <div class="text-input-container">
                <input type="text" 
                       class="text-input" 
                       id="${question.id}" 
                       placeholder="${question.placeholder || ''}"
                       value="${currentValue}"
                       ${maxLength ? `maxlength="${maxLength}"` : ''}>
            </div>
        `;
    }
    
    /**
     * Attach event listeners to option elements.
     */
    attachOptionListeners(question) {
        switch (question.type) {
            case 'radio':
                document.querySelectorAll(`input[name="${question.id}"]`).forEach(input => {
                    input.addEventListener('change', (e) => {
                        this.answers[question.id] = e.target.value;
                        this.updateOptionStyles(question.id, 'radio');
                        
                        // Handle conditional input visibility
                        if (question.conditionalInput) {
                            const ci = question.conditionalInput;
                            const container = document.getElementById(`conditional-${ci.inputId}`);
                            if (container) {
                                container.style.display = e.target.value === ci.triggerValue ? 'block' : 'none';
                            }
                        }
                        
                        // Haptic feedback
                        this.tg?.HapticFeedback?.selectionChanged();
                    });
                });
                
                // Conditional input listener
                if (question.conditionalInput) {
                    const ci = question.conditionalInput;
                    const input = document.getElementById(ci.inputId);
                    if (input) {
                        input.addEventListener('input', (e) => {
                            this.answers[ci.inputId] = e.target.value;
                        });
                    }
                }
                break;
                
            case 'checkbox':
                document.querySelectorAll(`input[name="${question.id}"]`).forEach(input => {
                    input.addEventListener('change', (e) => {
                        const value = e.target.value;
                        if (e.target.checked) {
                            if (!this.answers[question.id].includes(value)) {
                                this.answers[question.id].push(value);
                            }
                        } else {
                            this.answers[question.id] = this.answers[question.id].filter(v => v !== value);
                        }
                        this.updateOptionStyles(question.id, 'checkbox');
                        this.tg?.HapticFeedback?.selectionChanged();
                    });
                });
                break;
                
            case 'toggle':
                document.querySelectorAll('.toggle-switch input').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const key = e.target.dataset.key;
                        this.answers[question.id][key] = e.target.checked;
                        this.tg?.HapticFeedback?.selectionChanged();
                    });
                });
                break;
                
            case 'text':
                const textInput = document.getElementById(question.id);
                if (textInput) {
                    textInput.addEventListener('input', (e) => {
                        this.answers[question.id] = e.target.value;
                    });
                }
                break;
        }
    }
    
    /**
     * Update visual styles for selected options.
     */
    updateOptionStyles(questionId, type) {
        document.querySelectorAll(`input[name="${questionId}"]`).forEach(input => {
            const label = input.closest('.option-item');
            if (label) {
                label.classList.toggle('selected', input.checked);
            }
        });
    }
    
    /**
     * Validate the current question's answer.
     */
    validateCurrentAnswer() {
        const question = this.questions[this.currentStep];
        
        if (!question.required) return true;
        
        const answer = this.answers[question.id];
        
        switch (question.type) {
            case 'radio':
                if (!answer) {
                    this.showToast('Seleziona un\'opzione', 'error');
                    return false;
                }
                // Validate conditional input if visible
                if (question.conditionalInput && answer === question.conditionalInput.triggerValue) {
                    const ci = question.conditionalInput;
                    const inputValue = this.answers[ci.inputId];
                    if (!inputValue || inputValue.trim() === '') {
                        this.showToast('Compila il campo richiesto', 'error');
                        return false;
                    }
                    if (ci.validation?.pattern) {
                        const regex = new RegExp(ci.validation.pattern);
                        if (!regex.test(inputValue)) {
                            this.showToast(ci.validation.message || 'Valore non valido', 'error');
                            return false;
                        }
                    }
                }
                return true;
                
            case 'checkbox':
                if (!answer || answer.length === 0) {
                    this.showToast('Seleziona almeno un\'opzione', 'error');
                    return false;
                }
                return true;
                
            case 'text':
                if (!answer || answer.trim() === '') {
                    this.showToast('Compila il campo richiesto', 'error');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }
    
    /**
     * Go to next step.
     */
    nextStep() {
        if (!this.validateCurrentAnswer()) {
            this.tg?.HapticFeedback?.notificationOccurred('error');
            return;
        }
        
        if (this.currentStep < this.questions.length - 1) {
            this.currentStep++;
            this.renderQuestion();
            this.updateProgress();
            this.tg?.HapticFeedback?.impactOccurred('light');
        } else {
            // Show summary
            this.showSummary();
        }
    }
    
    /**
     * Go to previous step.
     */
    prevStep() {
        if (this.isSummaryVisible()) {
            this.hideSummary();
            return;
        }
        
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderQuestion();
            this.updateProgress();
            this.tg?.HapticFeedback?.impactOccurred('light');
        }
    }
    
    /**
     * Check if we're on the last question.
     */
    isLastStep() {
        return this.currentStep === this.questions.length - 1;
    }
    
    /**
     * Check if summary is currently visible.
     */
    isSummaryVisible() {
        return document.getElementById('summary-container').style.display !== 'none';
    }
    
    /**
     * Update progress bar and navigation buttons.
     */
    updateProgress() {
        const progress = ((this.currentStep + 1) / this.questions.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `Step ${this.currentStep + 1} / ${this.questions.length}`;
        
        // Update navigation buttons
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        
        btnPrev.disabled = this.currentStep === 0;
        btnNext.textContent = this.isLastStep() ? 'Riepilogo →' : 'Avanti →';
        
        // Update Telegram buttons
        if (this.tg) {
            if (this.currentStep > 0) {
                this.tg.BackButton.show();
            } else {
                this.tg.BackButton.hide();
            }
            
            if (this.config.app.useTelegramMainButton) {
                this.tg.MainButton.setText(this.isLastStep() ? 'Riepilogo →' : 'Avanti →');
            }
        }
    }
    
    /**
     * Show the summary view.
     */
    showSummary() {
        document.getElementById('question-container').style.display = 'none';
        document.querySelector('.navigation').style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
        
        const summaryContainer = document.getElementById('summary-container');
        summaryContainer.style.display = 'block';
        
        document.getElementById('summary-content').innerHTML = this.buildSummaryHtml();
        document.getElementById('btn-submit').textContent = this.config.app.submitButtonText;
        
        // Update Telegram MainButton
        if (this.tg && this.config.app.useTelegramMainButton) {
            this.tg.MainButton.setText(this.config.app.submitButtonText);
            this.tg.MainButton.color = '#28a745';
        }
        
        this.tg?.BackButton?.show();
    }
    
    /**
     * Hide summary and return to questions.
     */
    hideSummary() {
        document.getElementById('question-container').style.display = 'block';
        document.querySelector('.navigation').style.display = 'flex';
        document.querySelector('.progress-container').style.display = 'block';
        document.getElementById('summary-container').style.display = 'none';
        
        // Reset Telegram MainButton
        if (this.tg && this.config.app.useTelegramMainButton) {
            this.tg.MainButton.setText('Avanti →');
            this.tg.MainButton.color = this.tg.themeParams?.button_color || '#2481cc';
        }
    }
    
    /**
     * Build HTML for summary view.
     */
    buildSummaryHtml() {
        let html = '';
        
        this.questions.forEach(question => {
            const answer = this.answers[question.id];
            
            html += `<div class="summary-section">`;
            html += `<div class="summary-section-title">${question.title}</div>`;
            
            switch (question.type) {
                case 'radio':
                    const selectedOpt = question.options.find(o => o.value === answer);
                    let displayValue = selectedOpt?.label || answer || 'Non selezionato';
                    
                    // Add conditional input value if applicable
                    if (question.conditionalInput && answer === question.conditionalInput.triggerValue) {
                        const customValue = this.answers[question.conditionalInput.inputId];
                        if (customValue) {
                            displayValue = customValue;
                        }
                    }
                    
                    html += `<div class="summary-section-value">${displayValue}</div>`;
                    break;
                    
                case 'checkbox':
                    html += `<div class="summary-section-value list">`;
                    if (answer && answer.length > 0) {
                        answer.forEach(val => {
                            const opt = question.options.find(o => o.value === val);
                            html += `<span class="summary-tag">${opt?.label || val}</span>`;
                        });
                    } else {
                        html += `<span>Nessuna selezione</span>`;
                    }
                    html += `</div>`;
                    break;
                    
                case 'toggle':
                    html += `<div class="summary-section-value list">`;
                    question.options.forEach(opt => {
                        const isEnabled = answer?.[opt.value] || false;
                        html += `<span class="summary-tag ${isEnabled ? 'enabled' : 'disabled'}">${opt.label}: ${isEnabled ? 'ON' : 'OFF'}</span>`;
                    });
                    html += `</div>`;
                    break;
                    
                case 'text':
                    html += `<div class="summary-section-value">${answer || '<em>Non specificato</em>'}</div>`;
                    break;
            }
            
            html += `</div>`;
        });
        
        return html;
    }
    
    /**
     * Submit the deploy configuration.
     */
    async submitDeploy() {
        this.showLoading(true);
        
        try {
            // Prepare payload
            const payload = {
                timestamp: new Date().toISOString(),
                user: this.tg?.initDataUnsafe?.user || null,
                answers: this.answers
            };
            
            console.log('Deploy payload:', payload);
            
            // Send to backend
            const response = await fetch(this.config.app.backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include Telegram init data for validation
                    'X-Telegram-Init-Data': this.tg?.initData || ''
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const result = await response.json();
            
            this.showLoading(false);
            this.tg?.HapticFeedback?.notificationOccurred('success');
            this.showToast('Deploy avviato con successo!', 'success');
            
            // Close Mini App after short delay
            setTimeout(() => {
                if (this.tg) {
                    this.tg.close();
                }
            }, 2000);
            
        } catch (error) {
            console.error('Deploy error:', error);
            this.showLoading(false);
            this.tg?.HapticFeedback?.notificationOccurred('error');
            this.showToast('Errore durante l\'avvio del deploy', 'error');
        }
    }
    
    /**
     * Show/hide loading overlay.
     */
    showLoading(show) {
        document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
        
        if (this.tg?.MainButton) {
            if (show) {
                this.tg.MainButton.showProgress();
            } else {
                this.tg.MainButton.hideProgress();
            }
        }
    }
    
    /**
     * Show a toast notification.
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.deployWizard = new DeployWizard(DEPLOY_CONFIG);
});

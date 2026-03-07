/**
 * Deploy Wizard - Configuration
 * 
 * This file contains the base configuration for the Mini App.
 * Questions are loaded dynamically from the backend API.
 * 
 * The 'questions' array below serves as a FALLBACK in case
 * the backend is unreachable.
 * 
 * Conditional Branching:
 *   - showConditions: Show question only if conditions are met
 *   - branchRules: Jump to different questions based on answers
 *   - terminal: End questionnaire after this question
 * 
 * Condition Operators:
 *   EQUALS, NOT_EQUALS, IN, NOT_IN, CONTAINS, NOT_CONTAINS,
 *   IS_EMPTY, IS_NOT_EMPTY, GREATER_THAN, LESS_THAN
 */

const DEPLOY_CONFIG = {
    // App configuration
    app: {
        title: "Deploy Wizard",
        subtitle: "Configura il tuo deployment",
        submitButtonText: "🚀 Avvia Deploy",
        // IMPORTANT: Set this to your backend URL
        backendUrl: "https://your-backend-url.com/api/deploy",
        // Set to true to use Telegram's MainButton instead of custom button
        useTelegramMainButton: true
    },

    // Fallback questions (used only if backend is unreachable)
    // In production, these are loaded from: GET /api/config/questions
    questions: [
        // ============================================================
        // STEP 1: Environment Selection (always shown)
        // ============================================================
        {
            id: "environment",
            type: "radio",
            title: "Seleziona l'ambiente di destinazione",
            description: "Su quale ambiente vuoi effettuare il deploy?",
            required: true,
            options: [
                { value: "dev", label: "Development", hint: "Ambiente di sviluppo" },
                { value: "staging", label: "Staging", hint: "Ambiente di pre-produzione" },
                { value: "prod", label: "Production", hint: "⚠️ Ambiente di produzione" }
            ],
            // Branch based on environment selection
            branchRules: [
                {
                    // If prod is selected, go to production confirmation first
                    conditions: [
                        { questionId: "environment", operator: "EQUALS", value: "prod" }
                    ],
                    nextQuestionId: "prodConfirmation"
                }
            ]
        },

        // ============================================================
        // STEP 1b: Production Confirmation (only for prod)
        // ============================================================
        {
            id: "prodConfirmation",
            type: "radio",
            title: "⚠️ Conferma Deploy in Produzione",
            description: "Stai per deployare in PRODUZIONE. Sei sicuro di voler procedere?",
            required: true,
            // Only show this if environment is prod
            showConditions: [
                { questionId: "environment", operator: "EQUALS", value: "prod" }
            ],
            options: [
                { 
                    value: "confirm", 
                    label: "Sì, procedi con il deploy in produzione",
                    hint: "Ho verificato tutto ed è pronto per la produzione"
                },
                { 
                    value: "cancel", 
                    label: "No, torna indietro",
                    hint: "Voglio ricontrollare prima di procedere"
                }
            ],
            branchRules: [
                {
                    // If cancelled, skip to summary
                    conditions: [
                        { questionId: "prodConfirmation", operator: "EQUALS", value: "cancel" }
                    ],
                    skipToSummary: true
                }
            ]
        },

        // ============================================================
        // STEP 2: Branch Selection
        // ============================================================
        {
            id: "branch",
            type: "radio",
            title: "Seleziona il branch o la versione",
            description: "Quale versione del codice vuoi deployare?",
            required: true,
            options: [
                { value: "main", label: "main", hint: "Branch principale stabile", default: true },
                { value: "develop", label: "develop", hint: "Branch di sviluppo" },
                { value: "release", label: "release/*", hint: "Ultimo branch di release" },
                { value: "hotfix", label: "hotfix/*", hint: "Fix urgente" },
                { value: "custom", label: "Altro...", hint: "Specifica manualmente" }
            ],
            conditionalInput: {
                triggerValue: "custom",
                inputId: "customBranch",
                placeholder: "es: feature/my-feature",
                validation: {
                    pattern: "^[a-zA-Z0-9/_-]+$",
                    message: "Branch name non valido"
                }
            }
        },

        // ============================================================
        // STEP 3: Hotfix Details (only for hotfix branch)
        // ============================================================
        {
            id: "hotfixDetails",
            type: "text",
            title: "Dettagli Hotfix",
            description: "Descrivi brevemente il problema che stai risolvendo",
            required: true,
            placeholder: "Es: Fix bug login utenti enterprise",
            // Only show if branch is hotfix
            showConditions: [
                { questionId: "branch", operator: "EQUALS", value: "hotfix" }
            ],
            validation: {
                minLength: 10,
                maxLength: 200
            }
        },

        // ============================================================
        // STEP 4: Module Selection
        // ============================================================
        {
            id: "modules",
            type: "checkbox",
            title: "Seleziona i moduli da deployare",
            description: "Puoi selezionare uno o più moduli",
            required: true,
            options: [
                { value: "api-gateway", label: "API Gateway", hint: "Gateway principale" },
                { value: "auth-service", label: "Auth Service", hint: "Servizio di autenticazione" },
                { value: "payment-service", label: "Payment Service", hint: "Gestione pagamenti" },
                { value: "notification-service", label: "Notification Service", hint: "Email, SMS, Push" },
                { value: "reporting-service", label: "Reporting Service", hint: "Report e analytics" },
                { value: "frontend", label: "Frontend Web", hint: "Applicazione web" }
            ]
        },

        // ============================================================
        // STEP 5: Database Migration (only if certain modules selected)
        // ============================================================
        {
            id: "dbMigration",
            type: "radio",
            title: "Migrazione Database",
            description: "Questo deploy richiede modifiche al database?",
            required: true,
            // Show only if payment-service is selected
            showConditions: [
                { questionId: "modules", operator: "CONTAINS", value: "payment-service" }
            ],
            options: [
                { value: "none", label: "Nessuna migrazione", hint: "Solo codice applicativo", default: true },
                { value: "auto", label: "Migrazione automatica (Flyway)", hint: "Esegui script di migrazione automaticamente" },
                { value: "manual", label: "Migrazione manuale richiesta", hint: "DBA eseguirà gli script separatamente" }
            ],
            branchRules: [
                {
                    // If manual migration, ask for DBA confirmation
                    conditions: [
                        { questionId: "dbMigration", operator: "EQUALS", value: "manual" }
                    ],
                    nextQuestionId: "dbaConfirmation"
                }
            ]
        },

        // ============================================================
        // STEP 5b: DBA Confirmation (only for manual migration)
        // ============================================================
        {
            id: "dbaConfirmation",
            type: "radio",
            title: "Conferma DBA",
            description: "Il DBA ha già eseguito gli script di migrazione?",
            required: true,
            showConditions: [
                { questionId: "dbMigration", operator: "EQUALS", value: "manual" }
            ],
            options: [
                { value: "yes", label: "Sì, gli script sono stati eseguiti" },
                { value: "no", label: "No, devo ancora coordinarmi con il DBA" }
            ],
            branchRules: [
                {
                    conditions: [
                        { questionId: "dbaConfirmation", operator: "EQUALS", value: "no" }
                    ],
                    skipToSummary: true
                }
            ]
        },

        // ============================================================
        // STEP 6: Feature Flags (skip for dev environment)
        // ============================================================
        {
            id: "featureFlags",
            type: "toggle",
            title: "Feature Flags",
            description: "Abilita o disabilita le feature per questo deploy",
            required: false,
            // Don't show for dev environment
            showConditions: [
                { questionId: "environment", operator: "NOT_EQUALS", value: "dev" }
            ],
            options: [
                { value: "newDashboard", label: "Nuova Dashboard", hint: "Dashboard ridisegnata", default: false },
                { value: "betaFeatures", label: "Funzionalità Beta", hint: "Feature in fase di test", default: false },
                { value: "maintenanceMode", label: "Modalità Manutenzione", hint: "Mostra pagina di manutenzione", default: false },
                { value: "debugMode", label: "Debug Mode", hint: "Logging esteso", default: false }
            ]
        },

        // ============================================================
        // STEP 7: Rollback Configuration
        // ============================================================
        {
            id: "rollback",
            type: "radio",
            title: "Configurazione Rollback",
            description: "Cosa fare in caso di errore durante il deploy?",
            required: true,
            options: [
                { value: "auto", label: "Rollback Automatico", hint: "Ripristina automaticamente in caso di errore", default: true },
                { value: "manual", label: "Rollback Manuale", hint: "Attendi intervento manuale" },
                { value: "none", label: "Nessun Rollback", hint: "⚠️ Non consigliato per produzione" }
            ],
            branchRules: [
                {
                    // Warn if no rollback on production
                    conditions: [
                        { questionId: "rollback", operator: "EQUALS", value: "none" },
                        { questionId: "environment", operator: "EQUALS", value: "prod" }
                    ],
                    nextQuestionId: "noRollbackWarning"
                }
            ]
        },

        // ============================================================
        // STEP 7b: No Rollback Warning (prod + no rollback)
        // ============================================================
        {
            id: "noRollbackWarning",
            type: "radio",
            title: "⚠️ Attenzione: Nessun Rollback",
            description: "Hai selezionato 'Nessun Rollback' per un deploy in produzione. Questo è altamente sconsigliato.",
            required: true,
            showConditions: [
                { questionId: "rollback", operator: "EQUALS", value: "none" },
                { questionId: "environment", operator: "EQUALS", value: "prod" }
            ],
            conditionLogic: "AND",
            options: [
                { value: "understand", label: "Ho capito i rischi, procedi comunque" },
                { value: "reconsider", label: "Riconsidero, torna indietro" }
            ]
        },

        // ============================================================
        // STEP 8: Notifications
        // ============================================================
        {
            id: "notifications",
            type: "toggle",
            title: "Notifiche Post-Deploy",
            description: "Configura le notifiche al termine del deploy",
            required: false,
            options: [
                { value: "telegram", label: "Notifica Telegram", hint: "Ricevi aggiornamenti su Telegram", default: true },
                { value: "email", label: "Notifica Email", hint: "Invia email al team", default: false },
                { value: "slack", label: "Notifica Slack", hint: "Posta sul canale #deployments", default: true },
                { value: "webhook", label: "Webhook Custom", hint: "Chiama webhook esterno", default: false }
            ]
        },

        // ============================================================
        // STEP 9: Notes (always shown as last step)
        // ============================================================
        {
            id: "notes",
            type: "text",
            title: "Note aggiuntive",
            description: "Inserisci eventuali note o commenti per questo deploy (opzionale)",
            required: false,
            placeholder: "Es: Deploy hotfix per bug #1234",
            validation: {
                maxLength: 500
            }
        }
    ]
};

// Freeze config to prevent accidental modifications
Object.freeze(DEPLOY_CONFIG);
Object.freeze(DEPLOY_CONFIG.app);

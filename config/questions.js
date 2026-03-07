/**
 * Deploy Wizard - Questions Configuration
 * 
 * This file defines the questionnaire structure.
 * You can easily add, remove, or modify questions here.
 * 
 * Question Types:
 * - 'radio': Single selection (radio buttons)
 * - 'checkbox': Multiple selection (checkboxes)
 * - 'toggle': On/Off switches for feature flags
 * - 'text': Free text input
 * 
 * Each question object:
 * {
 *   id: string          - Unique identifier for the question
 *   type: string        - Question type (radio|checkbox|toggle|text)
 *   title: string       - Question title displayed to user
 *   description: string - Optional description/hint
 *   required: boolean   - Whether an answer is required
 *   options: array      - Options for radio/checkbox/toggle types
 *   placeholder: string - Placeholder for text inputs
 *   validation: object  - Optional validation rules for text inputs
 * }
 * 
 * Each option object:
 * {
 *   value: string       - Value sent to backend
 *   label: string       - Display label
 *   hint: string        - Optional hint text
 *   default: boolean    - Whether this is selected by default
 * }
 */

const DEPLOY_CONFIG = {
    // App configuration
    app: {
        title: "Deploy Wizard",
        subtitle: "Configura il tuo deployment",
        submitButtonText: "🚀 Avvia Deploy",
        backendUrl: "https://your-backend-url.com/api/deploy",
        // Set to true to use Telegram's MainButton instead of custom button
        useTelegramMainButton: true
    },

    // Questions array - order determines the flow
    questions: [
        {
            id: "environment",
            type: "radio",
            title: "Seleziona l'ambiente di destinazione",
            description: "Su quale ambiente vuoi effettuare il deploy?",
            required: true,
            options: [
                {
                    value: "dev",
                    label: "Development",
                    hint: "Ambiente di sviluppo"
                },
                {
                    value: "staging",
                    label: "Staging",
                    hint: "Ambiente di pre-produzione"
                },
                {
                    value: "prod",
                    label: "Production",
                    hint: "⚠️ Ambiente di produzione"
                }
            ]
        },
        {
            id: "branch",
            type: "radio",
            title: "Seleziona il branch o la versione",
            description: "Quale versione del codice vuoi deployare?",
            required: true,
            options: [
                {
                    value: "main",
                    label: "main",
                    hint: "Branch principale stabile",
                    default: true
                },
                {
                    value: "develop",
                    label: "develop",
                    hint: "Branch di sviluppo"
                },
                {
                    value: "release",
                    label: "release/*",
                    hint: "Ultimo branch di release"
                },
                {
                    value: "custom",
                    label: "Altro...",
                    hint: "Specifica manualmente"
                }
            ],
            // Conditional follow-up for custom selection
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
        {
            id: "modules",
            type: "checkbox",
            title: "Seleziona i moduli da deployare",
            description: "Puoi selezionare uno o più moduli",
            required: true,
            options: [
                {
                    value: "api-gateway",
                    label: "API Gateway",
                    hint: "Gateway principale"
                },
                {
                    value: "auth-service",
                    label: "Auth Service",
                    hint: "Servizio di autenticazione"
                },
                {
                    value: "payment-service",
                    label: "Payment Service",
                    hint: "Gestione pagamenti"
                },
                {
                    value: "notification-service",
                    label: "Notification Service",
                    hint: "Email, SMS, Push"
                },
                {
                    value: "reporting-service",
                    label: "Reporting Service",
                    hint: "Report e analytics"
                },
                {
                    value: "frontend",
                    label: "Frontend Web",
                    hint: "Applicazione web"
                }
            ]
        },
        {
            id: "featureFlags",
            type: "toggle",
            title: "Feature Flags",
            description: "Abilita o disabilita le feature per questo deploy",
            required: false,
            options: [
                {
                    value: "newDashboard",
                    label: "Nuova Dashboard",
                    hint: "Dashboard ridisegnata",
                    default: false
                },
                {
                    value: "betaFeatures",
                    label: "Funzionalità Beta",
                    hint: "Feature in fase di test",
                    default: false
                },
                {
                    value: "maintenanceMode",
                    label: "Modalità Manutenzione",
                    hint: "Mostra pagina di manutenzione",
                    default: false
                },
                {
                    value: "debugMode",
                    label: "Debug Mode",
                    hint: "Logging esteso",
                    default: false
                }
            ]
        },
        {
            id: "rollback",
            type: "radio",
            title: "Configurazione Rollback",
            description: "Cosa fare in caso di errore durante il deploy?",
            required: true,
            options: [
                {
                    value: "auto",
                    label: "Rollback Automatico",
                    hint: "Ripristina automaticamente in caso di errore",
                    default: true
                },
                {
                    value: "manual",
                    label: "Rollback Manuale",
                    hint: "Attendi intervento manuale"
                },
                {
                    value: "none",
                    label: "Nessun Rollback",
                    hint: "⚠️ Non consigliato per produzione"
                }
            ]
        },
        {
            id: "notifications",
            type: "toggle",
            title: "Notifiche Post-Deploy",
            description: "Configura le notifiche al termine del deploy",
            required: false,
            options: [
                {
                    value: "telegram",
                    label: "Notifica Telegram",
                    hint: "Ricevi aggiornamenti su Telegram",
                    default: true
                },
                {
                    value: "email",
                    label: "Notifica Email",
                    hint: "Invia email al team",
                    default: false
                },
                {
                    value: "slack",
                    label: "Notifica Slack",
                    hint: "Posta sul canale #deployments",
                    default: true
                },
                {
                    value: "webhook",
                    label: "Webhook Custom",
                    hint: "Chiama webhook esterno",
                    default: false
                }
            ]
        },
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
DEPLOY_CONFIG.questions.forEach(q => Object.freeze(q));

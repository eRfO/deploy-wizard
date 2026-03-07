# Telegram Deploy Wizard - Mini App

Una Telegram Mini App per configurare e avviare deployment tramite un questionario interattivo.

## 🚀 Features

- **Questionario configurabile**: Aggiungi/rimuovi domande facilmente via JSON
- **Tipi di domande**:
  - Radio buttons (selezione singola)
  - Checkbox (selezione multipla)
  - Toggle switches (on/off)
  - Text input (testo libero)
- **Tema Telegram**: Si adatta automaticamente al tema dell'utente
- **Validazione**: Controllo risposte obbligatorie
- **Riepilogo**: Visualizzazione riassuntiva prima dell'invio
- **Haptic feedback**: Feedback tattile nativo Telegram
- **Responsive**: Ottimizzato per mobile

## 📁 Struttura

```
telegram-deploy-miniapp/
├── index.html              # Entry point
├── css/
│   └── styles.css          # Stili con supporto tema Telegram
├── js/
│   └── app.js              # Logica applicativa
├── config/
│   └── questions.js        # Configurazione questionario
└── README.md
```

## ⚙️ Configurazione

### 1. Modifica le domande

Edita `config/questions.js` per personalizzare il questionario:

```javascript
const DEPLOY_CONFIG = {
    app: {
        title: "Deploy Wizard",
        subtitle: "Configura il tuo deployment",
        submitButtonText: "🚀 Avvia Deploy",
        backendUrl: "https://your-backend.com/api/deploy",
        useTelegramMainButton: true
    },
    questions: [
        {
            id: "myQuestion",
            type: "radio",  // radio | checkbox | toggle | text
            title: "La mia domanda",
            description: "Descrizione opzionale",
            required: true,
            options: [
                { value: "opt1", label: "Opzione 1", hint: "Hint opzionale" },
                { value: "opt2", label: "Opzione 2", default: true }
            ]
        }
    ]
};
```

### 2. Configura il backend URL

In `config/questions.js`, imposta l'URL del tuo backend:

```javascript
backendUrl: "https://your-backend.com/api/deploy"
```

### 3. Hosting

La Mini App deve essere hostata su HTTPS. Opzioni:

- **GitHub Pages**: Gratuito, facile setup
- **Netlify**: Deploy automatico da Git
- **Vercel**: Simile a Netlify
- **Server proprio**: Nginx/Apache con SSL

## 🔧 Setup Bot Telegram

### 1. Crea la Web App via BotFather

1. Apri [@BotFather](https://t.me/BotFather)
2. Seleziona il tuo bot con `/mybots`
3. `Bot Settings` → `Menu Button` → `Configure menu button`
4. Inserisci l'URL della tua Mini App (es: `https://yourdomain.com/deploy-wizard`)

### 2. Oppure via comando nel bot

```javascript
// Nel tuo bot handler
bot.onText(/\/deploy/, (msg) => {
    bot.sendMessage(msg.chat.id, "Configura il deploy:", {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: "🚀 Apri Deploy Wizard",
                    web_app: { url: "https://yourdomain.com/deploy-wizard" }
                }
            ]]
        }
    });
});
```

## 📤 Payload inviato al Backend

La Mini App invia un POST JSON al tuo backend:

```json
{
    "timestamp": "2024-01-15T10:30:00.000Z",
    "user": {
        "id": 123456789,
        "first_name": "Mario",
        "last_name": "Rossi",
        "username": "mariorossi",
        "language_code": "it"
    },
    "answers": {
        "environment": "prod",
        "branch": "main",
        "modules": ["api-gateway", "payment-service"],
        "featureFlags": {
            "newDashboard": true,
            "betaFeatures": false,
            "maintenanceMode": false,
            "debugMode": false
        },
        "rollback": "auto",
        "notifications": {
            "telegram": true,
            "email": false,
            "slack": true,
            "webhook": false
        },
        "notes": "Deploy hotfix per bug #1234"
    }
}
```

### Headers

```
Content-Type: application/json
X-Telegram-Init-Data: <telegram_init_data>
```

L'header `X-Telegram-Init-Data` contiene i dati firmati da Telegram per la validazione lato server.

## 🔒 Validazione Backend (Spring Boot)

```java
@RestController
@RequestMapping("/api")
public class DeployController {
    
    @Value("${telegram.bot.token}")
    private String botToken;
    
    @PostMapping("/deploy")
    public ResponseEntity<?> startDeploy(
            @RequestBody DeployRequest request,
            @RequestHeader("X-Telegram-Init-Data") String initData) {
        
        // Validate Telegram init data
        if (!validateTelegramData(initData, botToken)) {
            return ResponseEntity.status(403).body("Invalid Telegram data");
        }
        
        // Process deploy...
        return ResponseEntity.ok(Map.of("status", "started"));
    }
    
    private boolean validateTelegramData(String initData, String botToken) {
        // Implement HMAC-SHA256 validation
        // See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    }
}
```

## 🎨 Personalizzazione Stile

I colori si adattano automaticamente al tema Telegram. Per personalizzare:

```css
:root {
    --border-radius: 12px;
    --transition-speed: 0.2s;
    --spacing-md: 16px;
}
```

## 📝 Aggiungere nuove domande

### Esempio: Domanda con input condizionale

```javascript
{
    id: "version",
    type: "radio",
    title: "Versione",
    required: true,
    options: [
        { value: "latest", label: "Ultima versione" },
        { value: "specific", label: "Versione specifica" }
    ],
    conditionalInput: {
        triggerValue: "specific",
        inputId: "specificVersion",
        placeholder: "es: 1.2.3",
        validation: {
            pattern: "^\\d+\\.\\d+\\.\\d+$",
            message: "Formato: X.Y.Z"
        }
    }
}
```

### Esempio: Feature flags dinamici

```javascript
{
    id: "flags",
    type: "toggle",
    title: "Feature Flags",
    required: false,
    options: [
        { value: "featureA", label: "Feature A", default: true },
        { value: "featureB", label: "Feature B", default: false }
    ]
}
```

## 🧪 Test locale

1. Installa un server HTTP locale:
   ```bash
   npx serve .
   ```

2. Usa ngrok per HTTPS:
   ```bash
   ngrok http 3000
   ```

3. Configura l'URL ngrok nel BotFather

## 📱 Screenshot

La Mini App si integra nativamente con Telegram, supportando:
- Tema chiaro/scuro automatico
- MainButton nativo di Telegram
- BackButton per navigazione
- Haptic feedback

## License

MIT

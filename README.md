🔒 SecuLog

Custom Pino-based logger with support for:
	•	Loki transport (for general logs)
	•	Secure transport (for sensitive payloads, sent to your backend)

This package is designed for apps that need structured logging in production but also want nice, colorful logs in development.

⸻

🚀 Installation

npm install seculog
# or
yarn add seculog


⸻

⚙️ Usage

```javascript
const { createLogger } = require('seculog');

const logger = createLogger({
  env: process.env.NODE_ENV || 'development',
  appName: 'my-service',
  lokiUrl: process.env.LOKI_URL,         // Loki endpoint
  secureUrl: process.env.SECURE_LOG_URL, // Endpoint for sensitive logs
});

// Standard info/warn logs
logger.info("Server started on port 3000");
logger.warn("Disk space is getting low");

// Error log (goes to Loki only)
logger.error("Something went wrong", { userId: 123 });

// Secure error (short info → Loki, full payload → Secure transport)
const errorId = logger.secureError("Payment failed", { card: "**** **** **** 1234" });
console.log("Stored error with ID:", errorId);
```

⸻

🛠 Options

createLogger(options: LoggerOptions)

Option	Type	Default	Description
env	string	development	Environment (development → pretty logs, production → Loki/Secure)
appName	string	default-service	Service name, used as log label
lokiUrl	string	—	Loki endpoint (required in production if you want Loki logs)
secureUrl	string	—	Endpoint for secure logs (optional)


⸻

🔧 Secure Transport Endpoint

For secureError, you need a backend endpoint that accepts JSON logs:

Example (Hapi server):
```javascript
server.route({
  method: 'POST',
  path: '/log',
  handler: (request, h) => {
    const { error_id, source, payload } = request.payload;
    console.log("Secure log received:", error_id, source, payload);
    return { status: 'ok', error_id };
  },
});
```


⸻

🧪 Development Mode

When NODE_ENV !== "production", logs are shown with pino-pretty:

```
[12:34:56] INFO  (12345 on my-laptop): Server started on port 3000
```

No external dependencies required.

⸻

📦 TypeScript Support

Types are included via index.d.ts:

```javascript
import { createLogger, Logger } from "seculog";
```

```javascript
const logger: Logger = createLogger({ appName: "my-app" });
```


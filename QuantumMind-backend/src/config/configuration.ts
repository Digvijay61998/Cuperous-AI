export default () => ({
  server: {
    domain: process.env.SERVER_DOMAIN || "http://localhost:4000",
  },
  admin: {
    name: process.env.ADMIN_NAME || "Admin",
    // NOTE: the fallbacks below were intentionally NOT rebranded to JarCube.
    // They are not display strings — they identify existing state:
    //   admin@engage.com  matches the already-seeded admin account (and the
    //                     prefilled dev credentials in QuantumMind-ui/.env),
    //                     so changing it locks you out of local login.
    //   .../engage        is the name of the existing MongoDB database.
    //   bizbot            is the name of the live AWS S3 bucket.
    // Change each one only together with the corresponding account/DB/bucket.
    email: process.env.ADMIN_EMAIL || "admin@engage.com",
    password: process.env.ADMIN_PASSWORD || "admin@123",
  },
  session: {
    secret: process.env.SESSION_SECRET || "secret",
  },
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    url: process.env.MONGO_URI,
  },
  aws: {
    enabled: process.env.AWS_ENABLED || false,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
    s3: {
      bucket: process.env.AWS_S3_BUCKET || "jarCube",
    },
  },
  telegram: {
    token: process.env.TELEGRAM_TOKEN,
    botId: process.env.TELEGRAM_BOT_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "secretKey",
    signOptions: {
      expiresIn: process.env.JWT_EXPIRES_IN || "30m",

      issuer: process.env.JWT_ISSUER || "chatbot",
    },
    refreshExpiresInDays: process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 7,
  },
  mail: {
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    username: process.env.MAIL_USERNAME || "username",
    password: process.env.MAIL_PASSWORD || "password",
    from: process.env.MAIL_FROM || "help@engage.com",
    expiresIn: process.env.MAIL_EXPIRES_IN || 7 * 24 * 60 * 60 * 1000,
  },
  bcrypt: {
    saltOrRounds: parseInt(process.env.BCRYPT_SALT_OR_ROUNDS, 10) || 10,
  },
  tags: {
    defaultTags: process.env.TAGS_LIST || [
      "Marketing",
      "Sales",
      "Customer Service",
      "Human Resources",
      "IT",
      "Finance",
      "Operations",
      "Support",
      "General",
    ],
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  google: {
    translate: process.env.GOOGLE_TRANSLATE_KEY || "",
  },
  attributesList: [
    {
      value: "default_name",
      label: "Name",
    },
    {
      value: "default_email",
      label: "Email",
    },
    {
      value: "default_phone",
      label: "Phone",
    },
    {
      value: "default_address",
      label: "Address",
    },
    {
      value: "default_city",
      label: "City",
    },
    {
      value: "default_state",
      label: "State",
    },
    {
      value: "default_country",
      label: "Country",
    },
    {
      value: "default_zip",
      label: "Zip",
    },
    {
      value: "default_company",
      label: "Company",
    },
  ],
  languages: [
    {
      value: "en-t-i0-und",
      label: "English",
      code: "en",
    },
    {
      value: "es-t-i0-und",
      label: "Spanish",
      code: "es",
    },
    {
      value: "fr-t-i0-und",
      label: "French",
      code: "fr",
    },
    {
      label: "Khmer",
      value: "kh",
      code: "none",
    },
    {
      label: "Chinese",
      value: "yue-hant-t-i0-und",
      code: "none",
    },
    {
      label: "Hindi",
      value: "hi-t-i0-und",
      code: "none",
    },
    {
      label: "Russian",
      value: "ru-t-i0-und",
      code: "ru",
    },
  ],

  template: {
    storage: process.env.TEMPLATE_STORAGE || "local", // 'local' | 's3'
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || "secretKey",
  },
  social: {
    verifyToken: process.env.SOCIAL_VERIFY_TOKEN || "XuUUCx7699Fq",
    webhookBaseUrl: "http://localhost:4000/api",
    facebook: {
      baseUrl: "https://graph.facebook.com/v6.0",
    },
    telegram: {
      baseUrl: "https://api.telegram.org/bot",
      webhookUrl:
        process.env.TELEGRAM_WEBHOOK_URL ||
        "http://localhost:4000/api/telegram/webhook",
    },
    whatsapp: {
      baseUrl: "https://api.chat-api.com/instance",
    },
  },

  // WhatsApp Web (baileys) — native in-process engine ported from OpenWA.
  // Unlike the Meta Cloud API "whatsapp" platform, this drives a personal
  // WhatsApp Web session via QR / phone-number pairing. `dataPath` is where each
  // session's auth credentials are persisted (must be a stable, writable dir so
  // linked numbers survive a restart).
  whatsappWeb: {
    dataPath: process.env.WHATSAPP_WEB_DATA_PATH || "./data/whatsapp-web",
  },

  nlp: {
    url: process.env.NLP_URL || "http://localhost:5000",
  },

  scraper: {
    url: process.env.SCRAPER_URL || "http://localhost:4001",
  },

  ai: {
    // JarCube AI (RAG) service. See QuantumMind-ai repo.
    url: process.env.AI_URL || "http://localhost:8000",
    // Request timeout (ms) for AI query calls.
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 20000,
  },
  delay: {
    node: process.env.NODE_DELAY || 1000,
    message: process.env.MESSAGE_DELAY || 750,
  },

  // In-memory conversation state (SocketStateService) bounds.
  //
  // Social-platform conversations (WhatsApp/Telegram/Facebook) have no socket to
  // signal their end, so without these bounds their state entries accumulate for
  // the life of the process. An evicted entry is rebuilt from the bot's start
  // node on the visitor's next message, so eviction costs mid-flow progress, not
  // availability.
  socketState: {
    // How long an entry may sit untouched before it is eligible for eviction.
    idleTtlMs:
      parseInt(process.env.SOCKET_STATE_IDLE_TTL_MS, 10) || 2 * 60 * 60 * 1000,
    // Hard cap; the least-recently-used entries are dropped beyond it.
    maxEntries: parseInt(process.env.SOCKET_STATE_MAX_ENTRIES, 10) || 20000,
    // How often the sweep runs.
    sweepIntervalMs:
      parseInt(process.env.SOCKET_STATE_SWEEP_INTERVAL_MS, 10) || 5 * 60 * 1000,
  },
});

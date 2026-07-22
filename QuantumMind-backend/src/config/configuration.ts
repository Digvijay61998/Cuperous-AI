export default () => ({
  server: {
    domain: process.env.SERVER_DOMAIN || "http://localhost:4000",
  },
  admin: {
    name: process.env.ADMIN_NAME || "Admin",
    email: process.env.ADMIN_EMAIL || "admin@engage.com",
    password: process.env.ADMIN_PASSWORD || "admin@123",
  },
  session: {
    secret: process.env.SESSION_SECRET || "secret",
  },
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    url: process.env.MONGO_URI || "mongodb://localhost:27017/engage",
  },
  aws: {
    enabled: process.env.AWS_ENABLED || false,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "us-east-1",
    s3: {
      bucket: process.env.AWS_S3_BUCKET || "bizbot",
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

  nlp: {
    url: process.env.NLP_URL || "http://localhost:5000",
  },

  scraper: {
    url: process.env.SCRAPER_URL || "http://localhost:4001",
  },

  ai: {
    // QuantumMind AI (RAG) service. See QuantumMind-ai repo.
    url: process.env.AI_URL || "http://localhost:8000",
    // Request timeout (ms) for AI query calls.
    timeout: parseInt(process.env.AI_TIMEOUT, 10) || 20000,
  },
  delay: {
    node: process.env.NODE_DELAY || 1000,
    message: process.env.MESSAGE_DELAY || 750,
  },
});

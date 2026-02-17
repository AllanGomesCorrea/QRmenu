export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origins: process.env.CORS_ORIGINS || '*',
  },

  // Security settings
  security: {
    maxSessionsPerTable: 10,
    sessionTimeout: '4h',
    maxVerificationAttempts: 3,
    verificationCodeTTL: 300, // 5 minutes in seconds
    cooldownBetweenCodes: 60, // 60 seconds
    maxOrdersPerMinute: 5,
    maxItemsPerOrder: 20,
    // Global geolocation flag - set to 'false' to disable geolocation checks
    geolocationEnabled: process.env.GEOLOCATION_ENABLED !== 'false',
  },

  // Integrations (mock by default)
  whatsapp: {
    apiToken: process.env.WHATSAPP_API_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    enabled: !!process.env.WHATSAPP_API_TOKEN,
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled: !!process.env.TWILIO_ACCOUNT_SID,
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // 'local', 's3', 'cloudinary'
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'sa-east-1',
      bucket: process.env.AWS_S3_BUCKET,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
  },
});


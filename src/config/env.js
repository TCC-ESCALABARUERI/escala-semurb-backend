import 'dotenv/config'

const required = ['DATABASE_URL', 'JWT_SECRET']
for (const key of required) {
  if (!process.env[key]) throw new Error(`Variável de ambiente ausente: ${key}`)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN?.split(',') ?? '*',

  databaseUrl: process.env.DATABASE_URL,
  // Em serverless (Vercel) cada instância deve abrir poucas conexões
  dbMaxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 10,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',

  // Master não fica no banco: credencial vem do ambiente (senha como hash bcrypt)
  master: {
    registration: process.env.MASTER_REGISTRATION,
    passwordHash: process.env.MASTER_PASSWORD_HASH
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Escala SEMURB <no-reply@semurb.local>'
  },

  saltRounds: Number(process.env.SALT_ROUNDS) || 10
}

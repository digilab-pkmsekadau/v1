const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

type EnvVar = (typeof REQUIRED_ENV_VARS)[number]

function isServer() {
  return typeof window === 'undefined'
}

export function validateEnv() {
  const missingVars: EnvVar[] = []

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar]
    if (!value || value.trim() === '') {
      missingVars.push(envVar)
    }
  }

  if (missingVars.length > 0 && isServer()) {
    const errorMessage = `
Environment Validation Error:
Missing required environment variables:

${missingVars.map(v => `  - ${v}`).join('\n')}

Please add them to your .env.local file and restart the server.
`
    console.error(errorMessage)
    // Gagal keras di server (termasuk produksi) agar konfigurasi env yang hilang
    // tidak diam-diam membuat auth memakai kredensial dummy dan fail-open.
    throw new Error('Missing required environment variables')
  }

  return {
    success: missingVars.length === 0,
    missing: missingVars,
  }
}



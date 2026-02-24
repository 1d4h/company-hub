module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TMAP_APP_KEY: 'vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB',
        SUPABASE_URL: 'https://peelrrycglnqdcxtllfr.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZWxycnljZ2xucWRjeHRsbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5OTg1OTcsImV4cCI6MjA1NDU3NDU5N30.oLsBnlXxnlJE8njdKwkMZ22Q9w6Rfy5lXAhgP4vBCQ4'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}

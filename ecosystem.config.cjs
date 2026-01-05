module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TMAP_APP_KEY: 'vSWmSa8CcO4uvyc0EsAg46SWvxNVAKzL8KGbckPB'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}

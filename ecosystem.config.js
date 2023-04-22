module.exports = {
  apps: [
    {
      name: 'my-app',
      script: 'server.js',
      watch: false,
      restart_delay: 1000,
      cron_restart: '0 0 * * *',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};

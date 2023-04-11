module.exports = {
    apps: [
      {
        name: 'my-app',
        script: 'server.js',
        watch: true,
        restart_delay: 1000,
        cron_restart: '0 0 * * *',
      },
    ],
  };
module.exports = {
  apps: [
    {
      name: 'movie-management-api',
      script: 'node dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3077,
      },
    },
  ],
};

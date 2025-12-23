module.exports = {
  apps: [
    {
      name: 'movie-management-api',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        ENV_PATH: '/etc/secrets/movie-management-api',
      },
    },
  ],
};

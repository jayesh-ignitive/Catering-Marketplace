module.exports = {
  apps: [
    {
      name: "app_catering_frontend",
      cwd: __dirname,
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 7001,
      },
    },
  ],
};

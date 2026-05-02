module.exports = {
  apps: [
    {
      name: "app_catering_backend",
      cwd: __dirname,
      script: "dist/main.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 7002,
      },
    },
  ],
};

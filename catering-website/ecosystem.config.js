const port = Number(
  process.env.PORT || process.env.FRONTEND_PORT || 7002,
);

if (!Number.isFinite(port) || port <= 0) {
  throw new Error(
    "Invalid PORT / FRONTEND_PORT for ecosystem.config.js (must be a positive number).",
  );
}

module.exports = {
  apps: [ 
    {
      name: "app_catering_frontend",
      cwd: __dirname,
      script: "npm",
      args: `run start -- --port ${port}`,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: port,
      },
    },
  ],
};

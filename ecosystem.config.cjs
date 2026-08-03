// PM2 process definition for the ITL AI SSR server on Windows Server 2019.
//   pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: "itl-ai",
      script: "./dist/server/index.mjs",
      cwd: "C:/apps/itl-ai/current",
      // Nitro's node-server preset is a plain Node HTTP listener — no extra args.
      exec_mode: "fork", // cluster mode is unreliable on Windows
      instances: 1,
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "3000",
      },
      out_file: "C:/apps/itl-ai/logs/out.log",
      error_file: "C:/apps/itl-ai/logs/err.log",
      time: true,
    },
  ],
};

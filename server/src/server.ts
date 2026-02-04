import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

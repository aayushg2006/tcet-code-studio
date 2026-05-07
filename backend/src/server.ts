import { createApp } from "./app";
import { createApplicationDependencies } from "./bootstrap/dependencies";
import { env } from "./config/env";

const port = env.PORT;
const app = createApp(createApplicationDependencies());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

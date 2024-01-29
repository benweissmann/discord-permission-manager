import { cleanEnv, str } from "envalid";

export default cleanEnv(process.env, {
  DPM_BOT_TOKEN: str(),
  DPM_SERVER_ID: str(),
});

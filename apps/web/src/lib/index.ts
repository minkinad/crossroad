import { apiRepository } from "./api";
import { demoRepository } from "./demo";
export const repository =
  import.meta.env.VITE_DATA_MODE === "api" ? apiRepository : demoRepository;

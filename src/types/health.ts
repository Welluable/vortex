export type HealthResponse = {
  status: "ok";
  data_dir?: string;
  db?: "connected";
};

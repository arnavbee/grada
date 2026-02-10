export type Role = "admin" | "manager" | "operator" | "viewer";

export interface HealthStatus {
  service: "web" | "api" | "worker";
  status: "ok" | "degraded";
}

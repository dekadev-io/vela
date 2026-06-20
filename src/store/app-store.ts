import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PROJECTS, SEED_REQUESTS, type DataRoomRequest, type Project, type RequestStatus } from "@/lib/data";

export type Role = "investor" | "developer" | "admin" | null;

type State = {
  role: Role;
  projects: Project[];
  requests: DataRoomRequest[];
  setRole: (r: Role) => void;
  addProject: (p: Project) => void;
  addRequest: (r: DataRoomRequest) => void;
  updateRequest: (id: string, status: RequestStatus) => void;
};

export const useApp = create<State>()(
  persist(
    (set) => ({
      role: null,
      projects: PROJECTS,
      requests: SEED_REQUESTS,
      setRole: (role) => set({ role }),
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      addRequest: (r) => set((s) => ({ requests: [r, ...s.requests] })),
      updateRequest: (id, status) => set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) })),
    }),
    { name: "vela-store", partialize: (s) => ({ role: s.role }) }
  )
);

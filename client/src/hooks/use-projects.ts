import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ProjectInput, type ProjectUpdateInput } from "@shared/routes";
import { z } from "zod";

// Utility to parse and log Zod errors
function parseResponse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${label}:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

export function useProjects() {
  return useQuery({
    queryKey: [api.projects.list.path],
    queryFn: async () => {
      const res = await fetch(api.projects.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      return parseResponse(api.projects.list.responses[200], data, "projects.list");
    },
  });
}

export function useProject(id: number | null) {
  return useQuery({
    queryKey: [api.projects.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.projects.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      return parseResponse(api.projects.get.responses[200], data, "projects.get");
    },
    enabled: id !== null,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProjectInput) => {
      const validated = api.projects.create.input.parse(data);
      const res = await fetch(api.projects.create.path, {
        method: api.projects.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          const err = api.projects.create.responses[400].parse(resData);
          throw new Error(err.message);
        }
        throw new Error("Failed to create project");
      }
      return parseResponse(api.projects.create.responses[201], resData, "projects.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & ProjectUpdateInput) => {
      const validated = api.projects.update.input.parse(updates);
      const url = buildUrl(api.projects.update.path, { id });
      const res = await fetch(url, {
        method: api.projects.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to update project");
      }
      return parseResponse(api.projects.update.responses[200], resData, "projects.update");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.projects.delete.path, { id });
      const res = await fetch(url, {
        method: api.projects.delete.method,
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
    },
  });
}

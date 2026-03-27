import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "auraclaw_progress";

interface RecipeProgress {
  completed: boolean;
  completedAt?: string;
  stepsChecked: number[];
}

type ProgressStore = Record<string, RecipeProgress>;

function load(): ProgressStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(store: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useRecipeProgress(recipeId: string) {
  const [store, setStore] = useState<ProgressStore>(load);

  useEffect(() => {
    save(store);
  }, [store]);

  const progress = store[recipeId] ?? { completed: false, stepsChecked: [] };

  const toggleStep = useCallback(
    (index: number) => {
      setStore((prev) => {
        const current = prev[recipeId] ?? { completed: false, stepsChecked: [] };
        const checked = current.stepsChecked.includes(index)
          ? current.stepsChecked.filter((i) => i !== index)
          : [...current.stepsChecked, index];
        return { ...prev, [recipeId]: { ...current, stepsChecked: checked } };
      });
    },
    [recipeId],
  );

  const markComplete = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      [recipeId]: {
        ...(prev[recipeId] ?? { stepsChecked: [] }),
        completed: true,
        completedAt: new Date().toLocaleDateString("zh-CN"),
      },
    }));
  }, [recipeId]);

  return {
    isCompleted: progress.completed,
    completedAt: progress.completedAt,
    stepsChecked: progress.stepsChecked,
    toggleStep,
    markComplete,
  };
}

export function useAllProgress(): ProgressStore {
  const [store] = useState<ProgressStore>(load);
  return store;
}

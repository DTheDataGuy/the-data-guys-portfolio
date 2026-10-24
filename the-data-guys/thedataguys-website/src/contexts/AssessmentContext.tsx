import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

export interface FloorProgress {
  id?: number;
  floor_name: string;
  floor_number: number;
  score: number;
  completed: boolean;
}

interface AssessmentContextType {
  progress: FloorProgress[];
  isLoggedIn: boolean;
  isLoading: boolean;
  loadProgress: () => Promise<void>;
  saveFloorProgress: (floorNumber: number, floorName: string, score: number, completed: boolean) => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType>({
  progress: [],
  isLoggedIn: false,
  isLoading: false,
  loadProgress: async () => {},
  saveFloorProgress: async () => {},
});

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<FloorProgress[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const user = await client.auth.me();
      if (user?.data) {
        setIsLoggedIn(true);
        return true;
      }
    } catch {
      // Not logged in
    }
    setIsLoggedIn(false);
    setIsLoading(false);
    return false;
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const response = await client.entities.assessment_progress.query({
        query: {},
        sort: 'floor_number',
      });
      if (response?.data?.items) {
        setProgress(response.data.items as FloorProgress[]);
      }
    } catch {
      // Silently fail if not logged in or table empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveFloorProgress = useCallback(async (floorNumber: number, floorName: string, score: number, completed: boolean) => {
    if (!isLoggedIn) return;

    try {
      // Check if we already have progress for this floor
      const existing = progress.find((p) => p.floor_number === floorNumber);

      if (existing?.id) {
        await client.entities.assessment_progress.update({
          id: String(existing.id),
          data: { score, completed },
        });
        setProgress((prev) =>
          prev.map((p) => (p.floor_number === floorNumber ? { ...p, score, completed } : p))
        );
      } else {
        const response = await client.entities.assessment_progress.create({
          data: {
            floor_name: floorName,
            floor_number: floorNumber,
            score,
            completed,
          },
        });
        if (response?.data) {
          setProgress((prev) => [...prev, response.data as FloorProgress].sort((a, b) => a.floor_number - b.floor_number));
        }
      }
    } catch {
      // Silently fail
    }
  }, [isLoggedIn, progress]);

  useEffect(() => {
    const init = async () => {
      const loggedIn = await checkAuth();
      if (loggedIn) {
        await loadProgress();
      }
    };
    init();
  }, [checkAuth, loadProgress]);

  return (
    <AssessmentContext.Provider value={{ progress, isLoggedIn, isLoading, loadProgress, saveFloorProgress }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  return useContext(AssessmentContext);
}
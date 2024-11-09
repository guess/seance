import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type DependencyList,
  type ReactNode,
} from 'react';
import {
  join,
  leave,
  type LiveConnection,
  type LiveViewModel,
} from '@channeling/seance';
import { usePhoenixSocket } from './PhoenixSocketProvider';

export const LiveViewContext = createContext<LiveViewModel | null>(null);

// LiveView component
type LiveViewProps = {
  factory: (phoenix: LiveConnection) => LiveViewModel;
  params?: Record<string, unknown>;
  children: ReactNode;
};

export function LiveView({ factory, params = {}, children }: LiveViewProps) {
  const phoenix = usePhoenixSocket();
  const viewModel = useMemo(() => factory(phoenix), [phoenix, factory]);

  useEffect(() => {
    join(viewModel, params);
    return () => leave(viewModel);
  }, [viewModel, params]);

  return (
    <LiveViewContext.Provider value={viewModel as LiveViewModel}>
      {children}
    </LiveViewContext.Provider>
  );
}

export const useLiveViewModelFactory = <T extends LiveViewModel>(
  factory: (phx: LiveConnection) => T,
  deps: DependencyList
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(factory, deps);
};

export const useLiveView = <T extends LiveViewModel>(): T => {
  const context = useContext(LiveViewContext);
  if (context === null) {
    throw new Error('useLiveView must be used within a LiveView');
  }
  return context as T;
};

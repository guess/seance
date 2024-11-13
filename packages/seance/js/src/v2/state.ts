import * as JsonPatch from "json-joy/lib/json-patch/index.js";

export type State = Record<string, unknown>;

export type StateData = {
  state: State;
  version: number;
};

export type StatePatch = {
  version: number;
  operations: JsonPatch.Operation[];
};

export type StateChange = StateData;

export const applyChange = (change: StateChange): StateData => ({
  state: change.state,
  version: change.version,
});

export const applyPatch = (
  currentState: StateData,
  patch: StatePatch
): StateData | null => {
  if (!isValidVersion(patch.version, currentState.version)) {
    return null;
  }

  const { doc } = JsonPatch.applyPatch(currentState.state, patch.operations, {
    mutate: false,
  });

  return {
    state: doc as State,
    version: patch.version,
  };
};

const isValidVersion = (
  newVersion: number,
  currentVersion: number
): boolean => {
  return newVersion === currentVersion + 1 || newVersion === 0;
};

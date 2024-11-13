import * as JsonPatch from "json-joy/lib/json-patch/index.js";

/**
 * Represents a generic state object.
 */
export type State = Record<string, unknown>;

/**
 * Represents the complete state data including version information.
 */
export type StateData = {
  /** The current state object */
  state: State;
  /** Version number for state synchronization */
  version: number;
};

/**
 * Represents a patch operation to update state.
 */
export type StatePatch = {
  /** Target version number after applying the patch */
  version: number;
  /** JSON patch operations to apply */
  operations: JsonPatch.Operation[];
};

/**
 * Represents a complete state change.
 */
export type StateChange = StateData;

/**
 * Applies a complete state change.
 *
 * @param change The new state to apply
 * @returns The new state data
 */
export const applyChange = (change: StateChange): StateData => ({
  state: change.state,
  version: change.version,
});

/**
 * Applies a patch to the current state if the version is valid.
 * Returns null if the patch version is invalid.
 *
 * @param currentState The current state to patch
 * @param patch The patch to apply
 * @returns The new state data or null if version mismatch
 */
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

/**
 * Validates if a new version number is valid for the current version.
 * Version is valid if it's either the next version or a reset (0).
 *
 * @param newVersion The new version number
 * @param currentVersion The current version number
 * @returns True if the new version is valid
 */
const isValidVersion = (
  newVersion: number,
  currentVersion: number
): boolean => {
  return newVersion === currentVersion + 1 || newVersion === 0;
};

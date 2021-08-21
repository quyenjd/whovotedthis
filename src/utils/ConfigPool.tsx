import {
    IReactionDisposer,
    observable,
    reaction,
    runInAction,
    toJS
} from 'mobx';
import {
    assign,
    cloneDeep,
    findIndex,
    forEachRight,
    isArray,
    isEqual,
    isFunction,
    isObject
} from 'lodash';
import React from 'react';
import { DepGraph } from 'dependency-graph';

export type StateUpdateListenerFn = (changes: Record<string, unknown>) => void;

type StateUpdateListener = {
    id: number;
    fn: StateUpdateListenerFn;
};

/**
 * A Pool's utility object that is dedicated to every component that is bound to
 * the Pool using `requireConsumable`.
 */
export type Consumable<S = any> = {
    /**
     * Pause all changes from being pushed to the Pool.
     * @param noRender Whether to also pause changes from being committed to React states,
     * default to false.
     */
    pause(noRender?: boolean): void;

    /**
     * Push all cached changes to the Pool, commit changes to React states, and dismiss the pause.
     * @param skipChanges Whether to skip pushing cached changes to the Pool, as well as to React
     * states (if any), default to false.
     * @returns Cached changes
     */
    resume(skipChanges?: boolean): Record<string, unknown>;

    /**
     * Check whether the current connection has been paused.
     */
    isPaused(): boolean;

    /**
     * Check whether the current connection blocks changes to its React states (if any).
     */
    isRenderPaused(): boolean;

    /**
     * Set states of the connection.
     * @param updater New data, as in React's `setState`.
     * @param callback A function to be passed to React's `setState`.
     * @returns true if at least one key has changed its value, false otherwise.
     */
    assign(
        updater:
            | Record<string, unknown>
            | ((prevState: Record<string, unknown>) => Record<string, unknown>),
        callback?: () => void
    ): boolean;

    /**
     * The current state of the component (including cached changes when paused).
     *
     * This supports mutating states without `setState`. Use as your own preference.
     */
    state: S;

    /**
     * Disconnect the component from the Pool.
     */
    dispose(): void;
};

export type ConsumableListener = (changes: Record<string, unknown>) => void;

/**
 * A utility that handles all data queries/changes and efficiently renders the
 * components that bind to any field of data.
 *
 * This helps separate data into components while having control to manage it as
 * a whole, which means a component is now able to affect other components' data
 * while all data is still under the Pool's control.
 *
 * All keys in the Pool's data are in the form of namespace arrays.
 * For example, `['App', 'Permitted']` and `['App', 'Users', 'Create', 'Permitted']`.
 *
 * @module ConfigPool
 */
namespace ConfigPool {
    // For calling backend's API and other stuffs
    let onStateUpdateListeners: StateUpdateListener[] = [];
    let stateUpdaterId = 0;
    const onStateUpdate = (changes: Record<string, unknown>) => {
        onStateUpdateListeners.forEach((item) => item.fn(cloneDeep(changes)));
    };

    type ConsumableEntry = {
        namespacedKey: string[];
        alternatingKeys: string[];
        state: Record<string, unknown>;
        consumer: Consumable;
    };

    const mobxState = observable(new Map<string, unknown>());
    let isStarted = false;
    let disposer: IReactionDisposer;
    const consumables = new DepGraph<ConsumableEntry | string>();
    let consumableCount = 0;
    const locked = {} as { [key: string]: boolean };

    const keyArrToStr = (key: string[]) =>
        '\\' + key.map((value) => value.replace(/\\/g, ' ')).join('\\');

    /**
     * Check if a key exists in the pool.
     * @param key The key to be verified.
     * @returns true if the key exists, false otherwise.
     */
    export const has = function (key: string[]): boolean {
        return mobxState.has(keyArrToStr(key));
    };

    /**
     * Get an entry's value using its key.
     * @param key The key of which value to be fetched.
     * @returns The value.
     */
    export const get = function (key: string[]): any {
        return mobxState.get(keyArrToStr(key));
    };

    /**
     * Get all values of which keys starting with a key.
     * @param prekey Starting keys of the values to be fetched.
     * @returns The values.
     */
    export const getOf = function (prekey: string[]): string[][] {
        const regex = new RegExp(
            `^\\\\${keyArrToStr(prekey)}\\\\[^\\\\]+$`,
            'g'
        );
        const validKeys = [];
        for (const key of mobxState.keys()) {
            if (regex.test(key)) validKeys.push(key.split('\\').slice(1));
        }
        return validKeys;
    };

    /**
     * Set an entry's value to a different one.
     * @param key The key of which value to be set.
     * @param value New value.
     * @returns true if the value has been updated, or false if the value
     * is the same as the current one.
     */
    export const set = function (key: string[], value: any): boolean {
        const stringedKey = keyArrToStr(key);

        if (locked[stringedKey]) {
            throw new Error(
                `ConfigPool: [${key.join(
                    '->'
                )}] is locked and cannot be modified.`
            );
        }

        if (!isEqual(get(key), value)) {
            runInAction(() => mobxState.set(stringedKey, cloneDeep(value)));
            return true;
        }

        return false;
    };

    /**
     * Start the config pool.
     */
    export const start = function (): void {
        if (isStarted) return;

        isStarted = true;

        disposer = reaction(
            () => toJS(mobxState),
            (value, previousValue) => {
                const changes = {} as Record<string, unknown>;

                for (const [param, val] of value) {
                    if (!isEqual(val, previousValue.get(param))) {
                        changes[param] = val;
                    }
                }
                for (const [param] of previousValue) {
                    if (!value.has(param)) changes[param] = undefined;
                }

                onStateUpdate(changes);

                const paused = new Set<string>();

                for (const [param, val] of Object.entries(changes)) {
                    consumables
                        .directDependantsOf(param)
                        .forEach((consumerID) => {
                            const node = consumables.getNodeData(
                                consumerID
                            ) as ConsumableEntry;
                            const key = consumables.getNodeData(
                                param
                            ) as string;

                            if (!isEqual(node.state[key], val)) {
                                node.consumer.pause(true);
                                paused.add(consumerID);

                                (node.consumer.state as any)[key] = val;
                            }
                        });
                }

                for (const consumerID of paused) {
                    (
                        consumables.getNodeData(consumerID) as ConsumableEntry
                    ).consumer.resume();
                }
            }
        );
    };

    /**
     * Stop all config pool activities.
     */
    export const stop = function (): void {
        if (isStarted) {
            isStarted = false;
            disposer();
        }
    };

    /**
     * Check if the config pool is running.
     * @returns true if the pool is running, false otherwise.
     */
    export const isListening = function (): boolean {
        return isStarted;
    };

    /**
     * Bind a function that will be called on data change.
     * @param fn A function.
     * @returns The subscription id that will be used when unsubscribing.
     */
    export const subscribeToChanges = function (
        fn: StateUpdateListenerFn
    ): number {
        onStateUpdateListeners.push({
            fn: fn,
            id: stateUpdaterId
        });
        return stateUpdaterId++;
    };

    /**
     * Undo a subscription.
     * @param id The subscription id.
     */
    export const unsubscribeToChanges = (id: number) => {
        onStateUpdateListeners = onStateUpdateListeners.filter(
            (item: StateUpdateListener) => item.id !== id
        );
    };

    /**
     * Mark a key as locked so its value cannot be changed.
     * @param key The key to be locked.
     * @returns A function to unlock the key.
     */
    export const lock = function (key: string[]): () => void {
        key = cloneDeep(key);
        const stringedKey = keyArrToStr(key);

        if (locked[stringedKey]) {
            throw new Error(
                `ConfigPool: [${key.join('->')}] has already been locked.`
            );
        }
        locked[stringedKey] = true;

        return () => {
            if (locked[stringedKey]) delete locked[stringedKey];
            else {
                throw new Error(
                    `ConfigPool: [${key.join('->')}] has already been unlocked.`
                );
            }
        };
    };

    /**
     * Require a connection with the Pool.
     *
     * Basic example using Component:
     *
     * ```ts
     * class Foo extends React.Component<any, any> {
     *   consumable: Consumable;
     *
     *   constructor(props: any) {
     *     super(props);
     *
     *     // ALWAYS call this function in the constructor.
     *     this.consumable = ConfigPool.requireConsumable(
     *       this,
     *       ['namespace', 'to', 'your'],
     *       ['keys'],
     *       ['default values']
     *     );
     *   }
     *
     *   // Do NOT use componentDidMount!
     *   REACT_componentDidMount() {
     *     // Update the state by
     *     this.setState({ key: 'value' });
     *     // or
     *     this.consumable.state.key = 'value';
     *     // or
     *     this.consumable.state['key'] = 'value';
     *     // or
     *     this.consumable.assign({ key: 'value' });
     *   }
     *
     *   render() {
     *     return (
     *       <div>Hello, World!</div>
     *     );
     *   }
     * }
     * ```
     *
     * Make sure your component (if used) is using `REACT_componentDidMount` instead of `componentDidMount`
     * and `REACT_componentWillUnmount` instead of `componentWillUnmount`, as those will be reserved for
     * Pool utilites.
     *
     * @param reactRef A React.Component to be bound to the Pool, or a function to be called
     * when the Pool receives changes of the keys.
     * @param namespacedKey Prefix key to the alternating keys.
     * @param alternatingKeys Alternating keys that are bound as STATES of the React component.
     * @param defaultValues Default values of the alternating keys.
     * @param enforceDefaultValues Whether to set the keys to the default values forcefully,
     * or let the Pool decide.
     * @returns A Pool's controller dedicated to the React component.
     */
    export const requireConsumable = function <S = any> (
        reactRef: React.Component | ConsumableListener,
        namespacedKey: string[],
        alternatingKeys: string[],
        defaultValues?: any[],
        enforceDefaultValues = false
    ): Consumable<S> {
        alternatingKeys = [...new Set(alternatingKeys)];

        const reactMode = reactRef instanceof React.Component;
        const functionMode = !reactMode && isFunction(reactRef);

        const state = {} as Record<string, unknown>;
        alternatingKeys.forEach((key, index) => {
            const newKey = namespacedKey.concat([key]);

            // If the key is not yet available, try using defaultValues
            if (
                (enforceDefaultValues || !has(newKey)) &&
                isArray(defaultValues) &&
                index < defaultValues.length
            ) {
                state[key] = defaultValues[index];
                set(newKey, defaultValues[index]);
            } else state[key] = get(newKey);
        });

        // Copy current state to react state object
        if (reactMode) {
            (reactRef as React.Component).state = assign(
                isObject((reactRef as React.Component).state)
                    ? (reactRef as React.Component).state
                    : {},
                state
            );
        }

        let isPaused = false;
        let isRenderPaused = false;
        let cachedChanges = {} as Record<string, unknown>;
        const consumerID = `${consumableCount++}`;

        const safeSetState = (
            state: Record<string, unknown>,
            callback?: () => void
        ) => {
            // Only use setState when the component is mounted
            if (
                Object.prototype.hasOwnProperty.call(
                    reactRef,
                    `__pool_isMounted_${consumerID}`
                )
            ) {
                (reactRef as any)[`__pool_setState_${consumerID}`](
                    state,
                    callback
                );
            } else {
                assign((reactRef as React.Component).state, state);
                callback?.call(reactRef);
            }
        };

        const pushToPool = (
            changes: Record<string, unknown>,
            callback?: () => void
        ) => {
            const pushToReact = () => {
                // Call setState on property value setting
                if (!isRenderPaused && reactMode) {
                    safeSetState(changes, callback);
                }
            };

            if (isPaused) {
                assign(cachedChanges, changes);

                if (reactMode) {
                    pushToReact();
                }

                return false;
            } else {
                changes = cloneDeep(changes);

                // Push changes to the Pool
                runInAction(() => {
                    for (const [param, val] of Object.entries(changes)) {
                        if (
                            isEqual(state[param], changes[param]) ||
                            findIndex(alternatingKeys, (elm) =>
                                isEqual(elm, param)
                            ) === -1
                        ) {
                            delete changes[param];
                        } else {
                            state[param] = val;
                            set(namespacedKey.concat([param]), val);
                        }
                    }
                });

                if (!Object.keys(changes).length) return false;

                // If function mode, call the function with changes
                if (functionMode) {
                    (reactRef as ConsumableListener)(cloneDeep(changes));
                }

                // If react mode, trigger setState on the component
                if (reactMode) {
                    pushToReact();
                }

                return true;
            }
        };

        const consumer = {
            pause: (noRender = false) => {
                if (isPaused) return;
                isPaused = true;
                isRenderPaused = noRender;
                cachedChanges = {};
            },
            resume: (skipChanges = false) => {
                if (!isPaused) return;

                isPaused = false;
                const changes = cloneDeep(cachedChanges);

                if (!skipChanges) {
                    isRenderPaused = !isRenderPaused;

                    // Push cached changes
                    pushToPool(changes);
                }

                isRenderPaused = false;
                cachedChanges = {};

                return changes;
            },
            isPaused: () => {
                return isPaused;
            },
            isRenderPaused: () => {
                return isRenderPaused;
            },
            assign: (updater, callback) => {
                return pushToPool(
                    isFunction(updater)
                        ? updater.call(
                            reactRef,
                            Object.assign(
                                {},
                                reactMode
                                    ? (reactRef as React.Component).state
                                    : functionMode
                                        ? consumer.state
                                        : {}
                            )
                        )
                        : updater,
                    callback
                );
            },
            state: (() => {
                const obj = {};
                alternatingKeys.forEach((key) => {
                    Object.defineProperty(obj, key, {
                        configurable: false,
                        get: () => {
                            return isPaused &&
                                Object.prototype.hasOwnProperty.call(
                                    cachedChanges,
                                    key
                                )
                                ? cachedChanges[key]
                                : state[key];
                        },
                        set: (newValue) => {
                            pushToPool({ [key]: newValue });
                        }
                    });
                });
                return obj;
            })(),
            dispose: () => {
                for (const param in consumer) delete (consumer as any)[param];

                // Cleanup isolated keys
                consumables.directDependenciesOf(consumerID).forEach((key) => {
                    if (consumables.directDependantsOf(key).length < 2) {
                        consumables.removeNode(key);
                    }
                });

                consumables.removeNode(consumerID);
            }
        } as Consumable<S>;

        // Bind Pool utilities to React instance
        if (reactMode) {
            const ref = reactRef as any;
            ref[`__pool_setState_${consumerID}`] = ref.setState;

            if (!isArray(ref.__pool_didMount)) ref.__pool_didMount = [];
            if (!isArray(ref.__pool_willUnmount)) ref.__pool_willUnmount = [];

            ref.__pool_didMount.push(() => {
                ref[`__pool_isMounted_${consumerID}`] = true;
            });
            ref.__pool_willUnmount.push(() => {
                consumer.dispose();

                ref.setState = ref[`__pool_setState_${consumerID}`];
                delete ref[`__pool_setState_${consumerID}`];

                delete ref[`__pool_isMounted_${consumerID}`];
            });

            // Wrap component's componentDidMount to handle isMounted state
            ref.componentDidMount = () => {
                ref.__pool_didMount.forEach((func: any) => func());
                if (ref.REACT_componentDidMount) {
                    ref.REACT_componentDidMount.call(reactRef);
                }
            };

            // Wrap component's componentWillUnmount to handle isMounted state
            ref.componentWillUnmount = () => {
                forEachRight(ref.__pool_willUnmount, (func) => func());

                // Remove Pool attributes
                delete ref.__pool_didMount;
                delete ref.__pool_willUnmount;

                if (ref.REACT_componentWillUnmount) {
                    ref.REACT_componentWillUnmount.call(reactRef);
                }
            };

            // Wrap component's render to update state changes
            ref.setState = (updater: any, callback: any) => {
                consumer.assign(updater, callback);
            };
        }

        consumables.addNode(consumerID, {
            namespacedKey,
            alternatingKeys,
            state,
            consumer
        });
        alternatingKeys.forEach((key) => {
            const stringedKey = keyArrToStr(namespacedKey.concat([key]));
            consumables.addNode(stringedKey, key);
            consumables.addDependency(consumerID, stringedKey);
        });

        return consumer;
    };
}

export default ConfigPool;

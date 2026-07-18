// Typecheck-only stub used by tsconfig.gamcheck.json until
// `npm install --legacy-peer-deps` runs in ./mobile (sandbox had no disk for it).
// Mirrors the AsyncStorageStatic surface the shared lib relies on.
declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

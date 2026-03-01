import { useEffect } from "react";
import {
  Provider,
  ToastContainer,
  Tabs,
  Tab,
  TabList,
  TabPanel,
} from "@react-spectrum/s2";
import { UploadScreen } from "./components/UploadScreen";
import { EditorHeader } from "./components/EditorHeader";
import { Sidebar } from "./components/Sidebar";
import { LayerList } from "./components/LayerList";
import { JsonEditor } from "./components/JsonEditor";
import { Preview } from "./components/Preview/Preview";
import { useDecalStore, useDecalStoreApi } from "./store";
import type { DecalLayer } from "./types";
import styles from "./App.module.css";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

function App() {
  const hasLayers = useDecalStore((s) => s.layers.length > 0);
  const storeApi = useDecalStoreApi();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        storeApi.getState().actions.undo();
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        storeApi.getState().actions.redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storeApi]);

  // Auto-load sample file in dev mode
  useEffect(() => {
    if (import.meta.env.DEV && storeApi.getState().layers.length === 0) {
      import("./sample1.decal.json").then((mod) => {
        const data = mod.default as { decal: { decalLayers: DecalLayer[] } };
        storeApi.getState().actions.importLayers(data.decal.decalLayers);
      });
    }
  }, [storeApi]);

  // Warn on unsaved changes before unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (storeApi.getState().isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [storeApi]);

  return (
    <Provider colorScheme="dark">
      <ToastContainer />
      {hasLayers ? (
        <div className={styles.editorLayout}>
          <EditorHeader />
          <div className={styles.editorBody}>
            <Sidebar />
            <main className={styles.mainContent}>
              <Tabs aria-label="Editor tabs" styles={style({ height: "100%" })}>
                <TabList>
                  <Tab id="layers">Layers</Tab>
                  <Tab id="json">JSON</Tab>
                  <Tab id="preview">Preview</Tab>
                </TabList>

                <TabPanel id="layers">
                  <LayerList />
                </TabPanel>
                <TabPanel id="json">
                  <JsonEditor />
                </TabPanel>
                <TabPanel id="preview">
                  <Preview />
                </TabPanel>
              </Tabs>
            </main>
          </div>
        </div>
      ) : (
        <UploadScreen />
      )}
    </Provider>
  );
}

export default App;

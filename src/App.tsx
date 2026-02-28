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
import { useStore } from "./store";
import styles from "./App.module.css";
import { style } from "@react-spectrum/s2/style"with {type: 'macro'};

function App() {
  const hasLayers = useStore((s) => s.layers.length > 0);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        useStore.getState().redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Warn on unsaved changes before unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useStore.getState().isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <Provider>
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

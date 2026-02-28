import { useEffect } from "react";
import {
  Provider,
  darkTheme,
  ToastContainer,
  Tabs,
  TabList,
  TabPanels,
  Item,
} from "@adobe/react-spectrum";
import { UploadScreen } from "./components/UploadScreen";
import { EditorHeader } from "./components/EditorHeader";
import { Sidebar } from "./components/Sidebar";
import { LayerList } from "./components/LayerList";
import { JsonEditor } from "./components/JsonEditor";
import { Preview } from "./components/Preview/Preview";
import { useStore } from "./store";
import styles from "./App.module.css";

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
    <Provider theme={darkTheme} colorScheme="dark">
      <ToastContainer />
      {hasLayers ? (
        <div className={styles.editorLayout}>
          <EditorHeader />
          <div className={styles.editorBody}>
            <Sidebar />
            <main className={styles.mainContent}>
              <Tabs aria-label="Editor tabs" UNSAFE_className={styles.tabs}>
                <TabList>
                  <Item key="layers">Layers</Item>
                  <Item key="json">JSON</Item>
                  <Item key="preview">Preview</Item>
                </TabList>
                <TabPanels UNSAFE_className={styles.tabPanels}>
                  <Item key="layers">
                    <LayerList />
                  </Item>
                  <Item key="json">
                    <JsonEditor />
                  </Item>
                  <Item key="preview">
                    <Preview />
                  </Item>
                </TabPanels>
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

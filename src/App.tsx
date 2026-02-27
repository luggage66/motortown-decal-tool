import { Provider, darkTheme } from '@adobe/react-spectrum'
import { Header } from './components/Header'
import { ImportArea } from './components/ImportArea'
import { LayerList } from './components/LayerList'
import { ExportBar } from './components/ExportBar'
import styles from './App.module.css'

function App() {
  return (
    <Provider theme={darkTheme} colorScheme="dark">
      <div className={styles.shell}>
        <Header />

        <ImportArea />

        {/* Phase 7: Toolbar (Undo/Redo) */}

        {/* Phase 6: ColorPalette */}

        <section className={styles.layerListSection}>
          <LayerList />
        </section>

        <ExportBar />
      </div>
    </Provider>
  )
}

export default App

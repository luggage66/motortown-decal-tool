import { Provider, darkTheme } from '@adobe/react-spectrum'
import { Header } from './components/Header'
import styles from './App.module.css'

function App() {
  return (
    <Provider theme={darkTheme} colorScheme="dark">
      <div className={styles.shell}>
        <Header />

        {/* Phase 3: ImportArea */}
        <section className={styles.section} />

        {/* Phase 7: Toolbar (Undo/Redo) */}

        {/* Phase 6: ColorPalette */}

        {/* Phase 4: LayerList */}
        <section className={styles.layerListSection} />

        {/* Phase 3: ExportBar */}
      </div>
    </Provider>
  )
}

export default App

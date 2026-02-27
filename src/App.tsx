import { Provider, darkTheme } from '@adobe/react-spectrum'
import { Header } from './components/Header'
import { ImportArea } from './components/ImportArea'
import { Toolbar } from './components/Toolbar'
import { ColorPalette } from './components/ColorPalette'
import { LayerList } from './components/LayerList'
import { ExportBar } from './components/ExportBar'
import styles from './App.module.css'

function App() {
  return (
    <Provider theme={darkTheme} colorScheme="dark">
      <div className={styles.shell}>
        <Header />

        <ImportArea />

        <Toolbar />

        <ColorPalette />

        <section className={styles.layerListSection}>
          <LayerList />
        </section>

        <ExportBar />
      </div>
    </Provider>
  )
}

export default App

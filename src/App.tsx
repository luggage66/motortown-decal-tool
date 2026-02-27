import { useEffect } from 'react'
import { Provider, darkTheme, ToastContainer } from '@adobe/react-spectrum'
import { Header } from './components/Header'
import { ImportArea } from './components/ImportArea'
import { Toolbar } from './components/Toolbar'
import { ColorPalette } from './components/ColorPalette'
import { LayerList } from './components/LayerList'
import { ExportBar } from './components/ExportBar'
import { useStore } from './store'
import styles from './App.module.css'

function App() {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useStore.getState().isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  return (
    <Provider theme={darkTheme} colorScheme="dark">
      <ToastContainer />
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

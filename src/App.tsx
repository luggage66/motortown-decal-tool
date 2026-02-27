import { Provider, darkTheme } from '@adobe/react-spectrum'

function App() {
  return (
    <Provider theme={darkTheme} colorScheme="dark">
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
        <h1>MotorTown Decal Editor</h1>
      </div>
    </Provider>
  )
}

export default App

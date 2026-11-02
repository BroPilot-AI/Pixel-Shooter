import { CanvasGame } from './components/CanvasGame';
import './App.css';

function App() {
  return (
    <main>
      <h1>PIXEL SPACE SHOOTER</h1>
      <p className="controls">WASD / Arrows to move &nbsp;&bull;&nbsp; Space to fire</p>
      <CanvasGame />
    </main>
  );
}

export default App;

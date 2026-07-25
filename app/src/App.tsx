import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Home } from "@/pages/Home/Home";
import { Player } from "@/pages/Player/Player";
import { Splash } from "@/pages/Splash/Splash";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/story/:id" element={<Player />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

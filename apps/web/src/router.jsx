import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import AudioSeparator from './pages/AudioSeparator.jsx';
import VideoToAudio from './pages/VideoToAudio.jsx';
import AudioCutter from './pages/AudioCutter.jsx';
import FormatChanger from './pages/FormatChanger.jsx';
import VideoEditor from './pages/VideoEditor.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/separator" element={<AudioSeparator />} />
      <Route path="/video-to-audio" element={<VideoToAudio />} />
      <Route path="/cutter" element={<AudioCutter />} />
      <Route path="/converter" element={<FormatChanger />} />
      <Route path="/editor" element={<VideoEditor />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/navigation/Navbar';
import Footer from './components/navigation/Footer';
import Home from './pages/Home';
import ExploreGames from './pages/ExploreGames';
import GameDetails from './pages/GameDetails';
import PlayGame from './pages/PlayGame';
import Tutorials from './pages/Tutorials';
import FAQs from './pages/FAQs';
import Profile from './pages/Profile';
import Preserve from './pages/Preserve';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import './styles/theme.css';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExploreGames />} />
              <Route path="/games/:id" element={<GameDetails />} />
              <Route path="/play/:id" element={<PlayGame />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/preserve" element={<Preserve />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

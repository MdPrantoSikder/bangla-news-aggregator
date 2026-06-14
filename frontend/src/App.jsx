import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Header from "./components/Header"
import ScrollToTop from "./components/ScrollToTop"
import ProtectedRoute from "./components/ProtectedRoute"

import HomePage from "./pages/HomePage"
import CategoryPage from "./pages/CategoryPage"
import ArticlePage from "./pages/ArticlePage"
import StoryPage from "./pages/StoryPage"
import BCSFeedPage from "./pages/BCSFeedPage"
import SearchPage from "./pages/SearchPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import AdminPage from "./pages/AdminPage"
import AdminUsersPage from "./pages/AdminUsersPage"

import StudySpacePage from "./pages/StudySpacePage"
import SavedPage from "./pages/study-space/SavedPage"
import FoldersPage from "./pages/study-space/FoldersPage"
import KeyPointsPage from "./pages/study-space/KeyPointsPage"
import GlossaryPage from "./pages/study-space/GlossaryPage"


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />

          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
            <Routes>
              {/* Public */}
              <Route path="/"                 element={<HomePage />} />
              <Route path="/category/:slug"   element={<CategoryPage />} />
              <Route path="/article/:id"      element={<ArticlePage />} />
              <Route path="/story/:id"        element={<StoryPage />} />
              <Route path="/bcs-feed"         element={<BCSFeedPage />} />
              <Route path="/search"           element={<SearchPage />} />
              <Route path="/login"            element={<LoginPage />} />
              <Route path="/signup"           element={<SignupPage />} />

              {/* Protected: Study Space */}
              <Route path="/study-space" element={
                <ProtectedRoute><StudySpacePage /></ProtectedRoute>
              } />
              <Route path="/study-space/saved" element={
                <ProtectedRoute><SavedPage /></ProtectedRoute>
              } />
              <Route path="/study-space/folders" element={
                <ProtectedRoute><FoldersPage /></ProtectedRoute>
              } />
              <Route path="/study-space/keypoints" element={
                <ProtectedRoute><KeyPointsPage /></ProtectedRoute>
              } />
              <Route path="/study-space/glossary" element={
                <ProtectedRoute><GlossaryPage /></ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}><AdminPage /></ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin={true}><AdminUsersPage /></ProtectedRoute>
              } />
            </Routes>
          </main>

          <footer className="border-t border-brand-navy-100 mt-12 bg-white">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
              <div className="text-brand-navy-500">
                <span className="font-display font-bold text-brand-navy-900">BanglaBrief</span>
                <span className="mx-2">&middot;</span>
                <span>AI News Curated for BCS Aspirants</span>
              </div>
              <div className="text-xs text-brand-navy-300">
                Built with FastAPI &middot; React &middot; Groq &middot; PostgreSQL
              </div>
            </div>
          </footer>

          <ScrollToTop />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App


import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import UploadPage from './pages/UploadPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ReportsPage from './pages/ReportsPage.tsx'
import ExplanationPage from './pages/ExplanationPage'
import LandingPage from './pages/LandingPage'

function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Navbar — hidden on landing page */}
      {!isLanding && (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">

              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="#ebdbb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M8 12h3l1-2 1 4 1-2h2"/>
                </svg>
                <h1 className="text-lg sm:text-xl font-bold text-[#ebdbb2] text-center lg:text-left">
                  Credit Scoring Model
                </h1>
              </div>

              {/* Nav Links */}
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 sm:gap-3">
                {[
                  { to: '/upload',     label: 'Upload'         },
                  { to: '/dashboard',  label: 'Dashboard'      },
                  { to: '/explain',    label: 'Explainability' },
                  { to: '/reports',    label: 'Reports'        },
                ].map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-xl text-sm sm:text-base transition-all duration-200
                      ${isActive
                        ? 'bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Logout */}
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 rounded-xl text-sm sm:text-base transition-all duration-200
                    text-red-400 hover:text-white hover:bg-red-500/10
                    border border-transparent hover:border-red-500/30"
                >
                    Logout
                </button>


              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Page Content */}
      <main className={isLanding ? '' : 'p-8'}>
        <Routes>
          <Route path="/"          element={<LandingPage />}    />
          <Route path="/upload"    element={<UploadPage />}     />
          <Route path="/dashboard" element={<DashboardPage />}  />
          <Route path="/reports"   element={<ReportsPage />}    />
          <Route path="/explain"   element={<ExplanationPage />}/>
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
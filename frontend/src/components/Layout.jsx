import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import ScrollToTopButton from './ScrollToTopButton'
import ScrollRestorer from './ScrollRestorer'
import WelcomeModal from './WelcomeModal'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" style={{ backgroundColor: '#FFFAF3' }}>
        <Outlet />
      </main>
      {/* Banda decorativa cream → charcoal con hilo naranja Avisander (única línea). */}
      <div
        className="relative h-6"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to bottom, #FFFAF3 0%, #0A0A0A 100%)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, #F58220 50%, transparent 100%)'
          }}
        />
      </div>
      <Footer />
      <ScrollRestorer />
      <ScrollToTopButton />
      <WhatsAppButton />
      <WelcomeModal />
    </div>
  )
}

export default Layout

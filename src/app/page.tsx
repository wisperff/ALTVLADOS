import { site } from '@/data/site';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { ShowsSection } from '@/components/ShowsSection';
import { VenueSection } from '@/components/VenueSection';
import { ContactsSection } from '@/components/ContactsSection';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import { TicketProvider } from '@/components/TicketProvider';

export default function Home() {
  return (
    <TicketProvider>
      <a href="#main" className="skip-link">{site.ui.skip}</a>
      <div id="top" />
      <Header />
      <main id="main">
        <HeroSection />
        <ShowsSection />
        <VenueSection />
        <ContactsSection />
      </main>
      <Footer />
      <CookieBanner />
    </TicketProvider>
  );
}

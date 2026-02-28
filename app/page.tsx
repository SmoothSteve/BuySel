export const runtime = 'edge';  // Cloudflare Pages requirement (if deploying there)

import BuySelHeader from '@/components/BuySelHeader';  // navbar
import NotificationBar from '@/components/NotificationBar';  // top banner if present
import PropertyCard from '@/components/PropertyCard';  // property cards
import PropertyDetailsDialog from '@/components/PropertyDetailsDialog';  // popup
import Footer from '@/components/Footer';  // bottom footer
// Add if found: import Hero from '@/components/Hero'; import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div>
      <BuySelHeader />  // Top navbar
      <NotificationBar />  // Top banner (remove if not needed)
      <main className="hero-section">  // Hero section — add className from CSS if needed
        <h1>Sell your house. Keep your price.</h1>
        <p>Verified property. No commission. Free to list during early access.</p>
        {/* SearchBar here if found: <SearchBar /> */}
        <input placeholder="Suburb or postcode" type="text" />  // placeholder until we find SearchBar
        <button>Search</button>  // placeholder button
      </main>
      <section className="properties-section">  // Properties grid
        <h2>Properties</h2>
        <PropertyCard />  // Repeat or use a loop for multiple (e.g. <PropertyCard /> <PropertyCard />)
        <PropertyDetailsDialog />  // If needed for click handling
      </section>
      <Footer />  // Bottom footer
    </div>
  );
}
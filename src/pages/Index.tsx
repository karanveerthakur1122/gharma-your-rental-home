import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Shield, Home, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent to-background py-20 md:py-32">
        <div className="container flex flex-col items-center text-center gap-6 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="h-3 w-3" /> Nepal's Rental Platform
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Find Your Perfect
            <span className="text-primary"> Rental Home</span>
            <br />in Nepal
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Verified listings, transparent pricing, and a seamless experience for tenants and landlords across Nepal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" asChild>
              <Link to="/search">
                <Search className="h-4 w-4 mr-2" />
                Browse Rentals
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/signup">
                List Your Property <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why GharKhoj?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Verified Listings",
                desc: "Every property is reviewed and verified by our team before going live.",
              },
              {
                icon: MapPin,
                title: "Map-Based Search",
                desc: "Explore rentals on an interactive map to find the perfect neighborhood.",
              },
              {
                icon: Home,
                title: "Landlord Tools",
                desc: "Manage tenants, track rent, and keep your properties organized.",
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-3 p-6 rounded-lg bg-card border">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to find your next home?</h2>
          <p className="text-muted-foreground max-w-md">
            Join thousands of tenants and landlords using GharKhoj Nepal.
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 GharKhoj Nepal. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/search" className="hover:text-foreground">Browse</Link>
            <Link to="/signup" className="hover:text-foreground">Sign Up</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

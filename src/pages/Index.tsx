import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Shield,
  Home,
  ArrowRight,
  MessageCircle,
  Users,
  Building2,
  CheckCircle2,
  Star,
  Clock,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ---------- tiny counter animation ---------- */
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

interface FeaturedProperty {
  id: string;
  title: string;
  city: string;
  area: string | null;
  price: number;
  room_type: string;
  property_images: { image_url: string; display_order: number }[];
}

const Index = () => {
  const [stats, setStats] = useState({ properties: 0, cities: 7, users: 0 });
  const [featured, setFeatured] = useState<FeaturedProperty[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: pCount }, { count: uCount }, { data: props }] = await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("properties")
          .select("id, title, city, area, price, room_type, property_images(image_url, display_order)")
          .eq("status", "approved")
          .eq("is_vacant", true)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      setStats((s) => ({ ...s, properties: pCount ?? 0, users: uCount ?? 0 }));
      setFeatured((props as FeaturedProperty[]) ?? []);
    })();
  }, []);

  return (
    <div className="flex flex-col">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent to-background py-24 md:py-36">
        {/* decorative blobs */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent/40 blur-3xl" />

        <div className="container relative z-10 flex flex-col items-center text-center gap-6 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
            <MapPin className="h-3.5 w-3.5" /> Nepal's #1 Rental Platform
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Find Your Perfect
            <span className="text-primary"> Rental Home</span>
            <br className="hidden sm:block" />
            in Nepal
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed">
            Verified listings, transparent pricing, and a seamless experience for tenants and landlords across Nepal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" className="text-base px-8" asChild>
              <Link to="/search">
                <Search className="h-4 w-4 mr-2" />
                Browse Rentals
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/signup">
                List Your Property <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Live Stats Bar ─── */}
      <section className="border-b bg-card">
        <div className="container grid grid-cols-3 divide-x text-center py-8">
          {[
            { label: "Verified Listings", value: stats.properties, suffix: "+" },
            { label: "Cities Covered", value: stats.cities, suffix: "" },
            { label: "Happy Users", value: stats.users, suffix: "+" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                <AnimatedCount target={s.value} suffix={s.suffix} />
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured Rooms Preview ─── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Rooms</h2>
              <p className="text-muted-foreground mt-1">
                Handpicked verified listings from across Nepal
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/search">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featured.length > 0 ? featured : []).map((p) => {
              const img = p.property_images?.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url;
              return (
                <Link
                  key={p.id}
                  to={`/property/${p.id}`}
                  className="group relative overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground uppercase tracking-wide">
                      {p.room_type}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.city}{p.area ? `, ${p.area}` : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary text-sm">NPR {Number(p.price).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        View Details <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {featured.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No featured listings yet. Be the first to <Link to="/signup" className="text-primary underline">list a property</Link>!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-12">
            Three simple steps to find or list a rental property in Nepal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search or List",
                desc: "Browse verified rooms on the map or list your property in minutes.",
              },
              {
                step: "02",
                icon: MessageCircle,
                title: "Connect & Chat",
                desc: "Message landlords or tenants directly through our secure chat system.",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Move In",
                desc: "Finalize details, sign your agreement, and move into your new home.",
              },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center gap-4 p-8">
                <span className="absolute top-2 right-6 text-6xl font-black text-primary/10 select-none">
                  {item.step}
                </span>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why GharKhoj ─── */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Why GharKhoj?</h2>
          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-12">
            Built specifically for Nepal's rental market, with features that matter.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Admin-Verified Listings",
                desc: "Every property is reviewed by our team before going live — no scams, no fakes.",
              },
              {
                icon: MapPin,
                title: "Interactive Map Search",
                desc: "Explore rentals on a live map to find the perfect neighborhood for you.",
              },
              {
                icon: Building2,
                title: "Landlord Dashboard",
                desc: "Manage vacancies, track rent, and communicate with tenants — all in one place.",
              },
              {
                icon: MessageCircle,
                title: "In-App Messaging",
                desc: "Chat directly with landlords or tenants without sharing personal phone numbers.",
              },
              {
                icon: Users,
                title: "Hostel & Shared Rooms",
                desc: "Specialized listings for hostels with bed counts, meals, gender preferences, and more.",
              },
              {
                icon: Clock,
                title: "Real-Time Updates",
                desc: "Get instant notifications when new properties match your criteria.",
              },
            ].map((f) => (
              <Card key={f.title} className="border bg-card hover:shadow-md transition-shadow duration-300">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-base">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What People Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Aarav Sharma",
                role: "Tenant, Kathmandu",
                text: "Found my perfect flat within a week. The map feature made it so easy to explore neighborhoods before visiting.",
              },
              {
                name: "Sita Thapa",
                role: "Landlord, Pokhara",
                text: "Managing my 3 rental properties is now effortless. The dashboard keeps everything organized and tenants happy.",
              },
              {
                name: "Bikash Rai",
                role: "Student, Chitwan",
                text: "As a student, finding a hostel was stressful. GharKhoj showed verified options with transparent pricing. Highly recommend!",
              },
            ].map((t) => (
              <Card key={t.name} className="border-none bg-card shadow-sm">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-auto pt-2 border-t">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cities We Cover ─── */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Cities We Cover</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">
            Growing across Nepal, one city at a time.
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {["Kathmandu", "Pokhara", "Chitwan", "Biratnagar", "Butwal", "Dharan", "Nepalgunj"].map((city) => (
              <Link
                key={city}
                to={`/search?city=${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/50 to-background">
        <div className="container text-center flex flex-col items-center gap-5 max-w-xl">
          <Home className="h-10 w-10 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Ready to find your next home?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Join thousands of tenants and landlords using GharKhoj Nepal. It's free to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" className="text-base px-8" asChild>
              <Link to="/search">
                <Search className="h-4 w-4 mr-2" /> Start Searching
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link to="/signup">
                Create Free Account <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-card py-10">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-base text-foreground">GharKhoj</h4>
            <p className="text-muted-foreground leading-relaxed">
              Nepal's trusted rental platform connecting tenants with verified landlords.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-foreground">For Tenants</h5>
            <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">Browse Rentals</Link>
            <Link to="/search?roomType=hostel" className="text-muted-foreground hover:text-foreground transition-colors">Find Hostels</Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">Create Account</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-foreground">For Landlords</h5>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">List Property</Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/messages" className="text-muted-foreground hover:text-foreground transition-colors">Messages</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-foreground">Company</h5>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
          </div>
        </div>
        <div className="container mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 GharKhoj Nepal. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>
              Created by{" "}
              <a href="http://karanveerthakur.com.np/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Karan Veer Thakur
              </a>
            </span>
            <a href="https://github.com/karanveerthakur1122" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="GitHub">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://linkedin.com/in/karanveerthakur1122" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="LinkedIn">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

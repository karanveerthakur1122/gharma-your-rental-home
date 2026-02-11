# GharKhoj Nepal 🏠

A modern rental property management platform for Nepal connecting landlords and tenants.

## Features

- 🔍 **Property Search** - Browse rentals with filters (city, room type, price) and interactive map view
- 💬 **Real-time Chat** - Direct messaging between tenants and landlords
- ❤️ **Favorites** - Save and track preferred properties
- 🏢 **Landlord Dashboard** - Manage listings, view inquiries, track messages
- 👤 **Tenant Dashboard** - Saved properties, inquiry tracking, messaging inbox
- 🛡️ **Admin Panel** - Property verification and user management
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Maps**: Leaflet
- **Build Tool**: Vite

## Quick Start

1. **Clone and install**
   ```bash
   git clone <YOUR_GIT_URL>
   cd gharma-your-rental-home
   npm install
   ```

2. **Setup environment**
   
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your actual values from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
   ```

3. **Run migrations**
   
   Execute SQL files in `supabase/migrations/` in your Supabase project

4. **Start development**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:8080

## User Roles

- **Tenant**: Search properties, save favorites, send inquiries, chat with landlords
- **Landlord**: Create listings, manage properties, respond to inquiries
- **Admin**: Verify properties, manage users

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run test      # Run tests
```

## Database Schema

**Main Tables**: `profiles`, `user_roles`, `properties`, `property_images`, `favorites`, `inquiries`, `conversations`, `messages`

All tables use Row Level Security (RLS) for data protection.

## Security

⚠️ **Important**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template.

- ✅ `.env.example` - Safe to commit (contains placeholders)
- ❌ `.env` - Never commit (contains real credentials)

## License

Private and proprietary

---

Built with ❤️ for Nepal's rental market

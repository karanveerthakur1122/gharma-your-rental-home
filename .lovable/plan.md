

# GharKhoj Nepal — MVP Plan

## Overview
A rental discovery and management platform for Nepal. MVP focuses on property search with map view, basic landlord tools, and admin verification — built with React + Supabase.

---

## Phase 1: Foundation & Authentication

### User Registration & Login
- Email + password authentication via Supabase Auth
- Role selection at signup: **Tenant**, **Landlord**, or **Admin**
- Role stored in a secure `user_roles` table (not on profiles)
- Basic profile page with name, phone number, and avatar

### Role-Based Access
- Tenants can search and browse listings, save favorites, submit inquiries
- Landlords can create/manage their own listings and track tenants
- Admins can verify listings, manage users, and view analytics

---

## Phase 2: Tenant-Facing Features

### Property Search & Discovery
- Grid/list view of property cards with photos, price, location, and key details
- Filters: city, area, price range, room type (Single/1BHK/2BHK/Flat), furnished, parking, internet, pets allowed
- Sort by price and newest
- **Map view** using Leaflet (free, open-source) showing property pins with popups

### Property Detail Page
- Image gallery with multiple photos
- Full description, amenities checklist, house rules
- Price breakdown (rent, deposit, maintenance)
- Embedded map showing location
- Owner verification badge (if admin-verified)
- Availability status indicator

### Favorites & Inquiries
- Save/unsave properties to a favorites list
- Submit inquiry form on a listing (name, message, preferred move-in date)
- Landlord receives inquiry notification

---

## Phase 3: Landlord Management Dashboard

### Listing Management
- Add new property with details: title, description, address, city, area, price, room type, amenities, photos
- Location picker on map for geo-coordinates
- Upload property images (stored in Supabase Storage)
- Edit/delete own listings
- Toggle vacancy status (Available / Occupied)

### Basic Tenant Tracking
- View list of current tenants per property
- Record contract start/end dates
- Track monthly rent status (Paid / Pending / Overdue)
- Manual payment entry with date and amount
- Simple deposit tracking

### Income Overview
- Monthly income summary across all properties
- Occupancy status per property
- Simple bar chart showing rent collected per month

---

## Phase 4: Admin Panel

### Listing Verification
- Queue of newly submitted listings awaiting verification
- View property details and uploaded images
- Approve or reject with reason
- Only approved listings appear in public search

### User Management
- View all registered users with role filters
- Ability to suspend/unsuspend accounts
- View reported listings

### Basic Analytics Dashboard
- Total listings (verified vs pending)
- Total users by role
- New listings per week/month

---

## Phase 5: Supporting Features

### Notifications
- In-app notification bell for inquiries, verification status changes, and rent reminders
- Toast notifications for real-time actions

### Responsive Mobile-First Design
- All pages optimized for mobile screens first
- Bottom navigation bar on mobile
- Touch-friendly filters and map interactions

### SEO-Friendly Listing Pages
- Clean URL structure for property pages
- Meta tags and Open Graph data per listing
- Descriptive page titles

---

## Design Direction
- Clean, minimal UI with a modern card-based layout
- White/light background with a blue/teal accent color palette
- Clear CTAs (Contact Owner, Save, List Property)
- Mobile-first responsive design
- English language only for MVP

---

## What's Deferred (Post-MVP)
- Phone OTP login
- Real-time chat between tenant and landlord
- Visit scheduling system
- Hostel/bed management module
- KYC document upload & verification
- Agreement/contract PDF generator
- Maintenance/complaint module
- Nepali language support
- Monetization (featured listings, subscriptions)
- 360° image support
- Nearby facilities auto-detection
- Price drop alerts


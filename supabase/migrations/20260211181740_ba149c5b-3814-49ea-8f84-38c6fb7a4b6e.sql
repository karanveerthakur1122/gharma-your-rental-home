
-- Role enum
CREATE TYPE public.app_role AS ENUM ('tenant', 'landlord', 'admin');

-- Room type enum
CREATE TYPE public.room_type AS ENUM ('single', '1bhk', '2bhk', 'flat');

-- Property status enum
CREATE TYPE public.property_status AS ENUM ('pending', 'approved', 'rejected');

-- Inquiry status enum
CREATE TYPE public.inquiry_status AS ENUM ('open', 'closed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  area TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  price NUMERIC NOT NULL DEFAULT 0,
  deposit NUMERIC DEFAULT 0,
  maintenance_fee NUMERIC DEFAULT 0,
  room_type room_type NOT NULL DEFAULT 'single',
  furnished BOOLEAN DEFAULT false,
  parking BOOLEAN DEFAULT false,
  internet BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  water_available BOOLEAN DEFAULT true,
  bathroom_type TEXT DEFAULT 'shared',
  available_from DATE,
  status property_status NOT NULL DEFAULT 'pending',
  is_vacant BOOLEAN NOT NULL DEFAULT true,
  house_rules TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Property images table
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Inquiries table
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  preferred_move_in DATE,
  status inquiry_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ========== HELPER FUNCTIONS ==========

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_property_owner(_property_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties WHERE id = _property_id AND landlord_id = _user_id
  )
$$;

-- ========== PROFILES POLICIES ==========

CREATE POLICY "Anyone authenticated can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ========== USER_ROLES POLICIES ==========

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own role at signup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== PROPERTIES POLICIES ==========

CREATE POLICY "Anyone can view approved vacant properties"
  ON public.properties FOR SELECT
  USING (
    (status = 'approved' AND is_vacant = true)
    OR landlord_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Landlords can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (
    landlord_id = auth.uid() AND public.has_role(auth.uid(), 'landlord')
  );

CREATE POLICY "Landlords can update own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (
    landlord_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Landlords can delete own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (
    landlord_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- ========== PROPERTY_IMAGES POLICIES ==========

CREATE POLICY "Anyone can view property images"
  ON public.property_images FOR SELECT
  USING (true);

CREATE POLICY "Landlords can manage own property images"
  ON public.property_images FOR INSERT TO authenticated
  WITH CHECK (public.is_property_owner(property_id, auth.uid()));

CREATE POLICY "Landlords can update own property images"
  ON public.property_images FOR UPDATE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()));

CREATE POLICY "Landlords can delete own property images"
  ON public.property_images FOR DELETE TO authenticated
  USING (public.is_property_owner(property_id, auth.uid()));

-- ========== FAVORITES POLICIES ==========

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ========== INQUIRIES POLICIES ==========

CREATE POLICY "Users can view relevant inquiries"
  ON public.inquiries FOR SELECT TO authenticated
  USING (
    tenant_id = auth.uid()
    OR public.is_property_owner(property_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Tenants can create inquiries"
  ON public.inquiries FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = auth.uid() AND public.has_role(auth.uid(), 'tenant')
  );

CREATE POLICY "Users can delete own inquiries"
  ON public.inquiries FOR DELETE TO authenticated
  USING (tenant_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ========== TRIGGERS ==========

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

CREATE POLICY "Anyone can view property images storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Users can delete own property images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

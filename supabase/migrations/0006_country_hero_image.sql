-- ===========================================================================
-- AppPassport — country hero images
-- Adds a hero/banner image URL to countries. Nullable; the UI falls back to a
-- branded gradient when null or if the image fails to load, so nothing breaks.
-- ===========================================================================

alter table public.countries add column if not exists hero_image_url text;

-- Curated Unsplash hero photos for the seed countries. Swap freely in /admin.
-- (Liberia intentionally left null -> branded gradient hero.)
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1600&q=70' where slug='china';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1600&q=70' where slug='japan';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=70' where slug='thailand';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=70' where slug='mexico';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=70' where slug='france';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=70' where slug='germany';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=70' where slug='italy';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=70' where slug='spain';

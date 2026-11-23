-- ===========================================================================
-- AppPassport — seed data
--
-- NOTE: This is PLACEHOLDER research for demonstration. App-availability facts
-- change quickly (VPN access, payment rails, etc.). Verify against live
-- research before treating any of this as launch-ready. Jim's real research
-- summary should replace these rows.
-- ===========================================================================

-- --- Categories ------------------------------------------------------------
insert into public.app_categories (name, sort_order) values
  ('Payments', 10),
  ('Messaging', 20),
  ('Maps & Navigation', 30),
  ('Ride-hailing', 40),
  ('Internet Access', 50),
  ('Social Media Access', 60)
on conflict (name) do nothing;

-- --- Countries -------------------------------------------------------------
insert into public.countries (name, slug, flag_emoji, region, status, country_alert, country_alert_detail) values
  ('China', 'china', '🇨🇳', 'Asia', 'published',
    'China''s "Great Firewall" blocks most Western apps. Set up a VPN and local payment apps BEFORE you arrive — you cannot download them once inside.',
    'Google (Search, Maps, Gmail), WhatsApp, Instagram, Facebook, X/Twitter and many news sites are blocked. A reputable VPN installed before arrival is the usual workaround, though reliability varies and rules can change without notice. Mobile payment is dominated by Alipay and WeChat Pay; both now let foreign visitors link international cards, but set this up in advance.'),
  ('Thailand', 'thailand', '🇹🇭', 'Asia', 'published',
    null, null),
  ('Japan', 'japan', '🇯🇵', 'Asia', 'published',
    null, null),
  ('Mexico', 'mexico', '🇲🇽', 'North America', 'published',
    null, null),
  ('France', 'france', '🇫🇷', 'Europe', 'published',
    null, null),
  ('Germany', 'germany', '🇩🇪', 'Europe', 'published',
    'Germany is heavily cash-preferred. Many restaurants, bakeries and small shops still do not accept cards — carry euros in cash.',
    'Contactless and mobile payments have grown, but a surprising number of smaller businesses remain cash-only or card-only-above-a-minimum. Withdraw cash from bank ATMs to avoid poor exchange rates.'),
  ('Italy', 'italy', '🇮🇹', 'Europe', 'published',
    null, null),
  ('Spain', 'spain', '🇪🇸', 'Europe', 'published',
    null, null),
  ('Liberia', 'liberia', '🇱🇷', 'Africa', 'published',
    'Liberia runs largely on cash and mobile money. Card acceptance is rare outside major hotels, and digital coverage is limited — plan to carry US dollars and Liberian dollars.',
    'Point-of-sale card terminals are uncommon; USSD-based mobile money (e.g. carrier wallets) is far more widely used than app-based payments. Data coverage is patchy outside Monrovia, so download maps and essentials offline before you travel.')
on conflict (slug) do nothing;

-- --- Helper: seed country_apps via slug/name lookups -----------------------
-- China -------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='china'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Alipay / WeChat Pay', 'Cards work at some spots, but locals pay by QR. Link a Visa/Mastercard inside Alipay or WeChat Pay before you go.',
   'before_you_land', 'works_with_caveats',
   'Alipay and WeChat Pay both support foreign cards for visitors now. Set it up before arrival; some small vendors are cash- or QR-only.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'no', 'WeChat', 'WhatsApp is blocked by the firewall. Everyone in China uses WeChat for messaging.',
   'before_you_land', 'blocked',
   'WhatsApp, Messenger and Signal are unreliable-to-blocked. WeChat is the de-facto standard and also handles payments, so most travelers install it before arriving.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'no', 'Amap (高德地图) / Apple Maps', 'Google Maps is blocked and inaccurate in China. Use Amap or Apple Maps.',
   'before_you_land', 'blocked',
   'Google services are blocked. Apple Maps works reasonably for visitors; Amap and Baidu Maps are the local standards but are Chinese-language first.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'no', 'DiDi', 'Uber left China. DiDi is the dominant ride-hailing app and has an English interface.',
   'before_you_land', 'blocked', null),
  ((select id from countries where slug='china'), (select id from app_categories where name='Internet Access'),
   'Google / Gmail', 'no', 'VPN required', 'Google, Gmail and most Western sites are blocked. Install a trusted VPN before you arrive.',
   'before_you_land', 'blocked',
   'You cannot download most VPN apps once inside China, so install and test one before you fly. VPN reliability fluctuates, especially around sensitive dates.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Social Media Access'),
   'Instagram', 'no', null, 'Instagram, Facebook and X are blocked. Access requires a VPN.',
   'before_you_land', 'blocked', null);

-- Thailand ----------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'partial', 'LINE', 'WhatsApp works, but almost everyone in Thailand communicates on LINE — hotels and tour operators included.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'no', 'Grab / Bolt', 'Uber merged into Grab in SE Asia. Use Grab (or Bolt) for rides and food delivery.',
   'before_you_land', 'blocked', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well in Thailand, including transit and Grab integration.',
   'none', 'works_fine', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'PromptPay QR', 'Cards work in cities, but street vendors and markets prefer PromptPay QR or cash.',
   'none', 'works_with_caveats', null);

-- Japan -------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='japan'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'partial', 'LINE', 'WhatsApp works but is rarely used. LINE is the standard messaging app in Japan.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', 'Suica (in Apple Wallet)', 'Apple Pay works, and you can add a Suica transit card to Apple Wallet for trains and convenience stores.',
   'before_you_land', 'works_fine',
   'Japan is still cash-friendly, but Apple Pay + Suica covers trains, vending machines and konbini. Add a Suica card in Apple Wallet before or on arrival.'),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works excellently in Japan, with detailed train and subway routing.',
   'none', 'works_fine', null),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'GO / DiDi', 'Uber exists but mostly books regular taxis and is limited. The GO taxi app is more widely used.',
   'before_you_land', 'works_with_caveats', null);

-- Mexico ------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'yes', 'DiDi', 'Uber works well in most Mexican cities. DiDi is a common, often cheaper alternative.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is the default way people communicate in Mexico — businesses included.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well; download offline maps for rural areas with spotty coverage.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Cash (pesos)', 'Cards and Apple Pay work in cities, but markets, taxis and small towns are cash-first.',
   'none', 'works_with_caveats', null);

-- France / Germany / Italy / Spain (EU, per-country) ----------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  -- France
  ((select id from countries where slug='france'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless cards are widely accepted across France.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'yes', 'Bolt / FREE NOW', 'Uber works in Paris and major cities; Bolt and FREE NOW are common alternatives.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including SNCF trains and Paris Métro routing.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is widely used across France for personal and some business messaging.',
   'none', 'works_fine', null),
  -- Germany
  ((select id from countries where slug='germany'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Cash (euros)', 'Apple Pay works at chains, but many small shops and restaurants are cash-only. Carry euros.',
   'none', 'works_with_caveats',
   'Germany''s cash preference surprises many US visitors. Bakeries, some restaurants and market stalls may refuse cards entirely.'),
  ((select id from countries where slug='germany'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'FREE NOW / Bolt', 'Uber operates in big cities but mainly dispatches licensed taxis. FREE NOW is widely used.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='germany'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', 'DB Navigator', 'Google Maps works well; the DB Navigator app is best for national rail tickets and delays.',
   'none', 'works_fine', null),
  -- Italy
  ((select id from countries where slug='italy'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless are broadly accepted; keep some cash for small cafés and rural spots.',
   'none', 'works_fine', null),
  ((select id from countries where slug='italy'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'FREE NOW / itTaxi', 'Uber is limited (mostly Uber Black in a few cities). Locals use FREE NOW or itTaxi.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='italy'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including Trenitalia and city transit.',
   'none', 'works_fine', null),
  -- Spain
  ((select id from countries where slug='spain'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless are widely accepted across Spain.',
   'none', 'works_fine', null),
  ((select id from countries where slug='spain'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'Cabify / FREE NOW / Bolt', 'Uber works in Madrid and some cities but is restricted in others; Cabify is a strong local option.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='spain'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including Renfe and metro routing.',
   'none', 'works_fine', null);

-- Liberia -----------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'no', 'Cash / mobile money (USSD)', 'Card terminals are rare. Most transactions are cash (USD & LRD) or carrier mobile money via USSD codes.',
   'before_you_land', 'blocked',
   'Bring US dollars and exchange for Liberian dollars locally. Mobile money is common but runs over USSD, not apps — a local SIM helps.'),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is the main way people communicate in Liberia where data is available.',
   'none', 'works_fine', null),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'partial', 'Offline maps (maps.me)', 'Coverage is thin outside Monrovia. Download offline maps before you travel.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Internet Access'),
   'Mobile data', 'partial', 'Local SIM (Orange / Lonestar)', 'Roaming is expensive and patchy. A local prepaid SIM is the practical option for data.',
   'before_you_land', 'works_with_caveats', null);

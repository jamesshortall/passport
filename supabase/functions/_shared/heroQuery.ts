// Shared Unsplash query builder for country hero photos.
//
// Problem it solves: searching Unsplash for the bare country name returns
// off-topic or wrong-subject photos — homonyms ("Georgia" the US state,
// "Jordan" the name, "Turkey" the bird, "Chad" the name) and generic shots.
// We (a) append scenic/travel qualifiers and (b) override the ambiguous or
// famously-scenic countries with a landmark-specific query.

/** Slug → curated scenic query for ambiguous or landmark-defined countries. */
export const LANDMARK_QUERIES: Record<string, string> = {
  georgia: "Tbilisi Georgia Caucasus mountains",
  jordan: "Petra Jordan desert canyon",
  turkey: "Cappadocia Turkey Istanbul",
  chad: "Zakouma Chad Sahara landscape",
  dominica: "Dominica island rainforest waterfall",
  "dominican-republic": "Punta Cana Dominican Republic beach",
  malta: "Valletta Malta harbour coast",
  jamaica: "Jamaica beach mountains coast",
  "north-macedonia": "Ohrid North Macedonia lake",
  montenegro: "Kotor Montenegro bay coast",
  luxembourg: "Luxembourg city old town valley",
  brunei: "Brunei mosque skyline river",
  fiji: "Fiji islands beach lagoon",
  panama: "Panama City skyline canal",
  "united-arab-emirates": "Dubai United Arab Emirates skyline desert",
  "united-kingdom": "London United Kingdom countryside coast",
  "united-states": "United States national park landscape",
  "south-korea": "Seoul South Korea mountains palace",
  "czech-republic": "Prague Czech Republic old town",
  "sri-lanka": "Sri Lanka temple tea hills coast",
  "costa-rica": "Costa Rica rainforest volcano beach",
  "el-salvador": "El Salvador volcano beach coast",
};

/**
 * Build a scenic, country-specific Unsplash search query.
 * @param name Display name of the country (e.g. "Turkey").
 * @param slug URL slug (e.g. "turkey"); used to look up landmark overrides.
 */
export function heroQuery(name: string, slug?: string): string {
  const key = (slug ?? name).toLowerCase().trim();
  const override = LANDMARK_QUERIES[key];
  const base = override && override.length > 0 ? override : name;
  // Scenic qualifiers steer Unsplash toward travel landscapes/landmarks and
  // away from people, products, and abstract shots.
  return `${base} landscape scenery landmark travel`;
}

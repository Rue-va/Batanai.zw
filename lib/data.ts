// Mock data powering the Batanai.zw prototype (no backend — simulated values)

// Farmer profile sized to Zimbabwe's smallholder reality: average arable
// landholding is ~1.8 ha (2017 Zimbabwe Smallholder Agricultural
// Productivity Survey, World Bank/ZIMSTAT) — not a commercial-scale farm.
export const farmer = {
  name: 'Tendai Moyo',
  farmName: 'Chinhoyi Family Farm',
  location: 'Chinhoyi, Mashonaland West',
  avatar: '/farmer-avatar.png',
  rating: 4.8,
  reviews: 46,
  verified: true,
  certifications: ['Master Farmer Certified', 'AGRITEX Registered'],
  memberSince: '2022',
}

export const tasks = [
  { title: 'Irrigation — Maize plot', time: 'Today, 6:00 AM', status: 'due', kind: 'water' },
  { title: 'Fertilizer application — Groundnut plot', time: 'Today, 10:00 AM', status: 'upcoming', kind: 'fertilize' },
  { title: 'Pest inspection — Potato bed', time: 'Tomorrow, 8:00 AM', status: 'upcoming', kind: 'scan' },
  { title: 'Soil moisture check — Sweet corn plot', time: 'Wed, 4:00 PM', status: 'upcoming', kind: 'soil' },
]

export const kpis = [
  { label: 'Active Plots', value: '3', unit: 'plots', trend: '+1', icon: 'layers' },
  { label: 'Total Area', value: '2.4', unit: 'hectares', trend: '+0.4', icon: 'map' },
  { label: 'Crops Growing', value: '4', unit: 'varieties', trend: 'Good', icon: 'sprout' },
  // A literal count of this week's AGRITEX-recommended tasks — not a
  // fabricated composite score.
  { label: 'Open Tasks', value: String(tasks.length), unit: 'this week', trend: 'On track', icon: 'tasks' },
]

export const weather = {
  temp: 24,
  condition: 'Partly Cloudy',
  location: 'Chinhoyi',
  humidity: 70,
  wind: 11,
  rainChance: 35,
  forecast: [
    { day: 'Mon', temp: 25, icon: 'sun' },
    { day: 'Tue', temp: 23, icon: 'cloud' },
    { day: 'Wed', temp: 22, icon: 'rain' },
    { day: 'Thu', temp: 24, icon: 'sun' },
    { day: 'Fri', temp: 26, icon: 'sun' },
  ],
}

// National average maize yield by season, tonnes/hectare — the closest
// available reference point for a smallholder to benchmark their own harvest
// against. Sourced from Zimbabwe Ministry of Agriculture / USDA FAS Grain &
// Feed Annual reporting; 2023/24 reflects the El Niño drought season.
export const nationalMaizeYield = [
  { season: '2019/20', yield: 0.5 },
  { season: '2020/21', yield: 1.4 },
  { season: '2021/22', yield: 1.4 },
  { season: '2022/23', yield: 2.4 },
  { season: '2023/24', yield: 0.8 },
]

export const cropDistribution = [
  { name: 'Maize', value: 45, color: 'var(--chart-1)' },
  { name: 'Groundnuts', value: 20, color: 'var(--chart-2)' },
  { name: 'Potato', value: 15, color: 'var(--chart-3)' },
  { name: 'Sweet Corn', value: 12, color: 'var(--chart-4)' },
  { name: 'Other', value: 8, color: 'var(--chart-5)' },
]

// Last physical soil test, logged manually (not a live sensor feed). Bands
// follow standard agronomic sufficiency ranges published in FAO/Zimbabwe
// Ministry of Agriculture soil fertility guides — each reading is compared
// against a public threshold, not an opaque formula.
export const soilTest = {
  source: 'AGRITEX extension officer soil sample',
  sampledDate: 'March 2026',
  results: [
    { label: 'Nitrogen (N)', value: '18 ppm', band: 'Low', threshold: 'Below 20 ppm = low' },
    { label: 'Phosphorus (P, Olsen)', value: '12 ppm', band: 'Medium', threshold: '10–15 ppm = medium' },
    { label: 'Potassium (K)', value: '145 ppm', band: 'High', threshold: 'Above 120 ppm = high' },
    { label: 'pH (CaCl₂)', value: '5.4', band: 'Slightly acidic', threshold: '5.0–6.0 = slightly acidic; maize prefers 5.5–7.0' },
  ],
}

// --- Decision Support ---
// Rule-based only: (crop, region, season) -> guidance. No trained model, no
// yield-prediction percentages — see AdviceRule in the architecture doc.

export const regions = ['Mashonaland', 'Manicaland', 'Matabeleland', 'Masvingo'] as const
export const seasons = ['Rainy season (Nov–Mar)', 'Dry/winter season (Apr–Aug)'] as const

export const adviceRules = [
  {
    crop: 'Maize',
    region: 'Mashonaland',
    season: 'Rainy season (Nov–Mar)',
    planting: 'Plant early-to-mid November once rains are established. Row spacing 90cm x 25cm.',
    watering: 'Rain-fed; irrigate only if a dry spell exceeds 10 days during flowering.',
    fertilizer: 'Basal Compound D at planting; top-dress with Ammonium Nitrate 4–6 weeks after emergence.',
    pest: 'Scout for fall armyworm from emergence. Hand-pick egg masses or apply an approved insecticide at first sign.',
  },
  {
    crop: 'Groundnut',
    region: 'Mashonaland',
    season: 'Rainy season (Nov–Mar)',
    planting: 'Plant mid-November on ridges. Row spacing 45cm x 10cm, shallow depth (5cm).',
    watering: 'Rain-fed; avoid waterlogging — ensure ridges drain well.',
    fertilizer: 'Apply gypsum at flowering to support pod fill; avoid excess nitrogen.',
    pest: 'Monitor for leaf spot and rosette virus; rotate with cereals to reduce carryover.',
  },
  {
    crop: 'Tomato',
    region: 'Manicaland',
    season: 'Dry/winter season (Apr–Aug)',
    planting: 'Transplant seedlings once frost risk has passed. Spacing 60cm x 45cm.',
    watering: 'Drip or furrow irrigate 2–3 times weekly; keep foliage dry to limit blight.',
    fertilizer: 'Basal compound at transplanting; top-dress potassium nitrate at first flowering.',
    pest: 'Watch for early/late blight in humid mornings. Remove affected leaves and apply a copper-based fungicide preventively.',
  },
  {
    crop: 'Sorghum',
    region: 'Matabeleland',
    season: 'Rainy season (Nov–Mar)',
    planting: 'Plant with the first effective rains (Nov–Dec). Row spacing 75cm x 20cm.',
    watering: 'Drought-tolerant; rain-fed is normally sufficient across this region.',
    fertilizer: 'Light basal application; sorghum performs well on moderate-fertility soils.',
    pest: 'Scout for quelea bird damage near heading and stalk borer early in the season.',
  },
  {
    crop: 'Sweet Potato',
    region: 'Masvingo',
    season: 'Dry/winter season (Apr–Aug)',
    planting: 'Plant vine cuttings on ridges after the rains recede. Spacing 30cm x 90cm.',
    watering: 'Irrigate every 7–10 days; drought-tolerant once established.',
    fertilizer: 'Low nitrogen — excess nitrogen favors vine growth over root/tuber development.',
    pest: 'Check for sweet potato weevil; rotate fields and avoid planting in cracked soil.',
  },
] as const

// Reference-only qualitative fit, sourced from agronomic guides — not a
// personalized ML prediction. Kept qualitative deliberately (see doc §6).
export const cropRecommendations = [
  {
    crop: 'Potato',
    fit: 'Great fit',
    reason: 'Cool-season window and well-drained soils suit potato in this region.',
    window: 'Plant by Mar 15',
    typicalYield: '25–35 t/ha (regional reference range)',
    image: '/crop-potato.png',
  },
  {
    crop: 'Sweet Corn',
    fit: 'Good fit',
    reason: 'Responds well to potassium-rich soils; steady local market demand this quarter.',
    window: 'Plant by Apr 2',
    typicalYield: '14–20 t/ha (regional reference range)',
    image: '/crop-corn.png',
  },
  {
    crop: 'Soybean',
    fit: 'Good fit',
    reason: 'Nitrogen-fixing rotation crop — improves soil health for the season after.',
    window: 'Plant by Apr 20',
    typicalYield: '2.5–3.5 t/ha (regional reference range)',
    image: '/crop-soybean.png',
  },
]

export const recommendations = [
  {
    kind: 'irrigation',
    title: 'Reduce watering on the maize plot',
    detail: 'Soil moisture is 6% above optimal. Skip the next watering to save effort and prevent root rot.',
    priority: 'medium',
    saving: 'Saves a watering cycle',
  },
  {
    kind: 'fertilizer',
    title: 'Apply top-dressing to groundnut plot',
    detail: 'Phosphorus at 54% (moderate). A light gypsum application before flowering can lift pod fill.',
    priority: 'high',
    saving: 'Supports pod fill',
  },
  {
    kind: 'pest',
    title: 'Late blight risk rising',
    detail: 'Humidity + temperature forecast favors late blight on potato within 72h. Scout the potato bed and consider a preventive spray.',
    priority: 'high',
    saving: 'Prevents crop loss',
  },
  {
    kind: 'resource',
    title: 'Share transport to Chinhoyi market',
    detail: 'Coordinate with nearby farmers on this week\'s delivery run to split transport costs.',
    priority: 'low',
    saving: 'Cuts transport cost',
  },
]

// Stretch feature placeholder: no real image classifier is wired up yet, so
// "rescanning" cycles through these canned results rather than calling a
// model. Swap for a real on-device classifier (e.g. TensorFlow.js trained on
// PlantVillage) when that becomes available.
export const scanResults = [
  {
    crop: 'Potato Plant',
    issues: [
      { name: 'Bug Infected', severity: 'Detected', level: 60, tone: 'warn' },
      { name: 'Bacterial Blight', severity: 'Low', level: 35, tone: 'info' },
    ],
  },
  {
    crop: 'Maize Plant',
    issues: [{ name: 'Leaf Discoloration', severity: 'Low', level: 20, tone: 'info' }],
  },
  {
    crop: 'Groundnut Plant',
    issues: [{ name: 'Leaf Spot', severity: 'Moderate', level: 45, tone: 'warn' }],
  },
]

// --- Marketplace ---
// Prices are USD/tonne (Zimbabwe's agricultural trade is largely dollarized).
// Maize/soybean/wheat are grounded in 2025/26 GMB producer prices; potato and
// sweet corn are fresh-market crops priced from informal-market benchmarks
// (Mbare Musika-style wholesale), not GMB-benchmarked — see marketPrices below.

export const listings = [
  {
    id: 'L-1042',
    crop: 'Organic Potato',
    grade: 'A',
    quantity: '12 t',
    price: 520,
    unit: '/ton',
    available: 'Available now',
    market: 500,
    image: '/crop-potato.png',
    status: 'active',
    views: 214,
    synced: true,
  },
  {
    id: 'L-1039',
    crop: 'Sweet Corn',
    grade: 'A',
    quantity: '8 t',
    price: 320,
    unit: '/ton',
    available: 'From Apr 10',
    market: 300,
    image: '/crop-corn.png',
    status: 'active',
    views: 156,
    synced: true,
  },
  {
    id: 'L-1031',
    crop: 'Soybean',
    grade: 'B',
    quantity: '5 t',
    price: 560,
    unit: '/ton',
    available: 'From Apr 25',
    market: 580,
    image: '/crop-soybean.png',
    status: 'active',
    views: 98,
    synced: true,
  },
]

// Multi-farmer listings a buyer can browse/search/filter across regions.
export const browseListings = [
  { id: 'B-1', crop: 'Organic Potato', farmerName: 'Green Valley Farms', region: 'Mashonaland', grade: 'A', quantity: '12 t', price: 520, unit: '/ton', image: '/crop-potato.png' },
  { id: 'B-2', crop: 'Sweet Corn', farmerName: 'Chiredzi Growers Co-op', region: 'Masvingo', grade: 'A', quantity: '8 t', price: 320, unit: '/ton', image: '/crop-corn.png' },
  { id: 'B-3', crop: 'Soybean', farmerName: 'Mutare Highlands Farm', region: 'Manicaland', grade: 'B', quantity: '5 t', price: 560, unit: '/ton', image: '/crop-soybean.png' },
  { id: 'B-4', crop: 'Sweet Corn', farmerName: 'Bulawayo Fresh Produce', region: 'Matabeleland', grade: 'A', quantity: '3 t', price: 300, unit: '/ton', image: '/crop-corn.png' },
  { id: 'B-5', crop: 'Organic Potato', farmerName: 'Nyanga Highveld Farm', region: 'Manicaland', grade: 'A', quantity: '6 t', price: 540, unit: '/ton', image: '/crop-potato.png' },
  { id: 'B-6', crop: 'Soybean', farmerName: 'Gokwe Farmers Union', region: 'Mashonaland', grade: 'A', quantity: '9 t', price: 590, unit: '/ton', image: '/crop-soybean.png' },
]

// Simulated transaction pipeline: Interested -> Negotiating -> Agreed -> Completed.
// No real payment/escrow integration — status only (see architecture doc §1 scope).
export const orders = [
  {
    id: 'ORD-2087',
    buyer: 'FreshPack Processors',
    buyerType: 'Processor',
    crop: 'Organic Potato',
    quantity: '6 t',
    total: 3120,
    status: 'Interested',
    date: 'Jun 24',
    rating: 4.9,
  },
  {
    id: 'ORD-2081',
    buyer: 'GreenLeaf Retail',
    buyerType: 'Retailer',
    crop: 'Sweet Corn',
    quantity: '3 t',
    total: 960,
    status: 'Negotiating',
    date: 'Jun 22',
    rating: 4.7,
  },
  {
    id: 'ORD-2074',
    buyer: 'Export Union Co.',
    buyerType: 'Exporter',
    crop: 'Soybean',
    quantity: '5 t',
    total: 2900,
    status: 'Completed',
    date: 'Jun 18',
    rating: 5.0,
  },
]

// Regional benchmark: 2025/26 GMB producer prices (maize, soybean, wheat) plus
// an informal-market groundnuts estimate. Sources noted in project memory.
export const marketPrices = [
  { crop: 'Maize', price: 380, change: 2.6 },
  { crop: 'Soybean', price: 580, change: 1.8 },
  { crop: 'Wheat', price: 450, change: 0 },
  { crop: 'Groundnuts', price: 450, change: -1.5 },
]

export const messages = [
  { from: 'FreshPack Processors', text: 'Can you commit to 6t of Grade A potato by Jun 24?', time: '2h', unread: true },
  { from: 'GreenLeaf Retail', text: 'Shipment received, quality excellent. Thank you!', time: '1d', unread: false },
  { from: 'Export Union Co.', text: 'Interested in a recurring soybean contract.', time: '2d', unread: false },
]

// --- Buyer dashboard ---
// Illustrative business-scale figures (not sourced) sized to be internally
// consistent with the per-tonne prices above — a processor buying a few
// tonnes/month at $300–600/ton lands in the low thousands of USD.
export const buyerStats = {
  activeInquiries: 5,
  completedTrades: 12,
  verifiedFarmers: 18,
  monthlySpend: 4850,
}

export const sourcingRegions = [
  { name: 'Mashonaland', value: 40, color: 'var(--chart-1)' },
  { name: 'Manicaland', value: 25, color: 'var(--chart-2)' },
  { name: 'Masvingo', value: 20, color: 'var(--chart-3)' },
  { name: 'Matabeleland', value: 15, color: 'var(--chart-4)' },
]

export const recentTrades = [
  { crop: 'Organic Potato', farmerName: 'Green Valley Farms', quantity: '6 t', total: 3120, status: 'Completed', date: 'Jun 18' },
  { crop: 'Sweet Corn', farmerName: 'Chiredzi Growers Co-op', quantity: '3 t', total: 960, status: 'Negotiating', date: 'Jun 22' },
  { crop: 'Soybean', farmerName: 'Mutare Highlands Farm', quantity: '5 t', total: 2900, status: 'Interested', date: 'Jun 24' },
]

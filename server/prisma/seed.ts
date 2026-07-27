// Seeds two kinds of data:
// 1. Reference/lookup data (regions, crops, advice_rules) that used to live
//    as hardcoded arrays in the frontend's lib/data.ts, so the rule-based
//    decision-support lookup keeps working once the frontend calls the API.
// 2. Demo accounts + listings + a completed, rated transaction — so a fresh
//    buyer signup sees real marketplace content instead of an empty screen,
//    and there's a working admin account without needing a manual DB edit.
//    All demo accounts share the password below; this is seed/demo data
//    only, never run against a production database with real users.
import { PrismaClient, Season, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Batanai2026!';
const BCRYPT_ROUNDS = 12;

const REGIONS = ['Mashonaland', 'Manicaland', 'Matabeleland', 'Masvingo'];

const CROPS = ['Maize', 'Groundnut', 'Tomato', 'Sorghum', 'Sweet Potato', 'Potato', 'Sweet Corn', 'Soybean'];

const ADVICE_RULES: {
  crop: string;
  region: string;
  season: Season;
  planting: string;
  watering: string;
  fertilizer: string;
  pest: string;
}[] = [
  {
    crop: 'Maize',
    region: 'Mashonaland',
    season: Season.rainy,
    planting: 'Plant early-to-mid November once rains are established. Row spacing 90cm x 25cm.',
    watering: 'Rain-fed; irrigate only if a dry spell exceeds 10 days during flowering.',
    fertilizer: 'Basal Compound D at planting; top-dress with Ammonium Nitrate 4–6 weeks after emergence.',
    pest: 'Scout for fall armyworm from emergence. Hand-pick egg masses or apply an approved insecticide at first sign.',
  },
  {
    crop: 'Groundnut',
    region: 'Mashonaland',
    season: Season.rainy,
    planting: 'Plant mid-November on ridges. Row spacing 45cm x 10cm, shallow depth (5cm).',
    watering: 'Rain-fed; avoid waterlogging — ensure ridges drain well.',
    fertilizer: 'Apply gypsum at flowering to support pod fill; avoid excess nitrogen.',
    pest: 'Monitor for leaf spot and rosette virus; rotate with cereals to reduce carryover.',
  },
  {
    crop: 'Tomato',
    region: 'Manicaland',
    season: Season.dry_winter,
    planting: 'Transplant seedlings once frost risk has passed. Spacing 60cm x 45cm.',
    watering: 'Drip or furrow irrigate 2–3 times weekly; keep foliage dry to limit blight.',
    fertilizer: 'Basal compound at transplanting; top-dress potassium nitrate at first flowering.',
    pest: 'Watch for early/late blight in humid mornings. Remove affected leaves and apply a copper-based fungicide preventively.',
  },
  {
    crop: 'Sorghum',
    region: 'Matabeleland',
    season: Season.rainy,
    planting: 'Plant with the first effective rains (Nov–Dec). Row spacing 75cm x 20cm.',
    watering: 'Drought-tolerant; rain-fed is normally sufficient across this region.',
    fertilizer: 'Light basal application; sorghum performs well on moderate-fertility soils.',
    pest: 'Scout for quelea bird damage near heading and stalk borer early in the season.',
  },
  {
    crop: 'Sweet Potato',
    region: 'Masvingo',
    season: Season.dry_winter,
    planting: 'Plant vine cuttings on ridges after the rains recede. Spacing 30cm x 90cm.',
    watering: 'Irrigate every 7–10 days; drought-tolerant once established.',
    fertilizer: 'Low nitrogen — excess nitrogen favors vine growth over root/tuber development.',
    pest: 'Check for sweet potato weevil; rotate fields and avoid planting in cracked soil.',
  },
];

async function main() {
  const regionByName = new Map<string, string>();
  for (const name of REGIONS) {
    const region = await prisma.region.upsert({ where: { name }, update: {}, create: { name } });
    regionByName.set(name, region.id);
  }

  const cropByName = new Map<string, string>();
  for (const name of CROPS) {
    const crop = await prisma.crop.upsert({ where: { name }, update: {}, create: { name } });
    cropByName.set(name, crop.id);
  }

  for (const rule of ADVICE_RULES) {
    const cropId = cropByName.get(rule.crop);
    const regionId = regionByName.get(rule.region);
    if (!cropId || !regionId) throw new Error(`Missing crop/region for advice rule: ${rule.crop}/${rule.region}`);

    await prisma.adviceRule.upsert({
      where: { cropId_regionId_season: { cropId, regionId, season: rule.season } },
      update: {
        planting: rule.planting,
        watering: rule.watering,
        fertilizer: rule.fertilizer,
        pest: rule.pest,
      },
      create: {
        cropId,
        regionId,
        season: rule.season,
        planting: rule.planting,
        watering: rule.watering,
        fertilizer: rule.fertilizer,
        pest: rule.pest,
      },
    });
  }

  console.log(`Seeded ${REGIONS.length} regions, ${CROPS.length} crops, ${ADVICE_RULES.length} advice rules.`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  const FARMERS = [
    { name: 'Tendai Moyo', farmName: 'Chinhoyi Family Farm', email: 'tendai.moyo@batanai.zw', region: 'Mashonaland', locationLabel: 'Chinhoyi, Mashonaland West', verified: true, certifications: ['Master Farmer Certified', 'AGRITEX Registered'] },
    { name: 'Farai Ncube', farmName: 'Green Valley Farms', email: 'farai.ncube@batanai.zw', region: 'Mashonaland', locationLabel: 'Bindura, Mashonaland Central', verified: true, certifications: ['AGRITEX Registered'] },
    { name: 'Rudo Chikwava', farmName: 'Chiredzi Growers Co-op', email: 'rudo.chikwava@batanai.zw', region: 'Masvingo', locationLabel: 'Chiredzi, Masvingo', verified: true, certifications: [] as string[] },
    { name: 'Tapiwa Mutasa', farmName: 'Mutare Highlands Farm', email: 'tapiwa.mutasa@batanai.zw', region: 'Manicaland', locationLabel: 'Mutare, Manicaland', verified: false, certifications: [] as string[] },
    { name: 'Sipho Ndlovu', farmName: 'Bulawayo Fresh Produce', email: 'sipho.ndlovu@batanai.zw', region: 'Matabeleland', locationLabel: 'Bulawayo, Matabeleland', verified: true, certifications: ['AGRITEX Registered'] },
  ];

  const BUYERS = [
    { name: 'Chido Marufu', farmName: 'FreshPack Processors', email: 'chido.marufu@batanai.zw', region: 'Mashonaland', locationLabel: 'Harare' },
    { name: 'Blessing Sibanda', farmName: 'GreenLeaf Retail', email: 'blessing.sibanda@batanai.zw', region: 'Matabeleland', locationLabel: 'Bulawayo' },
  ];

  const farmerByEmail = new Map<string, string>();
  for (const f of FARMERS) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        name: f.name,
        email: f.email,
        passwordHash,
        role: Role.farmer,
        farmName: f.farmName,
        regionId: regionByName.get(f.region),
        locationLabel: f.locationLabel,
        verified: f.verified,
        certifications: f.certifications,
        lastLoginAt: new Date(),
      },
    });
    farmerByEmail.set(f.email, user.id);
  }

  const buyerByEmail = new Map<string, string>();
  for (const b of BUYERS) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: {
        name: b.name,
        email: b.email,
        passwordHash,
        role: Role.buyer,
        farmName: b.farmName,
        regionId: regionByName.get(b.region),
        locationLabel: b.locationLabel,
        lastLoginAt: new Date(),
      },
    });
    buyerByEmail.set(b.email, user.id);
  }

  await prisma.user.upsert({
    where: { email: 'admin@batanai.zw' },
    update: {},
    create: {
      name: 'Batanai Admin',
      email: 'admin@batanai.zw',
      passwordHash,
      role: Role.admin,
      lastLoginAt: new Date(),
    },
  });

  const LISTINGS: {
    farmerEmail: string;
    crop: string;
    grade: string;
    quantity: string;
    unit: string;
    price: number;
    marketPrice: number;
    region: string;
  }[] = [
    { farmerEmail: 'tendai.moyo@batanai.zw', crop: 'Organic Potato', grade: 'A', quantity: '12', unit: 't', price: 520, marketPrice: 500, region: 'Mashonaland' },
    { farmerEmail: 'tendai.moyo@batanai.zw', crop: 'Maize', grade: 'A', quantity: '20', unit: 't', price: 380, marketPrice: 380, region: 'Mashonaland' },
    { farmerEmail: 'farai.ncube@batanai.zw', crop: 'Sweet Corn', grade: 'A', quantity: '8', unit: 't', price: 320, marketPrice: 300, region: 'Mashonaland' },
    { farmerEmail: 'farai.ncube@batanai.zw', crop: 'Groundnuts', grade: 'B', quantity: '6', unit: 't', price: 450, marketPrice: 450, region: 'Mashonaland' },
    { farmerEmail: 'rudo.chikwava@batanai.zw', crop: 'Soybean', grade: 'B', quantity: '5', unit: 't', price: 560, marketPrice: 580, region: 'Masvingo' },
    { farmerEmail: 'tapiwa.mutasa@batanai.zw', crop: 'Organic Potato', grade: 'A', quantity: '6', unit: 't', price: 540, marketPrice: 500, region: 'Manicaland' },
    { farmerEmail: 'tapiwa.mutasa@batanai.zw', crop: 'Sweet Corn', grade: 'A', quantity: '3', unit: 't', price: 300, marketPrice: 300, region: 'Manicaland' },
    { farmerEmail: 'sipho.ndlovu@batanai.zw', crop: 'Soybean', grade: 'A', quantity: '9', unit: 't', price: 590, marketPrice: 580, region: 'Matabeleland' },
  ];

  for (const l of LISTINGS) {
    const farmerId = farmerByEmail.get(l.farmerEmail);
    if (!farmerId) throw new Error(`Missing seeded farmer for listing: ${l.farmerEmail}`);
    const existing = await prisma.listing.findFirst({ where: { farmerId, crop: l.crop } });
    if (existing) continue;
    await prisma.listing.create({
      data: {
        farmerId,
        crop: l.crop,
        grade: l.grade,
        quantity: l.quantity,
        unit: l.unit,
        price: l.price,
        marketPrice: l.marketPrice,
        regionId: regionByName.get(l.region),
        status: 'active',
        views: Math.floor(20 + Math.random() * 200),
      },
    });
  }

  // One completed, rated transaction so the demo has real trade history and
  // a non-zero rating to show in both the buyer/farmer profile and admin view.
  const demoFarmerId = farmerByEmail.get('tendai.moyo@batanai.zw')!;
  const demoBuyerId = buyerByEmail.get('chido.marufu@batanai.zw')!;
  const demoListing = await prisma.listing.findFirst({ where: { farmerId: demoFarmerId, crop: 'Organic Potato' } });

  if (demoListing) {
    const existingTx = await prisma.transaction.findFirst({ where: { listingId: demoListing.id, buyerId: demoBuyerId } });
    const tx =
      existingTx ??
      (await prisma.transaction.create({
        data: {
          listingId: demoListing.id,
          farmerId: demoFarmerId,
          buyerId: demoBuyerId,
          quantity: '6 t',
          totalPrice: 3120,
          status: 'Completed',
        },
      }));

    const existingRating = await prisma.rating.findUnique({ where: { transactionId: tx.id } });
    if (!existingRating) {
      await prisma.$transaction(async (t) => {
        await t.rating.create({
          data: {
            transactionId: tx.id,
            fromUserId: demoBuyerId,
            toUserId: demoFarmerId,
            value: 5,
            comment: 'Shipment received, quality excellent. Thank you!',
          },
        });
        const agg = await t.rating.aggregate({ where: { toUserId: demoFarmerId }, _avg: { value: true }, _count: true });
        await t.user.update({ where: { id: demoFarmerId }, data: { rating: agg._avg.value, reviewCount: agg._count } });
      });
    }
  }

  console.log(
    `Seeded ${FARMERS.length} demo farmers, ${BUYERS.length} demo buyers, 1 admin, ${LISTINGS.length} listings. Demo password: ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

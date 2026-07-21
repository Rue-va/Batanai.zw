// Seeds the reference/lookup data that used to live as hardcoded arrays in
// the frontend's lib/data.ts (regions, crops, advice_rules), so the rule-based
// decision-support lookup keeps working once the frontend calls the API
// instead of importing mock data directly.
import { PrismaClient, Season } from '@prisma/client';

const prisma = new PrismaClient();

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

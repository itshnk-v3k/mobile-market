/**
 * Idempotent seed script for Mobile Market.
 *
 * Safe to re-run: every write is an `upsert` keyed on a natural unique
 * constraint (email, slug, [categoryId, key], [*, locale], or a fixed id),
 * so running `npx prisma db seed` twice never duplicates rows or trips a
 * unique constraint. Matches the NEOMATTEN seed convention (see
 * MOBILE_MARKET_ARCHITECTURE_REFERENCE.md §5).
 *
 * Seeds: one ADMIN user, 4 categories (EN+RU translations, published),
 * per-category spec template fields (EN+RU labels), and one published
 * Chișinău store location.
 */
import { PrismaClient, Locale, SpecInputType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_COST = 10;
const ADMIN_EMAIL = 'admin@mobile-market.md';

// Fixed id so the single showroom row upserts deterministically (StoreLocation
// has no natural unique key other than its primary key).
const STORE_LOCATION_ID = '11111111-1111-4111-8111-111111111111';

type LocaleText = Record<Locale, string>;

interface SpecFieldSeed {
  key: string;
  group: string;
  inputType: SpecInputType;
  unit?: string;
  sortOrder: number;
  isFilterable: boolean;
  labels: LocaleText;
}

interface CategorySeed {
  slug: string;
  sortOrder: number;
  translations: { name: LocaleText; description: LocaleText };
  specFields: SpecFieldSeed[];
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'smartphones',
    sortOrder: 1,
    translations: {
      name: { EN: 'Smartphones', RU: 'Смартфоны' },
      description: {
        EN: 'Smartphones and mobile phones.',
        RU: 'Смартфоны и мобильные телефоны.',
      },
    },
    specFields: [
      {
        key: 'ram',
        group: 'Memory',
        inputType: SpecInputType.NUMBER,
        unit: 'GB',
        sortOrder: 1,
        isFilterable: true,
        labels: { EN: 'RAM', RU: 'Оперативная память' },
      },
      {
        key: 'storage',
        group: 'Memory',
        inputType: SpecInputType.NUMBER,
        unit: 'GB',
        sortOrder: 2,
        isFilterable: true,
        labels: { EN: 'Storage', RU: 'Накопитель' },
      },
      {
        key: 'screen_size',
        group: 'Display',
        inputType: SpecInputType.NUMBER,
        unit: 'in',
        sortOrder: 3,
        isFilterable: true,
        labels: { EN: 'Screen Size', RU: 'Размер экрана' },
      },
    ],
  },
  {
    slug: 'laptops',
    sortOrder: 2,
    translations: {
      name: { EN: 'Laptops', RU: 'Ноутбуки' },
      description: {
        EN: 'Laptops and notebooks.',
        RU: 'Ноутбуки и лэптопы.',
      },
    },
    specFields: [
      {
        key: 'cpu',
        group: 'Performance',
        inputType: SpecInputType.TEXT,
        sortOrder: 1,
        isFilterable: true,
        labels: { EN: 'CPU', RU: 'Процессор' },
      },
      {
        key: 'gpu',
        group: 'Performance',
        inputType: SpecInputType.TEXT,
        sortOrder: 2,
        isFilterable: true,
        labels: { EN: 'GPU', RU: 'Видеокарта' },
      },
      {
        key: 'ram',
        group: 'Memory',
        inputType: SpecInputType.NUMBER,
        unit: 'GB',
        sortOrder: 3,
        isFilterable: true,
        labels: { EN: 'RAM', RU: 'Оперативная память' },
      },
    ],
  },
  {
    slug: 'tablets',
    sortOrder: 3,
    translations: {
      name: { EN: 'Tablets', RU: 'Планшеты' },
      description: {
        EN: 'Tablets and e-readers.',
        RU: 'Планшеты и электронные книги.',
      },
    },
    specFields: [
      {
        key: 'screen_size',
        group: 'Display',
        inputType: SpecInputType.NUMBER,
        unit: 'in',
        sortOrder: 1,
        isFilterable: true,
        labels: { EN: 'Screen Size', RU: 'Размер экрана' },
      },
      {
        key: 'storage',
        group: 'Memory',
        inputType: SpecInputType.NUMBER,
        unit: 'GB',
        sortOrder: 2,
        isFilterable: true,
        labels: { EN: 'Storage', RU: 'Накопитель' },
      },
    ],
  },
  {
    slug: 'accessories',
    sortOrder: 4,
    translations: {
      name: { EN: 'Accessories', RU: 'Аксессуары' },
      description: {
        EN: 'Chargers, cases, cables and other accessories.',
        RU: 'Зарядные устройства, чехлы, кабели и другие аксессуары.',
      },
    },
    specFields: [],
  },
];

const LOCALES: Locale[] = [Locale.EN, Locale.RU];

async function seedAdmin(): Promise<void> {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password) {
    throw new Error(
      'ADMIN_SEED_PASSWORD is not set. Add it to backend/.env before seeding (see .env.example).',
    );
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    // Re-hash the password on update so rotating ADMIN_SEED_PASSWORD takes
    // effect, but never downgrade the role or reactivate a disabled account
    // in a way that clobbers admin edits — role/isActive are set on create only.
    update: { passwordHash },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`  ✔ admin user  (${ADMIN_EMAIL}, role ADMIN)`);
}

async function seedCategories(): Promise<void> {
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { sortOrder: cat.sortOrder, isPublished: true },
      create: { slug: cat.slug, sortOrder: cat.sortOrder, isPublished: true },
    });

    for (const locale of LOCALES) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: {
          name: cat.translations.name[locale],
          description: cat.translations.description[locale],
        },
        create: {
          categoryId: category.id,
          locale,
          name: cat.translations.name[locale],
          description: cat.translations.description[locale],
        },
      });
    }

    for (const field of cat.specFields) {
      const specField = await prisma.specTemplateField.upsert({
        where: {
          categoryId_key: { categoryId: category.id, key: field.key },
        },
        update: {
          group: field.group,
          inputType: field.inputType,
          unit: field.unit ?? null,
          sortOrder: field.sortOrder,
          isFilterable: field.isFilterable,
        },
        create: {
          categoryId: category.id,
          key: field.key,
          group: field.group,
          inputType: field.inputType,
          unit: field.unit ?? null,
          sortOrder: field.sortOrder,
          isFilterable: field.isFilterable,
        },
      });

      for (const locale of LOCALES) {
        await prisma.specFieldTranslation.upsert({
          where: { fieldId_locale: { fieldId: specField.id, locale } },
          update: { label: field.labels[locale] },
          create: {
            fieldId: specField.id,
            locale,
            label: field.labels[locale],
          },
        });
      }
    }

    console.log(
      `  ✔ category    (${cat.slug}, ${cat.specFields.length} spec field(s))`,
    );
  }
}

async function seedStoreLocation(): Promise<void> {
  const data = {
    city: 'Chișinău',
    address: 'bd. Ștefan cel Mare și Sfânt 1, Chișinău, MD-2001',
    latitude: 47.024512,
    longitude: 28.832157,
    phone: '+373 22 000 000',
    workingHours: 'Mon–Sun 09:00–20:00',
    isActive: true,
    isPublished: true,
  };

  await prisma.storeLocation.upsert({
    where: { id: STORE_LOCATION_ID },
    update: data,
    create: { id: STORE_LOCATION_ID, ...data },
  });
  console.log('  ✔ store       (Chișinău showroom, published)');
}

async function main(): Promise<void> {
  console.log('Seeding Mobile Market…');
  await seedAdmin();
  await seedCategories();
  await seedStoreLocation();
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

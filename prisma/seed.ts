import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting restaurant database seed...");

  // 1. Seed Demo Staff Users
  const defaultPassword = "DemoPass123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      name: "Admin User",
      email: "admin@restaurant.demo",
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
    {
      name: "Captain User",
      email: "captain@restaurant.demo",
      role: Role.CAPTAIN,
      passwordHash,
      isActive: true,
    },
    {
      name: "Kitchen Head",
      email: "kitchen@restaurant.demo",
      role: Role.KITCHEN,
      passwordHash,
      isActive: true,
    },
    {
      name: "Billing Cashier",
      email: "billing@restaurant.demo",
      role: Role.BILLING,
      passwordHash,
      isActive: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
      },
      create: user,
    });
  }
  console.log(`✅ Seeded ${users.length} demo staff users`);

  // 2. Seed Dining Tables
  const tables = [
    { label: "T1", capacity: 2 },
    { label: "T2", capacity: 4 },
    { label: "T3", capacity: 4 },
    { label: "T4", capacity: 6 },
  ];

  for (const table of tables) {
    await prisma.diningTable.upsert({
      where: { label: table.label },
      update: { capacity: table.capacity, isActive: true },
      create: { label: table.label, capacity: table.capacity, isActive: true },
    });
  }
  console.log(`✅ Seeded ${tables.length} dining tables`);

  // 3. Seed Menu Categories & Menu Items
  const menuData = [
    {
      category: "Starters",
      sortOrder: 1,
      items: [
        {
          name: "Chicken 65",
          description: "Crispy, deep-fried spiced chicken bites with curry leaves",
          price: 180.0,
        },
        {
          name: "Veg Roll",
          description: "Crispy rolls filled with spiced seasonal garden vegetables",
          price: 90.0,
        },
      ],
    },
    {
      category: "Main Course",
      sortOrder: 2,
      items: [
        {
          name: "Chicken Biriyani",
          description: "Aromatic fragrant basmati rice cooked with tender marinated chicken and spices",
          price: 240.0,
        },
        {
          name: "Veg Biriyani",
          description: "Richly spiced basmati rice layered with fresh vegetables and herbs",
          price: 160.0,
        },
        {
          name: "Porotta",
          description: "Flaky layered golden Kerala flatbread",
          price: 25.0,
        },
      ],
    },
    {
      category: "Drinks",
      sortOrder: 3,
      items: [
        {
          name: "Lime Juice",
          description: "Refreshing freshly squeezed sweet and salted lime cooler",
          price: 50.0,
        },
        {
          name: "Mineral Water",
          description: "Packaged 1L chilled drinking water",
          price: 20.0,
        },
      ],
    },
    {
      category: "Dessert",
      sortOrder: 4,
      items: [
        {
          name: "Ice Cream",
          description: "Two scoops of rich vanilla ice cream with chocolate drizzle",
          price: 80.0,
        },
      ],
    },
  ];

  for (const categoryData of menuData) {
    const category = await prisma.menuCategory.upsert({
      where: { name: categoryData.category },
      update: { sortOrder: categoryData.sortOrder, isActive: true },
      create: {
        name: categoryData.category,
        sortOrder: categoryData.sortOrder,
        isActive: true,
      },
    });

    for (const item of categoryData.items) {
      const existingItem = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });

      if (existingItem) {
        await prisma.menuItem.update({
          where: { id: existingItem.id },
          data: {
            description: item.description,
            price: item.price,
            isAvailable: true,
          },
        });
      } else {
        await prisma.menuItem.create({
          data: {
            name: item.name,
            description: item.description,
            price: item.price,
            isAvailable: true,
            categoryId: category.id,
          },
        });
      }
    }
  }
  console.log(`✅ Seeded menu categories and items`);

  console.log("🎉 Restaurant database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

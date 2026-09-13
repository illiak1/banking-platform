// backend/prisma/seed.ts
//
// Populates a dev database with users, accounts and a small transaction
// history, so a fresh checkout has something to look at without registering
// accounts by hand. Run with `npx prisma db seed` (wired up via the `prisma.seed`
// field in package.json).
//
// Safe to re-run: users are upserted by email, and transaction seeding is
// skipped entirely if the table is already non-empty, so running this twice
// never duplicates transfers or double-adjusts balances.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Same cost factor auth.service.ts hashes with, so seeded users behave like
// anyone who registered through the real endpoint.
const BCRYPT_ROUNDS = 10;

// One shared password for every seed user, chosen to satisfy RegisterDto's
// policy (upper + lower case, a number, a symbol, 8+ chars) even though the
// seed script writes straight to the database and never runs through that
// validation itself — the point is that these accounts are also usable
// through the normal login form.
const SEED_PASSWORD = 'Demo1234!';

const SEED_USERS = [
  { email: 'alice@example.com', openingBalance: 1000 },
  { email: 'bob@example.com', openingBalance: 1000 },
  { email: 'carol@example.com', openingBalance: 1000 },
  { email: 'dave@example.com', openingBalance: 1000 },
  { email: 'erin@example.com', openingBalance: 1000 },
] as const;

// Sample transfers layered on top of the opening balances, oldest first.
// Indexes refer to positions in SEED_USERS.
const SEED_TRANSFERS = [
  { from: 0, to: 1, amount: 150, daysAgo: 6 }, // alice -> bob
  { from: 1, to: 2, amount: 40, daysAgo: 5 }, // bob -> carol
  { from: 2, to: 3, amount: 200, daysAgo: 3 }, // carol -> dave
  { from: 3, to: 4, amount: 75.5, daysAgo: 2 }, // dave -> erin
  { from: 4, to: 0, amount: 60, daysAgo: 1 }, // erin -> alice
  { from: 0, to: 2, amount: 25.25, daysAgo: 0 }, // alice -> carol
] as const;

async function main() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  const accountIdByIndex: number[] = [];

  for (const seedUser of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        password: hashedPassword,
        accounts: { create: { balance: seedUser.openingBalance } },
      },
      include: { accounts: true },
    });

    // A user upserted from a previous run already has an account; a
    // freshly-created one has exactly the one we just nested above. Either
    // way `accounts[0]` is the account this script treats as "theirs" — the
    // same one-account-per-user assumption the rest of the app makes.
    const account =
      user.accounts[0] ??
      (await prisma.account.create({
        data: { userId: user.id, balance: seedUser.openingBalance },
      }));

    accountIdByIndex.push(account.id);
  }

  console.log(`Seeded ${SEED_USERS.length} users (password for all: ${SEED_PASSWORD})`);

  const existingTransactionCount = await prisma.transaction.count();
  if (existingTransactionCount > 0) {
    console.log(
      `Found ${existingTransactionCount} existing transaction(s) — skipping transfer seeding so balances are not double-adjusted.`,
    );
    return;
  }

  for (const transfer of SEED_TRANSFERS) {
    const fromAccountId = accountIdByIndex[transfer.from];
    const toAccountId = accountIdByIndex[transfer.to];
    const createdAt = new Date(Date.now() - transfer.daysAgo * 24 * 60 * 60 * 1000);

    // Mirrors what TransactionsService.transfer does at runtime (decrement,
    // increment, record — all three or none), just without going through
    // HTTP/JWT since this script runs outside the Nest application.
    await prisma.$transaction([
      prisma.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: transfer.amount } },
      }),
      prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: transfer.amount } },
      }),
      prisma.transaction.create({
        data: {
          amount: transfer.amount,
          fromId: fromAccountId,
          toId: toAccountId,
          createdAt,
        },
      }),
    ]);
  }

  console.log(`Seeded ${SEED_TRANSFERS.length} transactions.`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

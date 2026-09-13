-- Database-level backstop against overdraft.
--
-- The application guards the debit with `UPDATE ... WHERE balance >= amount`,
-- which closes the read-then-write race in TransactionsService.transfer(). This
-- constraint makes the invariant structural: even a future code path that skips
-- that guard, or a manual UPDATE run against the database by hand, cannot leave
-- an account holding less than zero. PostgreSQL evaluates it on every write, and
-- a violation aborts the surrounding transaction.
--
-- Prisma's schema language cannot express CHECK constraints, so this lives only
-- in the migration. `prisma db pull` will not round-trip it back into
-- schema.prisma — see the note on the Account model there.

ALTER TABLE "Account"
  ADD CONSTRAINT "check_nonnegative_balance" CHECK ("balance" >= 0);

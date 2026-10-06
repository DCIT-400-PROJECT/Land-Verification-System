"""
lands/management/commands/rehash_chain.py

One-off repair tool: recomputes block_hash / prev_hash for every ownership
record, using whatever data is CURRENTLY in the database (e.g. after you've
corrected a Ghana Card number format directly in Neon). This brings the
stored hashes back in line with the corrected data so BlockchainService
.verify_chain() stops reporting tamper detection for edits that were actually
legitimate corrections.

Usage:
  python manage.py rehash_chain                      # dry run, all lands
  python manage.py rehash_chain --title GHA/ACC/001   # dry run, one land
  python manage.py rehash_chain --apply               # actually write changes
  python manage.py rehash_chain --title GHA/ACC/001 --apply
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from lands.models import LandRecord
from blockchain.service import BlockchainService


class Command(BaseCommand):
    help = "Recompute and repair the ownership blockchain hash chain from current DB data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--title", type=str, default=None,
            help="Only rehash the chain for this title_number (default: all land records).",
        )
        parser.add_argument(
            "--apply", action="store_true",
            help="Actually write the recomputed hashes. Without this flag, it's a dry run.",
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]
        title_filter = options["title"]

        qs = LandRecord.objects.all()
        if title_filter:
            qs = qs.filter(title_number=title_filter.upper())
            if not qs.exists():
                self.stderr.write(self.style.ERROR(f"No land record found with title_number={title_filter}"))
                return

        total_lands = 0
        total_blocks_changed = 0

        for land in qs:
            records = list(land.ownership_records.order_by("block_index"))
            if not records:
                continue

            total_lands += 1
            self.stdout.write(f"\n--- {land.title_number} ({len(records)} block(s)) ---")

            new_hashes = []  # recomputed hash for each block, in order
            land_changed = False

            for i, record in enumerate(records):
                prev_hash = new_hashes[i - 1] if i > 0 else None
                previous_owner = records[i - 1].owner_name if i > 0 else None

                data = BlockchainService.build_block_data(
                    title_number=land.title_number,
                    previous_owner=previous_owner,
                    new_owner=record.owner_name,
                    new_owner_national_id=record.owner_national_id,
                    acquired_at=str(record.acquired_at),
                    prev_hash=prev_hash,
                    block_index=record.block_index,
                )
                new_hash = BlockchainService.compute_hash(data)
                new_hashes.append(new_hash)

                old_hash = record.block_hash
                old_prev = record.prev_hash
                new_prev_stored = prev_hash  # None for genesis, matches original convention

                hash_diff = old_hash != new_hash
                prev_diff = (old_prev or None) != (new_prev_stored or None)

                if hash_diff or prev_diff:
                    land_changed = True
                    total_blocks_changed += 1
                    self.stdout.write(self.style.WARNING(
                        f"  Block #{record.block_index} ({record.owner_name}, {record.owner_national_id}): "
                        f"hash {'CHANGED' if hash_diff else 'same'}, prev_hash {'CHANGED' if prev_diff else 'same'}"
                    ))
                    self.stdout.write(f"    old_hash:  {old_hash}")
                    self.stdout.write(f"    new_hash:  {new_hash}")
                    if prev_diff:
                        self.stdout.write(f"    old_prev:  {old_prev}")
                        self.stdout.write(f"    new_prev:  {new_prev_stored}")

                    if apply_changes:
                        record.block_hash = new_hash
                        record.prev_hash = new_prev_stored
                        record.save(update_fields=["block_hash", "prev_hash"])
                else:
                    self.stdout.write(f"  Block #{record.block_index}: unchanged, already consistent.")

            if not land_changed:
                self.stdout.write(self.style.SUCCESS("  No changes needed — chain already consistent."))

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(f"Lands scanned: {total_lands}")
        self.stdout.write(f"Blocks changed: {total_blocks_changed}")
        if not apply_changes:
            self.stdout.write(self.style.WARNING(
                "DRY RUN ONLY — no changes were written. Re-run with --apply to commit them."
            ))
        else:
            self.stdout.write(self.style.SUCCESS("Changes written to the database."))
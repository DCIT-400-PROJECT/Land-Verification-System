"""
management command: python manage.py seed_demo
Seeds the database with a demo admin, citizen, and sample land records
with a 2-block ownership chain for development/testing.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User, UserRole
from lands.models import LandRecord, OwnershipRecord, LandStatus
from blockchain.service import BlockchainService


DEMO_LANDS = [
    {
        "title_number": "GHA/ACC/CANT/001",
        "location": "Plot 5, Cantonments, Accra",
        "region": "Greater Accra",
        "district": "Accra",
        "area_sqm": 650,
        "status": LandStatus.VERIFIED,
        "registered_at": "2015-03-20",
        "owner_name": "Kwame Boateng",
        "owner_national_id": "GHA-KC-001",
    },
    {
        "title_number": "GHA/ASH/KUM/002",
        "location": "House 12, Adum, Kumasi",
        "region": "Ashanti",
        "district": "Kumasi",
        "area_sqm": 400,
        "status": LandStatus.TRANSFERRED,
        "registered_at": "2010-07-11",
        "owner_name": "Ama Owusu",
        "owner_national_id": "GHA-AO-002",
        "prev_owner": {"name": "Kofi Mensah", "national_id": "GHA-KM-003", "acquired_at": "2010-07-11"},
    },
    {
        "title_number": "GHA/WR/TAKOR/003",
        "location": "Block C, New Estate, Takoradi",
        "region": "Western",
        "district": "Takoradi",
        "area_sqm": 800,
        "status": LandStatus.DISPUTED,
        "registered_at": "2018-11-05",
        "owner_name": "Abena Darko",
        "owner_national_id": "GHA-AD-004",
    },
]


class Command(BaseCommand):
    help = "Seed the database with demo data for development and testing."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding OLVS demo data..."))

        # Admin user
        admin, created = User.objects.get_or_create(
            email="admin@olvs.gh",
            defaults={"national_id": "ADM-0001", "full_name": "System Administrator",
                      "role": UserRole.ADMIN, "is_staff": True, "is_superuser": True},
        )
        if created:
            admin.set_password("Admin1234!")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  ✓ Admin created: admin@olvs.gh / Admin1234!"))
        else:
            self.stdout.write("  · Admin already exists.")

        # Citizen user
        citizen, created = User.objects.get_or_create(
            email="citizen@olvs.gh",
            defaults={"national_id": "GHA-C-0001", "full_name": "Demo Citizen",
                      "role": UserRole.CITIZEN},
        )
        if created:
            citizen.set_password("Citizen1234!")
            citizen.save()
            self.stdout.write(self.style.SUCCESS("  ✓ Citizen created: citizen@olvs.gh / Citizen1234!"))
        else:
            self.stdout.write("  · Citizen already exists.")

        # Land records
        for entry in DEMO_LANDS:
            if LandRecord.objects.filter(title_number=entry["title_number"]).exists():
                self.stdout.write(f"  · Land {entry['title_number']} already exists.")
                continue

            land = LandRecord.objects.create(
                title_number=entry["title_number"],
                location=entry["location"],
                region=entry["region"],
                district=entry["district"],
                area_sqm=entry["area_sqm"],
                status=entry["status"],
                registered_at=entry["registered_at"],
                created_by=admin,
            )

            # Optional: previous owner block
            prev_owner = entry.get("prev_owner")
            if prev_owner:
                genesis_data = BlockchainService.build_block_data(
                    title_number=land.title_number,
                    previous_owner=None,
                    new_owner=prev_owner["name"],
                    new_owner_national_id=prev_owner["national_id"],
                    acquired_at=str(prev_owner.get("acquired_at", entry["registered_at"])),
                    prev_hash=None,
                    block_index=0,
                )
                h0 = BlockchainService.compute_hash(genesis_data)
                OwnershipRecord.objects.create(
                    land=land,
                    owner_name=prev_owner["name"],
                    owner_national_id=prev_owner["national_id"],
                    acquired_at=prev_owner.get("acquired_at", entry["registered_at"]),
                    is_current=False,
                    transferred_at="2022-01-01",
                    block_hash=h0,
                    prev_hash=None,
                    block_index=0,
                    recorded_by=admin,
                )
                # Current owner block
                block1_data = BlockchainService.build_block_data(
                    title_number=land.title_number,
                    previous_owner=prev_owner["name"],
                    new_owner=entry["owner_name"],
                    new_owner_national_id=entry["owner_national_id"],
                    acquired_at="2022-01-01",
                    prev_hash=h0,
                    block_index=1,
                )
                h1 = BlockchainService.compute_hash(block1_data)
                OwnershipRecord.objects.create(
                    land=land,
                    owner_name=entry["owner_name"],
                    owner_national_id=entry["owner_national_id"],
                    acquired_at="2022-01-01",
                    is_current=True,
                    block_hash=h1,
                    prev_hash=h0,
                    block_index=1,
                    recorded_by=admin,
                )
            else:
                # Genesis only
                genesis_data = BlockchainService.build_block_data(
                    title_number=land.title_number,
                    previous_owner=None,
                    new_owner=entry["owner_name"],
                    new_owner_national_id=entry["owner_national_id"],
                    acquired_at=entry["registered_at"],
                    prev_hash=None,
                    block_index=0,
                )
                h0 = BlockchainService.compute_hash(genesis_data)
                OwnershipRecord.objects.create(
                    land=land,
                    owner_name=entry["owner_name"],
                    owner_national_id=entry["owner_national_id"],
                    acquired_at=entry["registered_at"],
                    is_current=True,
                    block_hash=h0,
                    prev_hash=None,
                    block_index=0,
                    recorded_by=admin,
                )

            self.stdout.write(self.style.SUCCESS(f"  ✓ Land record seeded: {land.title_number}"))

        self.stdout.write(self.style.SUCCESS("\n✅ Demo data seeding complete."))
        self.stdout.write("  API Docs: http://localhost:8000/api/docs/")
        self.stdout.write("  Admin:    http://localhost:8000/admin/")

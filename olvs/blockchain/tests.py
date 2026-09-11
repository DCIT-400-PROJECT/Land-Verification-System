"""
blockchain/tests.py
Tests for SHA-256 hashing, chain integrity, and tamper detection.
"""
from django.test import TestCase
from unittest.mock import MagicMock
from .service import BlockchainService


class BlockchainHashTests(TestCase):
    def _make_block_data(self, index=0, owner="Kwame Asante", prev_hash=None):
        return {
            "title_number": "GHA/ACC/001/2024",
            "previous_owner": None if index == 0 else "Previous Owner",
            "new_owner": owner,
            "new_owner_national_id": "GHA-001",
            "acquired_at": "2024-01-15",
            "prev_hash": prev_hash if prev_hash else "0" * 64,
            "block_index": index,
        }

    def test_hash_is_64_hex_chars(self):
        data = self._make_block_data()
        h = BlockchainService.compute_hash(data)
        self.assertEqual(len(h), 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in h))

    def test_hash_is_deterministic(self):
        data = self._make_block_data()
        h1 = BlockchainService.compute_hash(data)
        h2 = BlockchainService.compute_hash(data)
        self.assertEqual(h1, h2)

    def test_hash_changes_on_data_change(self):
        data = self._make_block_data()
        h1 = BlockchainService.compute_hash(data)
        data["new_owner"] = "Tampered Name"
        h2 = BlockchainService.compute_hash(data)
        self.assertNotEqual(h1, h2)

    def test_empty_chain_is_valid(self):
        result = BlockchainService.verify_chain([])
        self.assertTrue(result["valid"])

    def _make_mock_record(self, land_title, block_index, owner_name, owner_national_id,
                           acquired_at, block_hash, prev_hash):
        r = MagicMock()
        r.land.title_number = land_title
        r.block_index = block_index
        r.owner_name = owner_name
        r.owner_national_id = owner_national_id
        r.acquired_at = acquired_at
        r.block_hash = block_hash
        r.prev_hash = prev_hash
        return r

    def test_single_genesis_block_valid(self):
        data = self._make_block_data(index=0)
        h = BlockchainService.compute_hash(data)
        record = self._make_mock_record("GHA/ACC/001/2024", 0, "Kwame Asante",
                                        "GHA-001", "2024-01-15", h, None)
        result = BlockchainService.verify_chain([record])
        self.assertTrue(result["valid"])

    def test_tampered_block_detected(self):
        data = self._make_block_data(index=0)
        h = BlockchainService.compute_hash(data)
        # Corrupt the hash
        bad_hash = "a" * 64
        record = self._make_mock_record("GHA/ACC/001/2024", 0, "Kwame Asante",
                                        "GHA-001", "2024-01-15", bad_hash, None)
        result = BlockchainService.verify_chain([record])
        self.assertFalse(result["valid"])
        self.assertIn("Tamper detected", result["message"])

    def test_two_valid_blocks(self):
        # Genesis
        d0 = self._make_block_data(index=0)
        h0 = BlockchainService.compute_hash(d0)
        r0 = self._make_mock_record("GHA/ACC/001/2024", 0, "Kwame Asante", "GHA-001", "2024-01-15", h0, None)

        # Block 1
        d1 = {
            "title_number": "GHA/ACC/001/2024",
            "previous_owner": "Kwame Asante",
            "new_owner": "Ama Owusu",
            "new_owner_national_id": "GHA-002",
            "acquired_at": "2024-06-01",
            "prev_hash": h0,
            "block_index": 1,
        }
        h1 = BlockchainService.compute_hash(d1)
        r1 = self._make_mock_record("GHA/ACC/001/2024", 1, "Ama Owusu", "GHA-002", "2024-06-01", h1, h0)

        result = BlockchainService.verify_chain([r0, r1])
        self.assertTrue(result["valid"])
        self.assertEqual(result["message"], "Chain of 2 block(s) is intact and untampered.")

    def test_broken_chain_link_detected(self):
        d0 = self._make_block_data(index=0)
        h0 = BlockchainService.compute_hash(d0)
        r0 = self._make_mock_record("GHA/ACC/001/2024", 0, "Kwame Asante", "GHA-001", "2024-01-15", h0, None)

        d1 = {
            "title_number": "GHA/ACC/001/2024",
            "previous_owner": "Kwame Asante",
            "new_owner": "Ama Owusu",
            "new_owner_national_id": "GHA-002",
            "acquired_at": "2024-06-01",
            "prev_hash": h0,
            "block_index": 1,
        }
        h1 = BlockchainService.compute_hash(d1)
        # Set wrong prev_hash to simulate chain break
        r1 = self._make_mock_record("GHA/ACC/001/2024", 1, "Ama Owusu", "GHA-002", "2024-06-01", h1, "b" * 64)

        result = BlockchainService.verify_chain([r0, r1])
        self.assertFalse(result["valid"])
        self.assertIn("Chain broken", result["message"])

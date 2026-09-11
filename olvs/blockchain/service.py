"""
blockchain/service.py
SHA-256 blockchain simulation engine.
- Computes block hashes
- Links blocks via prev_hash
- Detects tampering by re-computing hashes and checking chain linkage
"""
import hashlib
import json
from typing import Optional


class BlockchainService:

    @staticmethod
    def compute_hash(block_data: dict) -> str:
        """
        Compute a deterministic SHA-256 hash for a block.
        All keys are sorted for consistency; None values become the string "null".
        """
        canonical = json.dumps(block_data, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @staticmethod
    def build_block_data(
        title_number: str,
        previous_owner: Optional[str],
        new_owner: str,
        new_owner_national_id: str,
        acquired_at: str,
        prev_hash: Optional[str],
        block_index: int,
    ) -> dict:
        """Construct the canonical dict used to compute a block's hash."""
        return {
            "title_number": title_number,
            "previous_owner": previous_owner,
            "new_owner": new_owner,
            "new_owner_national_id": new_owner_national_id,
            "acquired_at": acquired_at,
            "prev_hash": prev_hash if prev_hash else "0" * 64,
            "block_index": block_index,
        }

    @staticmethod
    def verify_chain(ownership_records) -> dict:
        """
        Verify the integrity of an ownership chain.

        For each block:
          1. Re-compute its hash from stored fields.
          2. Compare with stored block_hash – detects field tampering.
          3. Check prev_hash matches previous block's hash – detects insertion/deletion.

        Returns:
          { "valid": bool, "message": str, "tampered_index": int|None }
        """
        records = list(ownership_records)
        if not records:
            return {"valid": True, "message": "Empty chain – no records to verify.", "tampered_index": None}

        for i, record in enumerate(records):
            # Re-compute expected hash
            expected_data = BlockchainService.build_block_data(
                title_number=record.land.title_number,
                previous_owner=records[i - 1].owner_name if i > 0 else None,
                new_owner=record.owner_name,
                new_owner_national_id=record.owner_national_id,
                acquired_at=str(record.acquired_at),
                prev_hash=records[i - 1].block_hash if i > 0 else None,
                block_index=record.block_index,
            )
            expected_hash = BlockchainService.compute_hash(expected_data)

            # 1. Hash mismatch → data tampered
            if expected_hash != record.block_hash:
                return {
                    "valid": False,
                    "message": f"Tamper detected at block #{record.block_index}: hash mismatch.",
                    "tampered_index": record.block_index,
                }

            # 2. prev_hash linkage check (skip genesis)
            if i > 0:
                expected_prev = records[i - 1].block_hash
                stored_prev = record.prev_hash
                if stored_prev != expected_prev:
                    return {
                        "valid": False,
                        "message": f"Chain broken at block #{record.block_index}: prev_hash mismatch.",
                        "tampered_index": record.block_index,
                    }

        return {
            "valid": True,
            "message": f"Chain of {len(records)} block(s) is intact and untampered.",
            "tampered_index": None,
        }

    @staticmethod
    def get_chain_summary(ownership_records) -> list:
        """Return a list of block summaries with verification status for each block."""
        records = list(ownership_records)
        summary = []
        for i, record in enumerate(records):
            expected_data = BlockchainService.build_block_data(
                title_number=record.land.title_number,
                previous_owner=records[i - 1].owner_name if i > 0 else None,
                new_owner=record.owner_name,
                new_owner_national_id=record.owner_national_id,
                acquired_at=str(record.acquired_at),
                prev_hash=records[i - 1].block_hash if i > 0 else None,
                block_index=record.block_index,
            )
            expected_hash = BlockchainService.compute_hash(expected_data)
            block_valid = (expected_hash == record.block_hash)
            link_valid = (i == 0) or (record.prev_hash == records[i - 1].block_hash)

            summary.append({
                "block_index": record.block_index,
                "owner_name": record.owner_name,
                "owner_national_id": record.owner_national_id,
                "acquired_at": str(record.acquired_at),
                "block_hash": record.block_hash,
                "prev_hash": record.prev_hash,
                "hash_valid": block_valid,
                "link_valid": link_valid,
                "tampered": not (block_valid and link_valid),
            })
        return summary

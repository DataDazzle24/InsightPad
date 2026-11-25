"""Prove the recovery path without Cloud Shell, ADC, or access to DEV."""
import importlib.util
from pathlib import Path
import sys
import stat
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'ec'))
from runtime_support import Runtime, IDS  # noqa: E402

spec = importlib.util.spec_from_file_location('recovery', Path(__file__).with_name('rehearse-recovery.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class RehearsalTest(unittest.TestCase):
    def test_snapshot_private_dump_restore_and_verify(self):
        with Runtime() as runtime:
            runtime.reset()
            runtime.sql(
                "INSERT INTO cash_movements(id,tenant_id,session_id,movement_type,amount_cents,description,created_by_uid,created_at) "
                "SELECT gen_random_uuid(),'{tenant}','{cash}','OPENING',50,'synthetic receipt','actor',now() FROM generate_series(1,5);"
                .format(**IDS)
            )
            runtime.sql('CREATE ROLE firebaseowner_fdcdb_public NOLOGIN; '
                        'GRANT USAGE ON SCHEMA public TO firebaseowner_fdcdb_public; '
                        'GRANT SELECT ON ALL TABLES IN SCHEMA public TO firebaseowner_fdcdb_public; '
                        'GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO firebaseowner_fdcdb_public;')
            runtime.sql('CREATE DATABASE fin_rehearsal;')
            with tempfile.TemporaryDirectory(prefix='fin-rehearsal-test-') as name:
                archive = Path(name) / 'test.pgdump'
                result = mod.rehearse(runtime.name, ['/var/run/postgresql', 'postgres', 'fdcdb'], mod.OWNER_ROLE,
                                     archive)
                self.assertEqual(result['cashMovements'], 5)
                self.assertEqual(result['verifiedTables'], 70)
                self.assertGreater(archive.stat().st_size, 1000)
                self.assertEqual(stat.S_IMODE(archive.stat().st_mode), 0o600)


if __name__ == '__main__':
    unittest.main(verbosity=2)

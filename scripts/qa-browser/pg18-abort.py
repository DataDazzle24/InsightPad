"""Disposable local PG18 only. Writes/locks are synthetic, never a remote DB."""
import json, os, subprocess, time
from pathlib import Path
IMAGE = 'postgres@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6'
name = 'insightpad-qa-abort-' + str(os.getpid())
output = Path('artifacts/browser-private/pg18-abort.json')
record = {'sha': subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(), 'dirty': bool(subprocess.check_output(['git','status','--porcelain'],text=True).strip()), 'image': IMAGE, 'scope': 'local disposable, network none, tmpfs, no host data mounts/ports; experimental budgets', 'cases': []}
created = False

def sql(text, timeout=10):
    return subprocess.run(['docker','exec','-i',name,'psql','-X','-At','-U','postgres','-v','ON_ERROR_STOP=1'],input=text,text=True,capture_output=True,timeout=timeout)

def check(text):
    p = sql(text)
    assert p.returncode == 0, p.stderr
    return p.stdout.strip()

try:
    subprocess.run(['docker','run','--detach','--rm','--name',name,'--network','none','--memory','512m','--cpus','1','--tmpfs','/var/lib/postgresql:rw','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE],check=True,capture_output=True,text=True,timeout=120)
    created = True
    for _ in range(80):
        if subprocess.run(['docker','exec',name,'pg_isready','-U','postgres'],capture_output=True).returncode == 0:
            break
        time.sleep(.1)
    else:
        raise RuntimeError('PG18 startup failed')
    record['version'] = check('SHOW server_version;')
    assert check('SHOW server_version_num;').startswith('180')
    check('CREATE TABLE qa_abort(id int PRIMARY KEY, amount int NOT NULL); INSERT INTO qa_abort VALUES(1,10);')
    # Observe the held row lock from a distinct connection before the abort.
    for label, settings, pause, expected in [
        ('total', "SET transaction_timeout='1500ms'; SET statement_timeout='5s'; SET idle_in_transaction_session_timeout='0';", 'SELECT pg_sleep(4);', 'transaction timeout'),
        ('idle', "SET transaction_timeout='4s'; SET statement_timeout='3s'; SET idle_in_transaction_session_timeout='600ms';", '\\! sleep 2\nSELECT 1;', 'idle-in-transaction timeout')]:
        writer = subprocess.Popen(['docker','exec','-i',name,'psql','-X','-At','-U','postgres','-v','ON_ERROR_STOP=1'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        script = "SET application_name='qa-abort-writer';" + settings + '\nBEGIN; UPDATE qa_abort SET amount=99 WHERE id=1; INSERT INTO qa_abort VALUES(2,99);\n' + pause + '\nCOMMIT;\n'
        writer.stdin.write(script)
        writer.stdin.close()
        writer.stdin = None
        try:
            for _ in range(30):
                held = check("SELECT count(*) FROM pg_stat_activity WHERE application_name='qa-abort-writer' AND xact_start IS NOT NULL AND (wait_event='PgSleep' OR state='idle in transaction');")
                if held == '1': break
                time.sleep(.02)
            else: raise AssertionError('writer lock was not observed')
            blocked = sql("SET lock_timeout='100ms'; BEGIN; SELECT * FROM qa_abort WHERE id=1 FOR UPDATE; ROLLBACK;")
            assert blocked.returncode != 0 and 'lock timeout' in blocked.stderr, blocked.stderr
            stdout, stderr = writer.communicate(timeout=8)
            assert writer.returncode != 0 and expected in stderr, (writer.returncode, stderr)
            # A fresh connection must see no insert/update and acquire the same lock NOWAIT.
            observed = check('BEGIN; SELECT amount FROM qa_abort WHERE id=1 FOR UPDATE NOWAIT; SELECT count(*) FROM qa_abort; ROLLBACK;').splitlines()
            assert observed == ['BEGIN','10','1','ROLLBACK'], observed
            record['cases'].append({'case':label,'sql':script,'writerExit':writer.returncode,'expectedFailure':stderr,'heldLockProvenByOtherConnection':True,'waiterFailure':blocked.stderr,'freshConnection':observed,'passed':True})
        finally:
            if writer.poll() is None:
                writer.kill(); writer.wait()
finally:
    if created:
        record['removed'] = subprocess.run(['docker','rm','-f',name],capture_output=True).returncode == 0
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(record,indent=2))
print('Disposable PG18: write abort, zero persisted effect and lock release verified; private record retained.')

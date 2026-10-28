"""Disposable local PG18 only. Writes/locks are synthetic, never a remote DB."""
import json, os, subprocess, time
from pathlib import Path
IMAGE = 'postgres@sha256:edb0c08dc33befd0262ab3b5cf1c4f3f8cfd8b09e88c05b45adee29d6761ddb6'
name = 'insightpad-qa-abort-' + str(os.getpid())
output = Path('artifacts/browser-private/pg18-abort.json')
record = {'sha': subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(), 'dirty': bool(subprocess.check_output(['git','status','--porcelain'],text=True).strip()), 'image': IMAGE, 'scope': 'local disposable, network none, tmpfs, no host data mounts/ports; experimental budgets', 'cases': []}
created = False

def sql(text, timeout=10):
    return subprocess.run(['docker','exec','-i',name,'psql','-X','-At','-h','127.0.0.1','-U','postgres','-v','ON_ERROR_STOP=1'],input=text,text=True,capture_output=True,timeout=timeout)

def check(text):
    p = sql(text)
    assert p.returncode == 0, p.stderr
    return p.stdout.strip()

try:
    subprocess.run(['docker','run','--detach','--rm','--name',name,'--network','none','--memory','512m','--cpus','1','--tmpfs','/var/lib/postgresql:rw','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE],check=True,capture_output=True,text=True,timeout=120)
    created = True
    # The image's temporary initialization server accepts Unix-socket clients
    # before stopping again. PID1 must be the final postgres, and a real TCP
    # query on container loopback must succeed. Keep the existing 8s budget.
    started = time.monotonic()
    deadline = started + 8
    startup = record['startup'] = {'budgetSeconds': 8, 'attempts': []}
    while time.monotonic() < deadline:
        attempt = {'elapsedSeconds': time.monotonic() - started}
        startup['attempts'].append(attempt)
        try:
            pid1 = subprocess.run(['docker','exec',name,'cat','/proc/1/comm'],capture_output=True,text=True,timeout=min(1,deadline-time.monotonic()))
            attempt['pid1'] = pid1.stdout.strip()
            if pid1.returncode == 0 and attempt['pid1'] == 'postgres':
                probe = sql('SHOW server_version; SHOW server_version_num; SELECT host(inet_server_addr());', timeout=max(.01,min(1,deadline-time.monotonic())))
                attempt.update({'queryExit':probe.returncode,'queryOutput':probe.stdout,'queryError':probe.stderr})
                lines = probe.stdout.strip().splitlines()
                if probe.returncode == 0 and len(lines) == 3 and lines[1].startswith('180') and lines[2] == '127.0.0.1':
                    record['version'] = lines[0]
                    startup['definitiveQueryConfirmed'] = True
                    break
        except subprocess.TimeoutExpired:
            attempt['queryTimedOut'] = True
        time.sleep(max(0,min(.1,deadline-time.monotonic())))
    else:
        raise RuntimeError('PG18 definitive server readiness failed within 8s; inspect private diagnostic')
    check('CREATE TABLE qa_abort(id int PRIMARY KEY, amount int NOT NULL); INSERT INTO qa_abort VALUES(1,10);')
    # Observe the held row lock from a distinct connection before the abort.
    for label, settings, pause, expected in [
        ('total', "SET transaction_timeout='1500ms'; SET statement_timeout='5s'; SET idle_in_transaction_session_timeout='0';", 'SELECT pg_sleep(4);', 'transaction timeout'),
        ('idle', "SET transaction_timeout='4s'; SET statement_timeout='3s'; SET idle_in_transaction_session_timeout='600ms';", '\\! sleep 2\nSELECT 1;', 'idle-in-transaction timeout')]:
        writer = subprocess.Popen(['docker','exec','-i',name,'psql','-X','-At','-h','127.0.0.1','-U','postgres','-v','ON_ERROR_STOP=1'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
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
except Exception as error:
    record['failure'] = {'type':type(error).__name__,'message':str(error)}
    raise
finally:
    if created:
        if 'failure' in record:
            try:
                diagnostic = subprocess.run(['docker','logs',name],capture_output=True,text=True,timeout=5)
                record['containerDiagnostic'] = {'stdout':diagnostic.stdout[-16000:],'stderr':diagnostic.stderr[-16000:]}
            except subprocess.TimeoutExpired:
                record['containerDiagnostic'] = {'error':'diagnostic command timed out'}
        record['removed'] = subprocess.run(['docker','rm','-f',name],capture_output=True).returncode == 0
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(record,indent=2))
print('Disposable PG18: write abort, zero persisted effect and lock release verified; private record retained.')

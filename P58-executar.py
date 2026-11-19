"""Bootstrap tooling and tests only; publication delegated to pinned P58 publisher."""
import hashlib,os,pathlib,shutil,subprocess,sys
os.umask(0o077);root=pathlib.Path(__file__).resolve().parent
def require(x,m):
 if not x:raise RuntimeError(m)
try:
 require(sys.argv[1:] in ([],['--backup-and-publish']),'Opção de execução não reconhecida')
 project=subprocess.check_output(['gcloud','config','get-value','project'],text=True,stderr=subprocess.DEVNULL).strip();require(project=='insightpad-dd-dev','Projeto ativo fora de DEV')
 candidates=[pathlib.Path.home()/'InsightPad_DEC035_OP_20261028T165248Z/tools-node22/node_modules/node/bin/node']
 if shutil.which('node'):candidates.insert(0,pathlib.Path(shutil.which('node')))
 node=next((p for p in candidates if p.is_file() and subprocess.check_output([str(p),'--version'],text=True).startswith('v22.')),None)
 require(node is not None,'Node22 existente não localizado; nenhuma instalação/alteração global executada')
 npm=shutil.which('npm');require(npm,'npm existente não localizado')
 require(shutil.disk_usage(root).free>=3*1024**3 and shutil.disk_usage(pathlib.Path.home()).free>=64*1024**2,'Espaço insuficiente para preparo/recibos; nenhum arquivo alheio removido')
 env=dict(os.environ,PATH=str(node.parent)+os.pathsep+os.environ.get('PATH',''),npm_config_cache=str(root/'npm-cache'),PYTHONDONTWRITEBYTECODE='1')
 print('Preparando ferramentas de publicação em /tmp, por lockfile; sem mutação Google.',flush=True)
 with (root/'bootstrap-private.log').open('w') as log:
  result=subprocess.run([str(node),str(pathlib.Path(npm).resolve()),'ci','--ignore-scripts','--no-audit','--no-fund'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=600)
 require(result.returncode==0,'Instalação de ferramentas falhou; log privado no diretório do bootstrap')
 for line in (root/'SHA256SUMS').read_text().splitlines():
  expected,name=line.split('  ',1);require(hashlib.sha256((root/name).read_bytes()).hexdigest()==expected,'Arquivo do publicador mudou após instalação: '+name)
 result=subprocess.run([sys.executable,str(root/'P58-publicador.test.py')],cwd=root,env=env,timeout=120);require(result.returncode==0,'Testes do publicador falharam; publicação bloqueada')
 if sys.argv[1:]==['--backup-and-publish']:
  result=subprocess.run([sys.executable,str(root/'P58-backup.test.py')],cwd=root,env=env,timeout=120);require(result.returncode==0,'Testes de backup falharam; criação bloqueada')
  sys.exit(subprocess.run([sys.executable,str(root/'P58-backup.py'),'--create-and-publish'],cwd=root,env=env).returncode)
 sys.exit(subprocess.run([sys.executable,str(root/'P58-publicar.py')],cwd=root,env=env).returncode)
except Exception as error:
 print('P58 interrompido antes do publicador: '+(str(error) if isinstance(error,RuntimeError) else type(error).__name__),file=sys.stderr);sys.exit(1)

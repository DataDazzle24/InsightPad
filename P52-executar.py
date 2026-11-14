"""Wait for the exact candidate CI, then invoke the guarded existing-DEV publisher."""
import contextlib, io, json, pathlib, runpy, subprocess, sys, time, urllib.request
SHA='68abdac1ca10e30e953c626ebefc58cd89216666'
RUN='43602300534'
def get_run():
 request=urllib.request.Request('https://api.github.com/repos/DataDazzle24/InsightPad/actions/runs/'+RUN,headers={'User-Agent':'InsightPad-DEV-CI-readonly','Accept':'application/vnd.github+json','Cache-Control':'no-cache'})
 with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
def check_access():
 print('Verificando agora identidade, base servida, acessos e contenções DEV (somente leitura).',flush=True)
 with contextlib.redirect_stdout(io.StringIO()):
  namespace=runpy.run_path(str(pathlib.Path(__file__).with_name('P52-preflight.py')),run_name='__main__')
 record=namespace['record']
 print('=== P52 PREFLIGHT INICIAL ===',flush=True)
 print(json.dumps(record,ensure_ascii=False,indent=2),flush=True)
 if not record.get('readyForFrontendPreparation'):raise RuntimeError(record.get('stopped','Preflight inicial não aprovado'))
 print('Acessos DEV conferidos; o publicador repetirá o preflight fresco após o CI.',flush=True)
def main():
 check_access()
 for attempt in range(30):
  state=get_run()
  if state.get('head_sha')!=SHA:raise RuntimeError('CI pertence a outro candidato; nenhuma publicação iniciada')
  if state.get('status')=='completed':
   if state.get('conclusion')!='success':raise RuntimeError('CI não aprovado: '+str(state.get('conclusion'))+'; nenhuma publicação iniciada')
   print('CI do candidato confirmado. Iniciando preflight autenticado e publicador DEV controlado.',flush=True)
   return subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('P52-publicar-estoque-registros.py'))]).returncode
  if state.get('status') not in {'queued','in_progress','waiting','requested','pending'}:raise RuntimeError('Estado CI desconhecido; nenhuma publicação iniciada')
  if attempt%1==0:print('CI '+RUN+' ainda '+state['status']+'. Aguardando; nenhuma mutação Google Cloud iniciada.',flush=True)
  time.sleep(60)
 raise RuntimeError('CI não terminou em 30 minutos; nenhuma publicação iniciada')
if __name__=='__main__':
 try:sys.exit(main())
 except Exception as error:print('P52 interrompido antes do publicador: '+str(error),file=sys.stderr);sys.exit(1)

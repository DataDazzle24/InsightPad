"""Wait for the exact candidate CI, then invoke the guarded existing-DEV publisher."""
import json, pathlib, subprocess, sys, time, urllib.request
SHA='c61872785b80bce39d320d6678e84d3296b54ca0'
RUN='43599640718'
def get_run():
 request=urllib.request.Request('https://api.github.com/repos/DataDazzle24/InsightPad/actions/runs/'+RUN,headers={'User-Agent':'InsightPad-DEV-CI-readonly','Accept':'application/vnd.github+json','Cache-Control':'no-cache'})
 with urllib.request.urlopen(request,timeout=30) as response:return json.load(response)
def main():
 for attempt in range(120):
  state=get_run()
  if state.get('head_sha')!=SHA:raise RuntimeError('CI pertence a outro candidato; nenhuma publicação iniciada')
  if state.get('status')=='completed':
   if state.get('conclusion')!='success':raise RuntimeError('CI não aprovado: '+str(state.get('conclusion'))+'; nenhuma publicação iniciada')
   print('CI do candidato confirmado. Iniciando preflight autenticado e publicador DEV controlado.',flush=True)
   return subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('P52-publicar-estoque-registros.py'))]).returncode
  if state.get('status') not in {'queued','in_progress','waiting','requested','pending'}:raise RuntimeError('Estado CI desconhecido; nenhuma publicação iniciada')
  if attempt%2==0:print('CI '+RUN+' ainda '+state['status']+'. Aguardando; nenhuma mutação Google Cloud iniciada.',flush=True)
  time.sleep(15)
 raise RuntimeError('CI não terminou em 30 minutos; nenhuma publicação iniciada')
if __name__=='__main__':
 try:sys.exit(main())
 except Exception as error:print('P52 interrompido antes do publicador: '+str(error),file=sys.stderr);sys.exit(1)

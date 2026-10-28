// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,afterEach,it,expect,vi } from 'vitest'
import { PosHeader } from '../components/PosHeader'
import { CashSessionModal } from '../components/CashSessionModal'
import type { DataConnect } from 'firebase/data-connect'
import { DataConnectError } from '@firebase/data-connect'
import { qaOperation, qaState, resetFixtures, inspectFixtures, uuid } from '../../qa/api'
const api=vi.hoisted(()=>({execute:vi.fn(),requestApproval:vi.fn(),approvalStatus:vi.fn(),sessionToken:'synthetic-session'}))
vi.mock('firebase/data-connect',()=>({executeMutation:api.execute,mutationRef:(_dc:unknown,name:string,variables:Record<string,unknown>)=>({name,variables:{...variables,sessionToken:api.sessionToken}})}))
vi.mock('@insightpad/dataconnect',()=>({updatePosPolicy:vi.fn(),requestPosCashApproval:api.requestApproval,posCashApprovalStatus:api.approvalStatus}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);api.execute.mockReset();api.requestApproval.mockReset();api.approvalStatus.mockReset();api.sessionToken='synthetic-session';resetFixtures();Object.assign(qaState,{fail:false,empty:false,delay:0,permissions:'full',allowedBranches:[],cashAckLoss:false});container=document.createElement('div');document.body.append(container);root=createRoot(container)})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();vi.unstubAllGlobals()})
const buttons=()=>[...container.querySelectorAll('button')]
const button=(text:string)=>{const result=buttons().find(el=>el.textContent?.includes(text));if(!result)throw Error(text);return result}
const click=async(text:string)=>{await act(async()=>button(text).click())}
it('AJU-PDV-01..03: groups back with clock, announces connection and routes cash through its control',async()=>{
 const cash=vi.fn(),sync=vi.fn(),confirm=vi.spyOn(window,'confirm').mockReturnValue(false)
 const props={clock:new Date('2026-10-20T10:00:00Z'),online:false,pending:2,blocked:1,syncing:false,cashReady:true,cashOpen:true,cashDisabled:false,canManage:false,hasCart:true,onCash:cash,onSync:sync,onQueue:vi.fn(),onApprovals:vi.fn()}
 await act(async()=>root.render(<MemoryRouter><PosHeader {...props}/></MemoryRouter>))
 expect(container.querySelector('.pos-clock-group a')).toBeTruthy()
 expect(container.querySelector('[role="status"]')?.textContent).toContain('Offline · 2 pendente(s)')
 expect(button('Fechar caixa').className).toContain('--close')
 await click('Fechar caixa');expect(cash).toHaveBeenCalledTimes(1);expect(api.execute).not.toHaveBeenCalled()
 const event=new MouseEvent('click',{bubbles:true,cancelable:true})
 await act(async()=>{container.querySelector('a')!.dispatchEvent(event)})
 expect(confirm).toHaveBeenCalledTimes(1);expect(event.defaultPrevented).toBe(true)
 await act(async()=>root.render(<MemoryRouter><PosHeader {...props} cashOpen={false} online cashDisabled/></MemoryRouter>))
 expect(button('Abrir caixa').disabled).toBe(true);expect(button('Abrir caixa').className).toContain('--open')
 await click('Sincronizar');expect(sync).toHaveBeenCalledTimes(1)
})
const session={id:'session',openedAt:'2026-10-20T10:00:00Z',openingAmountCents:'1000',expectedAmountCents:'1500',movementCount:2}
it('AJU-PDV-04: cancel closes without mutation; cash movements retain manager permissions',async()=>{
 const close=vi.fn(),props={dc:{} as DataConnect,branchId:'branch',branchName:'Teste',session,canManage:true,onClose:close,onChanged:vi.fn(),onNotice:vi.fn()}
 await act(async()=>root.render(<CashSessionModal {...props}/>))
 expect(button('Sangria').querySelector('[aria-hidden="true"]')?.textContent).toBe('remove_circle')
 expect(button('Suprimento').className).toBe('cash-action--supply')
 await click('Cancelar');expect(close).toHaveBeenCalledTimes(1);expect(api.execute).not.toHaveBeenCalled()
 await act(async()=>root.render(<CashSessionModal {...props} canManage={false} pendingCount={2}/>))
 expect(buttons().some(el=>el.textContent?.includes('Suprimento'))).toBe(false)
 expect(button('Fechar meu caixa').disabled).toBe(true)
 expect(container.querySelector('[role="status"]')?.textContent).toContain('2 venda(s)')
})

it('cash ACK loss keeps the same operation and payload, announces uncertainty and confirms retry once',async()=>{
 const notice=vi.fn(),changed=vi.fn(async()=>{}),close=vi.fn();api.execute.mockRejectedValueOnce(Object.assign(new TypeError('Failed to fetch'),{code:'unavailable'})).mockResolvedValueOnce({data:{_execute:1}})
 await act(async()=>root.render(<CashSessionModal dc={{} as DataConnect} branchId="branch" branchName="Teste" session={session} canManage onClose={close} onChanged={changed} onNotice={notice}/>));await click('Suprimento')
 for(const [selector,value]of [['input','500'],['textarea','MOTIVO QA']]){const el=container.querySelector(selector)!;await act(async()=>{const proto=selector==='input'?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}))})}
 const submit=async()=>act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});await submit();expect(notice.mock.calls[0][0]).toMatch(/confirmação.*incerta/i);expect(close).not.toHaveBeenCalled();expect(changed).not.toHaveBeenCalled();const first=structuredClone(api.execute.mock.calls[0][0]);await submit();expect(api.execute.mock.calls[1][0]).toEqual(first);expect(changed).toHaveBeenCalledOnce();expect(close).toHaveBeenCalledOnce()
})

const cashInput=async(selector:string,value:string)=>{
 const el=container.querySelector(selector)!;
 await act(async()=>{const proto=selector==='textarea'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}))})
}
const submitCash=async()=>act(async()=>{container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
for(const mode of ['SUPPLY','WITHDRAWAL'] as const)it('CASH-ACK-SDK-AD '+mode+': lost SDK ACK cannot create another financial instruction',async()=>{
 resetFixtures();Object.assign(qaState,{fail:false,empty:false,delay:0,permissions:'full',allowedBranches:[],cashAckLoss:true});
 api.execute.mockImplementation(async(ref:{name:string;variables:Record<string,unknown>})=>{
  try{return await qaOperation(ref.name,ref.variables)}catch(error){
   if(error instanceof TypeError)throw new DataConnectError('other','Failed to fetch: '+error.message);
   if(error instanceof Error&&error.name==='DataConnectError')throw new DataConnectError('other',error.message);
   throw error
  }
 });
 const closed=vi.fn(),changed=vi.fn(async()=>{}),notice=vi.fn();
 await act(async()=>root.render(<CashSessionModal dc={{} as DataConnect} branchId={uuid(1)} branchName="QA" session={inspectFixtures().sessions[0] as typeof session} canManage onClose={closed} onChanged={changed} onNotice={notice}/>));
 await click(mode==='SUPPLY'?'Suprimento':'Sangria');await cashInput('input','500');await cashInput('textarea','Movimento teste');await submitCash();
 await cashInput('textarea','retry');await submitCash();
 const requests=qaState.requests.filter(r=>r.name==='RegisterCashMovement');
 console.log('CASH-ACK-SDK-AD isolated '+JSON.stringify({mode,movements:inspectFixtures().cashMovements.length,balance:inspectFixtures().sessions[0]!.expectedAmountCents,samePayload:JSON.stringify(requests[0]?.variables)===JSON.stringify(requests[1]?.variables)}));
 expect(inspectFixtures().cashMovements).toHaveLength(1);expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe(mode==='SUPPLY'?'10500':'9500');
 expect(requests).toHaveLength(2);expect(requests[1]!.variables).toEqual(requests[0]!.variables);expect(changed).toHaveBeenCalledOnce();expect(closed).toHaveBeenCalledOnce();
 expect(notice.mock.calls.some(c=>/confirmação.*incerta/i.test(c[0]))).toBe(true);
})

const sdkExecute=async(ref:{name:string;variables:Record<string,unknown>})=>{
 try{return await qaOperation(ref.name,ref.variables)}catch(error){
  if(error instanceof Error&&error.name==='DataConnectError')throw new DataConnectError('other',error.message);
  throw error
 }
}
const definitiveRefusal=(message='POS_REJECTED: confira os dados',path='_execute')=>Object.assign(new DataConnectError('partial-error',message),{name:'DataConnectOperationError',response:{data:null,errors:[{message,path:[path]}]}})
const cashProps=()=>({dc:{} as DataConnect,branchId:uuid(1),branchName:'QA',session:inspectFixtures().sessions[0] as typeof session,canManage:true,onClose:vi.fn(),onChanged:vi.fn(async()=>{}),onNotice:vi.fn()})
const reactProps=(el:Element)=> (el as unknown as Record<string,Record<string,(event?:unknown)=>void>>)[Object.keys(el).find(k=>k.startsWith('__reactProps$'))!]!
async function mountCash(mode='Suprimento',props=cashProps()){
 api.execute.mockImplementation(sdkExecute);
 await act(async()=>root.render(<CashSessionModal {...props}/>));
 const originalModeAction=reactProps(button(mode)).onClick!;
 await click(mode);if(mode!=='Fechar caixa')await cashInput('input','500');await cashInput('textarea','Movimento teste');
 return{props,originalModeAction};
}

it('CASH-ACK-SDK-AD CLOSE: SDK lost ACK reconciles one closure with identical payload',async()=>{
 qaState.cashAckLoss=true;const{props}=await mountCash('Fechar caixa');await submitCash();
 expect(container.querySelector('fieldset')!.disabled).toBe(true);expect(button('Repetir confirmação')).toBeTruthy();
 expect(inspectFixtures().sessions[0]!.status).toBe('CLOSED');const before=inspectFixtures();await submitCash();
 const calls=qaState.requests.filter(r=>r.name==='CloseCashSession');expect(calls).toHaveLength(2);expect(calls[1]!.variables).toEqual(calls[0]!.variables);expect(inspectFixtures()).toEqual(before);expect(props.onClose).toHaveBeenCalledOnce();
})
it('CASH-ACK-SDK-AD: direct field, mode and exit callbacks cannot bypass the uncertain instruction',async()=>{
 qaState.cashAckLoss=true;const{props,originalModeAction}=await mountCash();await submitCash();const first=structuredClone(api.execute.mock.calls[0][0]);
 await act(async()=>{
  reactProps(container.querySelector('input')!).onChange!({target:{value:'900'}});
  reactProps(container.querySelector('textarea')!).onChange!({target:{value:'Outra intenção'}});
  originalModeAction();reactProps(button('Voltar')).onClick!();reactProps(container.querySelector('[aria-label="Fechar controle de caixa"]')!).onClick!();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 });
 expect(props.onClose).not.toHaveBeenCalled();await submitCash();expect(api.execute.mock.calls[1][0]).toEqual(first);expect(inspectFixtures().cashMovements).toHaveLength(1);expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10500');
})
for(const context of ['branch','session','dc','permission','sessionToken'] as const)it('CASH-ACK-SDK-AD: changed '+context+' context cannot dispatch a retry',async()=>{
 qaState.cashAckLoss=true;const{props}=await mountCash();await submitCash();const before=inspectFixtures();
 const next={...props,...(context==='branch'?{branchId:uuid(2)}:context==='session'?{session:{...props.session,id:uuid(61)}}:context==='dc'?{dc:{} as DataConnect}:context==='permission'?{canManage:false}:{})};
 if(context==='sessionToken')api.sessionToken='another-synthetic-session';
 await act(async()=>root.render(<CashSessionModal {...next}/>));await submitCash();
 expect(api.execute).toHaveBeenCalledTimes(1);expect(props.onClose).not.toHaveBeenCalled();expect(container.querySelector('fieldset')!.disabled).toBe(true);expect(inspectFixtures()).toEqual(before);
})
for(const failure of ['fetch','parse','http','unknown','zero','malformed','unknownPartial','malformedPartial','mixedPartial'] as const)it('CASH-ACK-SDK-AD: '+failure+' after dispatch is indeterminate, not a definitive refusal',async()=>{
 const{props}=await mountCash();api.execute.mockImplementationOnce(async(ref)=>{
  await sdkExecute(ref);
  if(failure==='zero')return{data:{_execute:0}};
  if(failure==='malformed')return{data:{_execute:'1'}};
  if(failure==='unknown')throw Error('unknown result');
  if(failure==='unknownPartial')throw definitiveRefusal('unclassified failure');
  if(failure==='malformedPartial')throw Object.assign(new DataConnectError('partial-error','malformed'),{name:'DataConnectOperationError',response:{errors:[null]}});
  if(failure==='mixedPartial')throw Object.assign(definitiveRefusal(),{response:{errors:[{message:'POS_REJECTED',path:['_execute']},{message:'unclassified',path:['_execute']}]}});
  throw new DataConnectError('other',failure==='fetch'?'Failed to fetch: Failed to fetch':failure==='parse'?'Failed to parse JSON response: unexpected end':'HTTP failure without an authoritative outcome');
 });
 await submitCash();expect(props.onChanged).not.toHaveBeenCalled();expect(props.onClose).not.toHaveBeenCalled();expect(container.querySelector('fieldset')!.disabled).toBe(true);
 expect(props.onNotice).toHaveBeenLastCalledWith(expect.stringMatching(/Confirmação do caixa incerta/));expect(props.onNotice).not.toHaveBeenLastCalledWith(expect.stringMatching(/erro de rede/i));
 await submitCash();expect(api.execute.mock.calls[1][0]).toEqual(api.execute.mock.calls[0][0]);expect(inspectFixtures().cashMovements).toHaveLength(1);expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10500');
})
for(const failure of ['validation','branchDenied','sessionDenied','unauthorized','localArgument'] as const)it('CASH-ACK-SDK-AD: definitive '+failure+' permits a corrected new intention without effects',async()=>{
 const{props}=await mountCash();const error=failure==='unauthorized'?new DataConnectError('unauthorized','denied'):failure==='localArgument'?new DataConnectError('invalid-argument','invalid'):failure==='branchDenied'?definitiveRefusal('POS_BRANCH_DENIED','lockedBranch'):failure==='sessionDenied'?definitiveRefusal('SESSION_REQUIRED','session'):definitiveRefusal();
 api.execute.mockRejectedValueOnce(error);await submitCash();expect(inspectFixtures().cashMovements).toHaveLength(0);expect(container.querySelector('fieldset')!.disabled).toBe(false);expect(props.onNotice.mock.calls.some(c=>/incerta/i.test(c[0]))).toBe(false);
 await cashInput('textarea','Motivo corrigido');await submitCash();const calls=api.execute.mock.calls;expect(calls[1][0].variables.operationId).not.toBe(calls[0][0].variables.operationId);expect(inspectFixtures().cashMovements).toHaveLength(1);
})
it('CASH-ACK-SDK-AD: a later definitive rejection cannot erase an earlier unknown commit',async()=>{
 qaState.cashAckLoss=true;const{props}=await mountCash();await submitCash();api.execute.mockRejectedValueOnce(definitiveRefusal());await submitCash();
 expect(container.querySelector('fieldset')!.disabled).toBe(true);expect(props.onChanged).not.toHaveBeenCalled();await submitCash();
 const calls=api.execute.mock.calls;expect(calls).toHaveLength(3);expect(calls[1][0]).toEqual(calls[0][0]);expect(calls[2][0]).toEqual(calls[0][0]);expect(inspectFixtures().cashMovements).toHaveLength(1);expect(props.onChanged).toHaveBeenCalledOnce();
})
it('CASH-ACK-SDK-AD: confirmed ACK followed by refresh failure only retries refresh',async()=>{
 const{props}=await mountCash();props.onChanged.mockRejectedValueOnce(Error('refresh failed'));await submitCash();expect(inspectFixtures().sessions[0]!.expectedAmountCents).toBe('10500');expect(props.onClose).not.toHaveBeenCalled();expect(button('Atualizar saldo')).toBeTruthy();
 await submitCash();expect(api.execute).toHaveBeenCalledOnce();expect(props.onChanged).toHaveBeenCalledTimes(2);expect(props.onClose).toHaveBeenCalledOnce();expect(inspectFixtures().cashMovements).toHaveLength(1);
})
it('CASH-ACK-SDK-AD: pending dispatch, double submit and late ACK preserve one instruction',async()=>{
 const{props,originalModeAction}=await mountCash();let acknowledge!:(value:unknown)=>void;
 api.execute.mockImplementationOnce(async(ref)=>{const result=await sdkExecute(ref);return await new Promise(resolve=>{acknowledge=()=>resolve(result)})});
 await submitCash();await submitCash();await act(async()=>{originalModeAction();reactProps(button('Voltar')).onClick!()});
 expect(api.execute).toHaveBeenCalledOnce();expect(props.onClose).not.toHaveBeenCalled();await act(async()=>acknowledge({}));expect(props.onClose).toHaveBeenCalledOnce();expect(inspectFixtures().cashMovements).toHaveLength(1);
})
it('CASH-ACK-SDK-AD: approved close retries the SQL instruction instead of requesting approval again',async()=>{
 qaState.cashAckLoss=true;const props={...cashProps(),canManage:false,policy:{requireOpenSession:true,operatorDiscountPercent:0,operatorSurchargePercent:0,allowOperatorClose:false}};
 api.execute.mockImplementation(sdkExecute);api.requestApproval.mockResolvedValue({data:{_execute:1}});api.approvalStatus.mockResolvedValue({data:{_select:[{status:'APPROVED'}]}});
 await act(async()=>root.render(<CashSessionModal {...props}/>));await click('Fechar meu caixa');await cashInput('textarea','Conferência');await submitCash();expect(api.execute).not.toHaveBeenCalled();await submitCash();expect(container.querySelector('fieldset')!.disabled).toBe(true);
 api.approvalStatus.mockResolvedValue({data:{_select:[{status:'USED'}]}});await submitCash();expect(api.requestApproval).toHaveBeenCalledOnce();expect(api.approvalStatus).toHaveBeenCalledOnce();expect(api.execute.mock.calls[1][0]).toEqual(api.execute.mock.calls[0][0]);expect(inspectFixtures().sessions[0]!.status).toBe('CLOSED');expect(props.onClose).toHaveBeenCalledOnce();
})

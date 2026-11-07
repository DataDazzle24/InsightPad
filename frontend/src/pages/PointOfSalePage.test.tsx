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
const api=vi.hoisted(()=>({execute:vi.fn(),requestApproval:vi.fn(),approvalStatus:vi.fn(),workspace:vi.fn(),policy:vi.fn(),sessionToken:'synthetic-session'}))
vi.mock('firebase/data-connect',()=>({executeMutation:api.execute,mutationRef:(_dc:unknown,name:string,variables:Record<string,unknown>)=>({name,variables:{...variables,sessionToken:api.sessionToken}})}))
vi.mock('@insightpad/dataconnect',()=>({updatePosPolicy:api.policy,requestPosCashApproval:api.requestApproval,posCashApprovalStatus:api.approvalStatus,salesWorkspace:api.workspace}))
let root:Root,container:HTMLDivElement
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);api.execute.mockReset();api.workspace.mockReset();api.policy.mockReset();api.requestApproval.mockReset();api.approvalStatus.mockReset();api.sessionToken='synthetic-session';resetFixtures();Object.assign(qaState,{fail:false,empty:false,delay:0,permissions:'full',allowedBranches:[],cashAckLoss:false});container=document.createElement('div');document.body.append(container);root=createRoot(container)})
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
 const otherModeAction=reactProps(button(mode==='Suprimento'?'Sangria':'Suprimento')).onClick!;
 await click(mode);if(mode!=='Fechar caixa')await cashInput('input','500');await cashInput('textarea','Movimento teste');
 return{props,originalModeAction,otherModeAction};
}

it('CASH-ACK-SDK-AD CLOSE: SDK lost ACK reconciles one closure with identical payload',async()=>{
 qaState.cashAckLoss=true;const{props}=await mountCash('Fechar caixa');await submitCash();
 expect(container.querySelector('fieldset')!.disabled).toBe(true);expect(button('Conferir abertura')).toBeTruthy();
 expect(inspectFixtures().sessions[0]!.status).toBe('CLOSED');const before=inspectFixtures();await submitCash();
 const calls=qaState.requests.filter(r=>r.name==='CloseCashSession');expect(calls).toHaveLength(2);expect(calls[1]!.variables).toEqual(calls[0]!.variables);expect(inspectFixtures()).toEqual(before);expect(props.onClose).toHaveBeenCalledOnce();
})
it('CASH-ACK-SDK-AD: direct field, mode and exit callbacks cannot bypass the uncertain instruction',async()=>{
 qaState.cashAckLoss=true;const{props,originalModeAction,otherModeAction}=await mountCash();await submitCash();const first=structuredClone(api.execute.mock.calls[0][0]);
 await act(async()=>{
  reactProps(container.querySelector('input')!).onChange!({target:{value:'900'}});
  reactProps(container.querySelector('textarea')!).onChange!({target:{value:'Outra intenção'}});
  originalModeAction();otherModeAction();reactProps(button('Voltar')).onClick!();reactProps(container.querySelector('[aria-label="Fechar controle de caixa"]')!).onClick!();
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

// PDV v2: only an acknowledged opening or an owned session read may bind branch.
const eligible=[{id:'branch',name:'MATRIZ'},{id:'other',name:'FILIAL'}]
const selectOpening=async(value:string)=>{
 await act(async()=>{const el=container.querySelector('select')!;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('change',{bubbles:true}))});
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))})
}
const openingProps=()=>({dc:{} as DataConnect,branchId:'branch',branchName:'MATRIZ',branches:eligible,canOpen:true,canManage:false,onClose:vi.fn(),onChanged:vi.fn(async()=>{}),onOpened:vi.fn(async(branch:string)=>{void branch}),onNotice:vi.fn()})
const lookup=(open:typeof session|null=null)=>({data:{_select:[{data:{branches:eligible,openSession:open}}]}})
const renderOpening=async(props:ReturnType<typeof openingProps>)=>{
 api.workspace.mockResolvedValue(lookup());await act(async()=>root.render(<CashSessionModal {...props}/>));await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))})
}
it('PDV-v2: branch selection is draft; cancel does not change the product context',async()=>{
 const props=openingProps();await renderOpening(props);await selectOpening('other');await click('Cancelar');
 expect(props.onClose).toHaveBeenCalledOnce();expect(props.onOpened).not.toHaveBeenCalled();expect(props.onChanged).not.toHaveBeenCalled();expect(api.execute).not.toHaveBeenCalled();
 expect(api.workspace.mock.calls.at(-1)?.[1].branchId).toBe('other')
})
it('PDV-v2: unique branch prefilled and disabled, invalid/unauthorized handler rejected',async()=>{
 const props={...openingProps(),branchId:'',branches:[eligible[1]]};await renderOpening(props);
 expect(container.querySelector('select')?.value).toBe('other');expect(container.querySelector('select')?.disabled).toBe(true);
 await act(async()=>root.render(<CashSessionModal {...props} canOpen={false}/>));await submitCash();expect(api.execute).not.toHaveBeenCalled();expect(props.onOpened).not.toHaveBeenCalled()
})
it('PDV-v2: cart/correction lock rejects a synthetic different-branch submit',async()=>{
 const props={...openingProps(),branchLocked:true};await renderOpening(props);expect(container.querySelector('select')?.disabled).toBe(true);
 await selectOpening('other');await submitCash();expect(api.execute).not.toHaveBeenCalled();expect(props.onOpened).not.toHaveBeenCalled()
})
it('PDV-v2: positive opening binds only chosen eligible branch with original service fields',async()=>{
 const props=openingProps();await renderOpening(props);await selectOpening('other');api.execute.mockResolvedValue({data:{_execute:1}});await cashInput('input','5000');await submitCash();
 expect(api.execute).toHaveBeenCalledOnce();expect(api.execute.mock.calls[0][0]).toMatchObject({name:'OpenCashSession',variables:{branchId:'other',openingAmountCents:5000,notes:''}});
 expect(api.execute.mock.calls[0][0].variables).not.toHaveProperty('operationId');expect(props.onOpened).toHaveBeenCalledExactlyOnceWith('other');expect(props.onClose).toHaveBeenCalledOnce()
})
it('PDV-v2: existing owned session resumes by reading, without new opening',async()=>{
 const props=openingProps();await renderOpening(props);api.workspace.mockResolvedValue(lookup(session));await selectOpening('other');expect(button('Retomar caixa')).toBeTruthy();await submitCash();
 expect(api.execute).not.toHaveBeenCalled();expect(props.onOpened).toHaveBeenCalledExactlyOnceWith('other')
})
it('PDV-v2: lost opening ACK reconciles same branch read; no duplicate opening',async()=>{
 const props=openingProps();await renderOpening(props);api.execute.mockRejectedValue(new TypeError('Failed to fetch'));await submitCash();expect(container.querySelector('select')?.matches(':disabled')).toBe(true);
 expect(button('Cancelar').disabled).toBe(true);await act(async()=>{(container.querySelector('[aria-label="Fechar controle de caixa"]') as HTMLButtonElement).click()});expect(props.onClose).not.toHaveBeenCalled();
 api.workspace.mockResolvedValue(lookup(session));await submitCash();expect(api.execute).toHaveBeenCalledOnce();expect(props.onOpened).toHaveBeenCalledExactlyOnceWith('branch');expect(props.onClose).toHaveBeenCalledOnce()
})
it('PDV-v2: absent session after lost opening ACK never authorizes a second opening',async()=>{
 const props=openingProps();await renderOpening(props);api.execute.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({data:{_execute:1}});await cashInput('input','2500');await submitCash();const first=api.execute.mock.calls[0][0];await submitCash();
 // The original opening might have committed and been closed in another tab.
 // A branch read returning null cannot authorize another financial effect.
 expect(api.execute).toHaveBeenCalledOnce();expect(Object.isFrozen(first.variables)).toBe(true);expect(api.workspace).toHaveBeenCalledTimes(2);expect(props.onOpened).not.toHaveBeenCalled();expect(button('Conferir abertura')).toBeTruthy();
 api.workspace.mockResolvedValue(lookup(session));await submitCash();expect(api.execute).toHaveBeenCalledOnce();expect(props.onOpened).toHaveBeenCalledOnce()
})
it('PDV-v2: SDK secret change blocks uncertain opening replay',async()=>{
 const props=openingProps();await renderOpening(props);api.execute.mockRejectedValue(new TypeError('Failed to fetch'));await submitCash();api.sessionToken='new-session';await submitCash();expect(api.execute).toHaveBeenCalledOnce();expect(props.onOpened).not.toHaveBeenCalled()
})
it('PDV-v2: confirmed opening plus refresh failure retries context only',async()=>{
 const props=openingProps();props.onOpened.mockRejectedValueOnce(Error('read failed')).mockResolvedValueOnce();await renderOpening(props);api.execute.mockResolvedValue({data:{_execute:1}});await submitCash();expect(button('Atualizar contexto')).toBeTruthy();await submitCash();
 expect(api.execute).toHaveBeenCalledOnce();expect(props.onOpened).toHaveBeenCalledTimes(2);expect(props.onClose).toHaveBeenCalledOnce()
})
it('PDV-v2: refused opening leaves branch unbound; reread required before retry',async()=>{
 const props=openingProps();await renderOpening(props);api.execute.mockRejectedValue(Object.assign(Error('SESSION_REQUIRED'),{name:'DataConnectOperationError',code:'partial-error',response:{errors:[{message:'SESSION_REQUIRED',path:['session']}]}}));await submitCash();
 expect(props.onOpened).not.toHaveBeenCalled();expect(props.onClose).not.toHaveBeenCalled();expect(button('Abrir caixa').disabled).toBe(true);await click('Conferir sessão');await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))});expect(button('Abrir caixa').disabled).toBe(false)
})
it('PDV-v2: stale branch session read cannot replace the newer draft result',async()=>{
 const props=openingProps();let resolve!:(result:ReturnType<typeof lookup>)=>void;api.workspace.mockImplementationOnce(()=>new Promise(r=>{resolve=r})).mockResolvedValue(lookup(session));
 await act(async()=>root.render(<CashSessionModal {...props}/>));await act(async()=>{await new Promise(r=>setTimeout(r,10))});await selectOpening('other');await act(async()=>resolve(lookup()));
 expect(button('Retomar caixa')).toBeTruthy();await submitCash();expect(props.onOpened).toHaveBeenCalledExactlyOnceWith('other');expect(api.execute).not.toHaveBeenCalled()
})
it('PDV-v2: double submit while opening is in flight produces one mutation',async()=>{
 const props=openingProps();await renderOpening(props);let resolve!:(value:{data:{_execute:number}})=>void;api.execute.mockImplementationOnce(()=>new Promise(r=>{resolve=r}));
 await act(async()=>{for(let i=0;i<2;i++)container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});
 expect(api.execute).toHaveBeenCalledOnce();expect(props.onOpened).not.toHaveBeenCalled();await act(async()=>resolve({data:{_execute:1}}));expect(props.onOpened).toHaveBeenCalledOnce()
})

it('PDV-v2: company rules use an eligible draft without binding or opening a cash branch',async()=>{
 const props={...openingProps(),branchId:'',canManage:true};await renderOpening(props);expect(button('Regras da empresa').disabled).toBe(true);await selectOpening('other');expect(button('Regras da empresa').disabled).toBe(false);
 await click('Regras da empresa');api.policy.mockResolvedValue({data:{_execute:1}});await submitCash();expect(api.policy).toHaveBeenCalledOnce();expect(props.onChanged).toHaveBeenCalledOnce();expect(props.onClose).toHaveBeenCalledOnce();expect(props.onOpened).not.toHaveBeenCalled();expect(api.execute).not.toHaveBeenCalled()
})

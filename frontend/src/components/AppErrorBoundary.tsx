import { Component,type ErrorInfo,type ReactNode } from 'react'

type Props={children:ReactNode}
type State={failed:boolean}

export class AppErrorBoundary extends Component<Props,State>{
 state:State={failed:false}

 static getDerivedStateFromError():State{return {failed:true}}

 componentDidCatch(error:Error,info:ErrorInfo){
  console.error('Erro não tratado na interface do Insight Pad.',error,info)
 }

 render(){
  if(this.state.failed)return <main className="fatal-error" role="alert">
   <span className="material-symbols-rounded">error</span>
   <h1>Não foi possível exibir esta página</h1>
   <p>Seus dados não foram alterados. Atualize a página para tentar novamente.</p>
   <button onClick={()=>window.location.reload()}>Atualizar página</button>
  </main>
  return this.props.children
 }
}

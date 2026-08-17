export const digits=(value:string)=>value.replace(/\D/g,'')

export const csvSafe=(value:string)=>/^[=+\-@]/.test(value)?`'${value}`:value

export function isValidCpf(value:unknown){
 const cpf=digits(String(value??''))
 if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false
 const calc=(length:number)=>{let sum=0;for(let index=0;index<length;index++)sum+=Number(cpf[index])*(length+1-index);const rest=(sum*10)%11;return rest===10?0:rest}
 return calc(9)===Number(cpf[9])&&calc(10)===Number(cpf[10])
}

export function isValidCnpj(value:unknown){
 const cnpj=digits(String(value??''))
 if(!/^\d{14}$/.test(cnpj)||/^(\d)\1{13}$/.test(cnpj))return false
 const digit=(base:string,weights:number[])=>{const rest=base.split('').reduce((sum,n,index)=>sum+Number(n)*weights[index],0)%11;return rest<2?0:11-rest}
 return digit(cnpj.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===Number(cnpj[12])
  &&digit(cnpj.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===Number(cnpj[13])
}

export const moneyFromCents=(value:unknown)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value??0)/100)

export function maskRegistrationValue(key:string,value:string){
 const clean=digits(value)
 if(key==='cpf')return clean.slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')
 if(key==='cnpj')return clean.slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')
 if(key==='postalCode')return clean.slice(0,8).replace(/(\d{5})(\d)/,'$1-$2')
 if(key.toLowerCase().includes('phone'))return clean.slice(0,11).replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{4})$/,'$1-$2')
 if(key==='costPriceCents'||key==='salePriceCents')return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(clean||0)/100)
 return value
}

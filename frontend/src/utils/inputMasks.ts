const digits=(value:string,max:number)=>value.replace(/\D/g,'').slice(0,max)

export function maskCpf(value:string){const v=digits(value,11);return v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')}
export function maskCnpj(value:string){const v=digits(value,14);return v.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2')}
export function maskCep(value:string){return digits(value,8).replace(/(\d{5})(\d)/,'$1-$2')}
export function maskPhone(value:string){const v=digits(value,11);return v.length<=10?v.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2'):v.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2')}
export function maskBarcode(value:string){return digits(value,18)}
export function smartMaskInput(input:HTMLInputElement){const label=input.labels?.[0]?.textContent??'',hint=`${input.name} ${input.id} ${input.placeholder??''} ${label}`.toLocaleLowerCase('pt-BR');let next=input.value;if(/cnpj/.test(hint))next=maskCnpj(next);else if(/cpf/.test(hint))next=maskCpf(next);else if(/cep|código postal/.test(hint))next=maskCep(next);else if(/telefone|celular|whatsapp|fone/.test(hint))next=maskPhone(next);else if(/ean|código de barras|codigo de barras|barcode/.test(hint))next=maskBarcode(next);else if(input.type==='email')next=next.replace(/\s/g,'').toLocaleLowerCase('pt-BR');if(next!==input.value)input.value=next}

// Only the typed request can authorize importing an attachment.
export function attachmentIntent(question) {
 const text=question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
 if(!text)return 'clarify';
 const verbs='(?:cadastre|cadastrar|importe|importar|adicione|adicionar|inclua|incluir|registre|registrar|salve|salvar|insira|inserir)';
 const negative=new RegExp('\\b(?:nao|nunca|sem)\\b(?:\\s+\\w+){0,4}\\s+'+verbs+'\\b');
 if(negative.test(text))return 'analyze';
 // Questions about how to import are instructions to explain, not to write data.
 if(/\b(como|quando|por que|porque)\b/.test(text))return 'analyze';
 const command=new RegExp('(?:^|[.!?;]\\s*)(?:agora[, ]+)?(?:por favor[, ]+)?(?:(?:eu )?(?:quero|gostaria)(?: de)?(?: que voce| que)? |(?:voce )?(?:pode|poderia)(?: voce)? |vamos )?(?:por favor[, ]+)?'+verbs+'\\b');
 if(!command.test(text))return 'analyze';
 if(/\b(analis[ae]|analisar|compare|comparar|prioriz|avalie|avaliar)\b/.test(text))return 'clarify';
 return 'import';
}

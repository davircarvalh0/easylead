export const assistantProtocolFallback='Não foi possível concluir esta consulta. Envie sua pergunta novamente.';
export function hasAssistantProtocol(value){return typeof value==='string'&&/[|｜]{1,2}DSML[|｜]{1,2}/i.test(value);}
export function publicAssistantReply(value){return hasAssistantProtocol(value)?assistantProtocolFallback:value;}

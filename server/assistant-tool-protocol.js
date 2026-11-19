import {hasAssistantProtocol} from '../src/services/assistantProtocol.js';
function attributes(source){
 const result=Object.create(null),pattern=/\s+([a-zA-Z_][a-zA-Z_0-9]*)=(["'])([\s\S]*?)\2/g;let cursor=0;
 for(const match of source.matchAll(pattern)){
  if(source.slice(cursor,match.index).trim()||Object.hasOwn(result,match[1]))return null;
  result[match[1]]=match[3];cursor=match.index+match[0].length;
 }
 return source.slice(cursor).trim()?null:result;
}
// Narrow compatibility bridge for provider output, never user input or history.
// SQL is still executed only by the existing read-only, bounded query worker.
export function parseDsmlQueries(content){
 if(!hasAssistantProtocol(content)||content.length>48000)return null;
 let normalized=content.trim().replace(/^```(?:xml|text)?\s*\n([\s\S]*?)\n```$/,'$1').trim();
 normalized=normalized.replace(/\\?<([/]?)[|｜]{1,2}DSML[|｜]{1,2}\s*(calls|tool_calls|invoke|parameter)\b([^<>]*)>/gi,'<$1$2$3>');
 const root=normalized.match(/^<(calls|tool_calls)>\s*([\s\S]*?)\s*<\/\1>$/);
 if(!root)return null;
 const queries=[],pattern=/<invoke\b([^>]*)>([\s\S]*?)<\/invoke>/g;let cursor=0;
 for(const match of root[2].matchAll(pattern)){
  if(root[2].slice(cursor,match.index).trim())return null;
  const invoke=attributes(match[1]);if(!invoke||Object.keys(invoke).length!==1||invoke.name!=='consultar_dados')return null;
  const parameter=match[2].trim().match(/^<parameter\b([^>]*)>([\s\S]*?)<\/parameter>$/);
  if(!parameter)return null;
  const args=attributes(parameter[1]),sql=parameter[2].trim();
  if(!args||Object.keys(args).length!==2||args.name!=='sql'||args.string!=='true'||!sql||sql.length>6000||!/^\s*(SELECT|WITH)\b/i.test(sql)||/<\/?(?:invoke|parameter)\b/.test(sql))return null;
  queries.push(sql);if(queries.length>6)return null;
  cursor=match.index+match[0].length;
 }
 return queries.length&&!root[2].slice(cursor).trim()?queries:null;
}

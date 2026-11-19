// Only a small, bounded chart format is accepted. Model output never becomes HTML or code.
export function validateAssistantChart(value) {
  if (!value || !['bar','line'].includes(value.type) || typeof value.title!=='string'
    || !value.title.trim() || value.title.length>160 || !['number','BRL','%'].includes(value.unit ?? 'number')
    || !Array.isArray(value.data) || !value.data.length || value.data.length>24
    || value.data.some(item=>!item || typeof item.label!=='string' || !item.label.trim()
      || item.label.length>100 || typeof item.value!=='number' || !Number.isFinite(item.value))) return null;
  return {type:value.type,title:value.title,unit:value.unit ?? 'number',data:value.data.map(({label,value})=>({label,value}))};
}

export function parseAssistantBlocks(reply) {
  const blocks=[];
  const pattern=/^```chart\s*\r?\n([\s\S]*?)(?:^```[^\S\r\n]*(?=\r?$)|$(?![\s\S]))/gm;
  let cursor=0;
  for (const match of reply.matchAll(pattern)) {
    if (match.index>cursor) blocks.push({kind:'text',text:reply.slice(cursor,match.index)});
    let chart;
    try {chart=validateAssistantChart(JSON.parse(match[1]));} catch {}
    blocks.push(chart ? {kind:'chart',chart} : {kind:'invalid-chart'});
    cursor=match.index+match[0].length;
  }
  if (cursor<reply.length) blocks.push({kind:'text',text:reply.slice(cursor)});
  return blocks;
}

function tableCells(line) {
 const cells=[];let cell='',codeTicks=0;
 const value=line.trim();
 for(let index=0;index<value.length;index++){
  const char=value[index];
  if(char==='\\'&&value[index+1]==='|'){cell+='|';index++;continue;}
  if(char==='`'){
   let count=1;while(value[index+count]==='`')count++;
   if(!codeTicks)codeTicks=count;else if(codeTicks===count)codeTicks=0;
   cell+='`'.repeat(count);index+=count-1;continue;
  }
  if(char==='|'&&!codeTicks){cells.push(cell.trim());cell='';}else cell+=char;
 }
 cells.push(cell.trim());
 if(value.startsWith('|'))cells.shift();
 if(value.endsWith('|')&&!value.endsWith('\\|'))cells.pop();
 return cells;
}

export function parseAssistantTables(text) {
 const lines=text.replace(/\r\n?/g,'\n').split('\n'),blocks=[];
 let pending=[],fenced=false;
 function flush(){if(pending.join('\n').trim())blocks.push({kind:'text',text:pending.join('\n')});pending=[];}
 for(let index=0;index<lines.length;index++){
  const line=lines[index];
  if(/^\s*```/.test(line)){fenced=!fenced;pending.push(line);continue;}
  const header=tableCells(line),delimiter=tableCells(lines[index+1]||'');
  if(!fenced&&line.includes('|')&&header.length>1&&header.length===delimiter.length&&delimiter.every(cell=>/^:?-{3,}:?$/.test(cell))){
   flush();
   const alignments=delimiter.map(cell=>cell.startsWith(':')&&cell.endsWith(':')?'center':cell.endsWith(':')?'right':'left');
   const rows=[];index++;
   while(index+1<lines.length&&lines[index+1].trim()&&lines[index+1].includes('|')){
    const row=tableCells(lines[index+1]);
    if(row.length>header.length)break;
    rows.push([...row,...Array(header.length-row.length).fill('')]);index++;
   }
   blocks.push({kind:'table',headers:header,alignments,rows});
  }else pending.push(line);
 }
 flush();return blocks;
}

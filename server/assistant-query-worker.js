import {DatabaseSync, constants as sqlite} from 'node:sqlite';
import {tables} from './assistant-data.js';

function openDatabase(snapshot) {
  const db = new DatabaseSync(':memory:');
  db.exec('BEGIN');
  for (const [table,{text,number}] of Object.entries(tables)) {
    const columns = [...text.split(' ').map(name=>[name,'TEXT']),...(number?.split(' ') || []).map(name=>[name,'REAL'])];
    db.exec('CREATE TABLE '+table+' ('+columns.map(column=>column.join(' ')).join(',')+')');
    const insert = db.prepare('INSERT INTO '+table+' VALUES ('+columns.map(()=>'?').join(',')+')');
    for (const row of snapshot[table]) {
      insert.run(...columns.map(([field,type])=>{
        const value = row?.[field];
        if (type === 'REAL') return typeof value==='number' && Number.isFinite(value) ? value : null;
        return typeof value==='string' ? value : null;
      }));
    }
  }
  db.exec('COMMIT; PRAGMA query_only = ON;');
  db.function('normalizar',{deterministic:true},value=>typeof value==='string'
    ? value.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR') : value);
  const allowedFunctions = new Set([
    'abs','avg','coalesce','count','date','datetime','format','glob','group_concat','ifnull','iif',
    'instr','julianday','length','like','lower','ltrim','max','min','nullif','normalizar','printf','replace',
    'round','rtrim','strftime','substr','sum','total','trim','unixepoch','upper','json_array_length',
    'json_extract','row_number','rank','dense_rank','lag','lead',
  ]);
  db.setAuthorizer((action,table,detail)=>{
    if (action===sqlite.SQLITE_SELECT) return sqlite.SQLITE_OK;
    if (action===sqlite.SQLITE_READ && Object.hasOwn(tables,table)) return sqlite.SQLITE_OK;
    if (action===sqlite.SQLITE_FUNCTION && allowedFunctions.has(detail?.toLowerCase())) return sqlite.SQLITE_OK;
    return sqlite.SQLITE_DENY;
  });
  return db;
}

let database;
process.on('message',({snapshot,sql})=>{
  if (snapshot) { database=openDatabase(snapshot); return; }

  try {
    if (typeof sql!=='string' || sql.length>6000 || !/^\s*(SELECT|WITH)\b/i.test(sql)) {
      throw Error('Use uma única consulta SELECT ou WITH.');
    }
    const rows = database.prepare('SELECT * FROM ('+sql.trim().replace(/;\s*$/,'')+') LIMIT 101').all();
    const result = [];
    let chars = 0;
    for (const row of rows.slice(0,100)) {
      chars += JSON.stringify(row).length;
      if (chars>24000) break;
      result.push(row);
    }
    process.send({rows:result,truncated:result.length<rows.length});
  } catch (error) {
    process.send({error:error.message});
  }
});

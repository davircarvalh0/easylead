import {readFile} from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw Error('Configure DATABASE_URL no .env.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
try{await pool.query(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8'));console.log('Tabelas do EasyLead criadas. Nenhum dado existente foi substituído.');}finally{await pool.end();}

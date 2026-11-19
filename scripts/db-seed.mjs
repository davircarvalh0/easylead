import {renameDemoCompanies} from '../src/services/demoCompanyNames.js';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {hydrateState} from '../src/repositories/stateRepository.js';
if(!process.env.DATABASE_URL)throw Error('Configure DATABASE_URL no .env.');
const file=process.argv[2];if(!file)throw Error('Informe um JSON de carteira: npm run db:seed -- .env.demo-leads.json');
const data=JSON.parse(await readFile(file,'utf8'));
if(data.version!==1||!['areas','members','leads','projects'].every(key=>Array.isArray(data[key])))throw Error('JSON de carteira inválido.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
try{const result=await pool.query('INSERT INTO easylead_workspaces(id,state) VALUES($1,$2::jsonb) ON CONFLICT(id) DO NOTHING RETURNING id',[process.env.APP_WORKSPACE_ID||'main',JSON.stringify(hydrateState(renameDemoCompanies(data).state))]);console.log(result.rowCount?'Carteira importada: '+data.leads.length+' leads e '+data.projects.length+' projetos.':'A carteira já existe. Nenhum dado foi sobrescrito.');}finally{await pool.end();}

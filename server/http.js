export class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
export function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
export async function bodyJson(req,limit=3500000){
 if(!req.headers['content-type']?.startsWith('application/json'))throw new ApiError(415,'Envie os dados em JSON.');
 if(req.body!==undefined){const value=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(value)>limit)throw new ApiError(413,'Os dados excedem o limite desta operação.');try{return JSON.parse(value);}catch{throw new ApiError(400,'JSON inválido.');}}
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw new ApiError(413,'Os dados excedem o limite desta operação.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ApiError(400,'JSON inválido.');}
}

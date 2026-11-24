import bcrypt from 'bcryptjs';
import { createApp } from './src/cmd/api/app.js';
import { AuthService } from './src/internal/service/auth.js';
import { UserRepository } from './src/internal/repository/user.js';
import { TikTokScraper } from './src/internal/scraper/scraper.js';
import { writeFileSync } from 'node:fs';

// Isolated fixtures only: no real MySQL, Redis, TikTok or destructive SQL is used.
const captured: {sql:string; params:any[]}[] = [];
const hash = bcrypt.hashSync('sandi_benar_unik', 4);
const row = {id:1, username:'akun_uji', email:'uji@example.test', password_hash:hash, full_name:'Akun Uji', role:'streamer', created_at:new Date(), updated_at:new Date()};
const repo = new UserRepository({pool:{execute:async(sql:string,params:any[])=>{captured.push({sql,params}); return [[params?.[0] === row.username || params?.[0] === row.email ? row : null].filter(Boolean)];}}} as any);
const auth = new AuthService(repo);
const scraperTargets:string[]=[];
TikTokScraper.prototype.start = async function(){ scraperTargets.push((this as any).targetUsername); throw new Error('Koneksi TikTok tiruan'); };
const app = createApp({start(){}} as any, {} as any, auth);
const loginRoute = (app as any).router.stack.find((layer:any) => layer.route?.path === '/api/auth/login').route.stack[0].handle;
const connectRoute = (app as any).router.stack.find((layer:any) => layer.route?.path === '/api/live/connect').route.stack[0].handle;
const results:any[]=[];
async function test(id:string, body:any, expected:string) {
 captured.length=0;
 let status = 200, response:any;
 const res = {status(code:number){status=code;return this;},json(value:any){response=value;return this;}};
 try { await loginRoute({body},res); } catch (err:any) { status=500; response={uncaught:err.message}; }
 results.push({id, body, expected, status, response, sql:captured.map(x=>({query:x.sql,params:x.params}))});
}
await test('S01',{usernameOrEmail:"' OR 1=1;/*",password:'salah'},'401; input diperlakukan sebagai data');
await test('S02',{usernameOrEmail:'akun_uji',password:"' OR 1=1;/*"},'401; sandi tidak cocok');
await test('S03',{usernameOrEmail:'<script>alert(1)</script>',password:'salah'},'401; tidak ada autentikasi');
await test('S04',{usernameOrEmail:'akun_uji'},'400 atau 401; sandi wajib');
await test('S05',{usernameOrEmail:'akun_uji',password:''},'400 atau 401; sandi wajib');
await test('S06',{usernameOrEmail:'akun_uji',password:'password123'},'401; sandi salah untuk fixture');
await test('S07',{usernameOrEmail:'akun_uji',password:'sandi_benar_unik',tiktokUsername:'<script>alert(1)</script>'},'target berformat salah ditolak');
await test('S08',{usernameOrEmail:'akun_uji',password:'sandi_benar_unik',tiktokUsername:'nama akun'},'target berformat salah ditolak');
await test('S09',{usernameOrEmail:'x'.repeat(5000),password:'salah'},'identitas terlalu panjang ditolak dengan pesan validasi');
await test('S10',{usernameOrEmail:['akun_uji'],password:'salah'},'400; identitas harus berupa teks');
await test('S11',{usernameOrEmail:'akun_uji',password:{x:1}},'400; sandi harus berupa teks');
async function connectTest(id:string,channel:any){
 scraperTargets.length=0; let status=200,response:any;
 const res={status(code:number){status=code;return this},json(value:any){response=value;return this}};
 try {await connectRoute({body:{channel}},res)} catch(err:any){status=500;response={uncaught:err.message}}
 results.push({id,body:{channel},status,response,scraperTargets:[...scraperTargets]});
}
await connectTest('G-S01','');
await connectTest('G-S02',"' OR 1=1;/*");
await connectTest('G-S03','<script>alert(1)</script>');
await connectTest('G-S04','nama akun');
await connectTest('G-S05',123);
writeFileSync('../hasil_uji_defensive.json', JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));

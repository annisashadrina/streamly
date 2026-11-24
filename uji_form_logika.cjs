// Executes the actual form handlers with simulated React state and network responses.
const fs = require('fs');
const vm = require('vm');
const loginSource = fs.readFileSync('frontend/src/auth/LoginPage.jsx', 'utf8');
const dashSource = fs.readFileSync('frontend/src/pages/DashboardPage.jsx', 'utf8');
const loginHandler = loginSource.slice(loginSource.indexOf('    const cleanUsername'), loginSource.indexOf('    const handleDemoLogin')) + '\nhandleSubmit(event);';
const channelHandler = dashSource.slice(dashSource.indexOf('    const handleChangeChannel'), dashSource.indexOf('\n    useEffect(', dashSource.indexOf('    const handleChangeChannel'))) + '\nhandleChangeChannel(event);';
const rows = [];
async function executeLogin(id, identifier, password, tiktokTarget) {
  let error = '', requests = [], loggedIn = false;
  const ctx = {identifier,password,tiktokTarget,event:{preventDefault(){}},setError:v=>error=v,setIsLoading(){},localStorage:{setItem(){}},onLoginSuccess(){loggedIn=true},API_URL:'/api',console,
    fetch: async (url, options)=>{ const body=JSON.parse(options.body); requests.push(body); const valid=body.usernameOrEmail==='aryo_streamer' && body.password==='password123'; return {ok:valid,status:valid?200:401,json:async()=>valid?{user:{id:1,username:'aryo_streamer'},token:'mock',tiktokUsername:body.tiktokUsername}:{message:body.usernameOrEmail==='aryo_streamer'?'Password yang Anda masukkan salah.':'Pengguna tidak ditemukan (simulasi).'}}; }};
  await vm.runInNewContext(loginHandler,ctx); rows.push({id,error,requests,loggedIn});
}
async function executeChannel(id,newChannelInput) {
 let error='',requests=[],changed=false;
 const ctx={newChannelInput,event:{preventDefault(){}},setIsLoading(){},setError:v=>error=v,setLiveChannel(){changed=true},setIsChangingChannel(){},setNewChannelInput(){},setInsightData(){},localStorage:{setItem(){}},API_URL:'/api',fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:false,json:async()=>({message:'Koneksi simulasi gagal'})}}};
 await vm.runInNewContext(channelHandler,ctx);rows.push({id,error,requests,changed});
}
(async()=>{
 for(const row of [['L01','','','metropolitan.id'],['L02','   ','password123','metropolitan.id'],['L03','@','password123','metropolitan.id'],['L04','aryo_streamer','','metropolitan.id'],['L05','aryo_streamer','sandi_salah_987','metropolitan.id'],['L06','akun_tidak_terdaftar_987','password123','metropolitan.id'],['L07','nama@@contoh..com','password123','metropolitan.id'],['L08','aryo_streamer','   ','metropolitan.id'],['T01','aryo_streamer','password123','nama akun'],['T02','aryo_streamer','password123','nama#akun'],['T03','aryo_streamer','password123','https://www.tiktok.com/@contoh'],['T04','aryo_streamer','password123','@@contoh'],['T07','aryo_streamer','password123','']]) await executeLogin(...row);
 for(const row of [['G01',''],['G02','   '],['G03','@'],['G04','nama akun'],['G05','nama#akun'],['G06','https://www.tiktok.com/@contoh'],['G07','@@contoh'],['G08','akun_tidak_ada_987654321']]) await executeChannel(...row);
 fs.writeFileSync('hasil_uji_form_logika.json',JSON.stringify(rows,null,2)); console.log(JSON.stringify(rows,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SerialPort } from 'serialport'

const app = express(), prisma = new PrismaClient()
const PORT = Number(process.env.PORT || 4000)
app.use(helmet())
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','), credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120 }))
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 12 })
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const run = (bin, args, options={}) => new Promise((resolve,reject)=>{
  const child=spawn(bin,args,{...options, shell:false})
  let stdout='',stderr=''; child.stdout?.on('data',d=>stdout+=d); child.stderr?.on('data',d=>stderr+=d)
  child.on('error',reject); child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(stderr || `${bin} exit ${code}`)))
})
function tokenFor(user){return jwt.sign({sub:user.id},process.env.JWT_SECRET,{expiresIn:'7d'})}
async function auth(req,res,next){try{const t=(req.headers.authorization||'').replace(/^Bearer /,'');const p=jwt.verify(t,process.env.JWT_SECRET);req.user=await prisma.user.findUnique({where:{id:p.sub},select:{id:true,name:true,email:true,role:true,groupName:true}});if(!req.user)return res.status(401).json({error:'Hisob topilmadi'});next()}catch{return res.status(401).json({error:'Kirish talab qilinadi'})}}
app.get('/api/health',(req,res)=>res.json({ok:true,service:'TexnoRoboCAD API',ai:Boolean(openai)}))
app.post('/api/auth/register',authLimit,async(req,res)=>{try{const d=z.object({name:z.string().min(2),email:z.email(),password:z.string().min(8),role:z.enum(['student','teacher']).optional(),groupName:z.string().optional()}).parse(req.body);const passwordHash=await bcrypt.hash(d.password,12);const user=await prisma.user.create({data:{...d,passwordHash},select:{id:true,name:true,email:true,role:true,groupName:true}});res.status(201).json({token:tokenFor(user),user})}catch(e){res.status(400).json({error:e.code==='P2002'?'Bu email band':e.message})}})
app.post('/api/auth/login',authLimit,async(req,res)=>{try{const d=z.object({email:z.email(),password:z.string()}).parse(req.body);const u=await prisma.user.findUnique({where:{email:d.email}});if(!u||!await bcrypt.compare(d.password,u.passwordHash))return res.status(401).json({error:'Email yoki parol noto‘g‘ri'});const user={id:u.id,name:u.name,email:u.email,role:u.role,groupName:u.groupName};res.json({token:tokenFor(user),user})}catch(e){res.status(400).json({error:e.message})}})
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}))
app.get('/api/projects',auth,async(req,res)=>res.json(await prisma.project.findMany({where:{userId:req.user.id},orderBy:{updatedAt:'desc'}})))
app.post('/api/projects',auth,async(req,res)=>{try{const d=z.object({title:z.string().min(1).max(120),kind:z.string().default('cad'),data:z.unknown()}).parse(req.body);res.status(201).json(await prisma.project.create({data:{...d,userId:req.user.id}}))}catch(e){res.status(400).json({error:e.message})}})
app.put('/api/projects/:id',auth,async(req,res)=>{try{const d=z.object({title:z.string().min(1).max(120).optional(),data:z.unknown().optional()}).parse(req.body);const p=await prisma.project.findFirst({where:{id:req.params.id,userId:req.user.id}});if(!p)return res.sendStatus(404);res.json(await prisma.project.update({where:{id:p.id},data:d}))}catch(e){res.status(400).json({error:e.message})}})
app.delete('/api/projects/:id',auth,async(req,res)=>{const p=await prisma.project.deleteMany({where:{id:req.params.id,userId:req.user.id}});res.json({deleted:p.count===1})})

// AI creates parametric OpenSCAD geometry; server renders a real STL using OpenSCAD CLI.
app.post('/api/ai3d/generate',auth,async(req,res)=>{
  if(!openai)return res.status(503).json({error:'OPENAI_API_KEY server .env faylida sozlanmagan'})
  const prompt=z.string().min(8).max(2000).parse(req.body.prompt)
  const kind=z.enum(['robot','box','disc']).default('robot').parse(req.body.kind||'robot')
  const dir=await mkdtemp(path.join(tmpdir(),'texnorobocad-'))
  try{
    const completion=await openai.chat.completions.create({model:process.env.OPENAI_MODEL||'gpt-5',messages:[
      {role:'system',content:'You are a mechanical CAD engineer. Return ONLY valid OpenSCAD source code. Create a printable, dimensioned, parametric single-part or assembled educational model. Use mm, avoid unsupported imports, keep geometry inside positive coordinates, and include sensible wall thickness and mounting holes when relevant. Never include markdown fences.'},
      {role:'user',content:`Create a ${kind} model from this request: ${prompt}. Return OpenSCAD code only.`}
    ]})
    const scad=(completion.choices[0]?.message?.content||'').replace(/^```(?:openscad)?\s*/i,'').replace(/```\s*$/,'')
    if(!scad.includes('module')&&!scad.includes('cube')&&!scad.includes('cylinder')&&!scad.includes('sphere'))throw new Error('AI yaroqli CAD geometriya qaytarmadi')
    const source=path.join(dir,'model.scad'), output=path.join(dir,'model.stl')
    await import('node:fs/promises').then(fs=>fs.writeFile(source,scad,'utf8'))
    await run(process.env.OPENSCAD_BIN||'openscad',['-o',output,source])
    const stl=await readFile(output)
    res.json({filename:'texnorobocad-ai-model.stl',scad,stlBase64:stl.toString('base64'),bytes:stl.length})
  }catch(e){res.status(502).json({error:`3D generatsiya bajarilmadi: ${e.message}`})}finally{await rm(dir,{recursive:true,force:true})}
})

// Arduino compile/upload is executed on the computer/server physically connected to the board.
app.get('/api/arduino/ports',auth,async(req,res)=>{try{const ports=await SerialPort.list();res.json(ports.map(p=>({path:p.path,manufacturer:p.manufacturer||'',serialNumber:p.serialNumber||''})))}catch(e){res.status(500).json({error:e.message})}})
app.post('/api/arduino/compile',auth,async(req,res)=>{try{const {code}=z.object({code:z.string().min(1).max(30000)}).parse(req.body);const dir=await mkdtemp(path.join(tmpdir(),'trc-arduino-'));try{const sketch=path.join(dir,'Sketch');await import('node:fs/promises').then(fs=>fs.mkdir(sketch));await import('node:fs/promises').then(fs=>fs.writeFile(path.join(sketch,'Sketch.ino'),code));const result=await run(process.env.ARDUINO_CLI_BIN||'arduino-cli',['compile','--fqbn',process.env.ARDUINO_FQBN||'arduino:avr:uno',sketch]);res.json({compiled:true,output:result.stdout+result.stderr})}finally{await rm(dir,{recursive:true,force:true})}}catch(e){res.status(400).json({compiled:false,error:e.message})}})
app.post('/api/arduino/upload',auth,async(req,res)=>{try{const {code,port}=z.object({code:z.string().min(1).max(30000),port:z.string().min(1)}).parse(req.body);const dir=await mkdtemp(path.join(tmpdir(),'trc-upload-'));try{const sketch=path.join(dir,'Sketch');await import('node:fs/promises').then(fs=>fs.mkdir(sketch));await import('node:fs/promises').then(fs=>fs.writeFile(path.join(sketch,'Sketch.ino'),code));const result=await run(process.env.ARDUINO_CLI_BIN||'arduino-cli',['upload','-p',port,'--fqbn',process.env.ARDUINO_FQBN||'arduino:avr:uno',sketch]);res.json({uploaded:true,output:result.stdout+result.stderr})}finally{await rm(dir,{recursive:true,force:true})}}catch(e){res.status(400).json({uploaded:false,error:e.message})}})
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Serverda kutilmagan xatolik'})})
app.listen(PORT,()=>console.log(`TexnoRoboCAD API: http://localhost:${PORT}`))

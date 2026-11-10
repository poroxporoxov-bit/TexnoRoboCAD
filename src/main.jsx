import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import './style.css'

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://texnorobocad-api.onrender.com' : 'http://localhost:4000')).replace(/\/$/, '')

const sections = [
  ['home','Bosh sahifa','⌂'], ['integrations','Real integratsiya','⚙'], ['cad','3D CAD Studio','◇'], ['robo','RoboLab','◉'],
  ['arduino','Arduino UNO','▦'], ['electro','ElectroLab','ϟ'], ['blocks','Blokli dasturlash','▤'],
  ['ai','AI 3D Design','✧'], ['class','Sinf kabineti','♙'], ['edu','EduCenter','▧'], ['projects','Loyihalarim','▣']
]

function CADStudio() {
  const mount = useRef(null), sceneRef = useRef(null), objects = useRef([])
  const [color, setColor] = useState('#16a8ff')
  const [count, setCount] = useState(0)
  useEffect(() => {
    const el = mount.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b1730')
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, .1, 100)
    camera.position.set(5, 4, 7)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xb8dcff, 0x17213c, 2))
    const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(4, 8, 5); scene.add(light)
    const grid = new THREE.GridHelper(12, 24, 0x2a69a8, 0x1b3558); scene.add(grid)
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6,.35,1.8), new THREE.MeshStandardMaterial({color:'#173d70', metalness:.45, roughness:.35}))
    base.position.y = .18; scene.add(base); objects.current.push(base)
    const wheelGeo = new THREE.CylinderGeometry(.35,.35,.22,32)
    ;[-1,1].forEach(x => [-.7,.7].forEach(z => {
      const w = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({color:'#111827', roughness:.8}))
      w.rotation.z = Math.PI/2; w.position.set(x*1.22,.35,z); scene.add(w); objects.current.push(w)
    }))
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.15,.65,.9), new THREE.MeshStandardMaterial({color:'#16a8ff', metalness:.3, roughness:.3}))
    top.position.y=.65; scene.add(top); objects.current.push(top)
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(.22,24,16), new THREE.MeshStandardMaterial({color:'#7c5cff', emissive:'#26165e'}))
    sensor.position.set(0,1.15,.1); scene.add(sensor); objects.current.push(sensor)
    let frame
    const animate = () => { frame=requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera) }
    animate()
    const resize = () => { camera.aspect=el.clientWidth/el.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth,el.clientHeight) }
    window.addEventListener('resize',resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize',resize); controls.dispose(); renderer.dispose(); el.removeChild(renderer.domElement) }
  }, [])
  const addShape = (kind) => {
    const scene=sceneRef.current; if(!scene) return
    const geo = kind==='sphere' ? new THREE.SphereGeometry(.48,32,24) : kind==='cone' ? new THREE.ConeGeometry(.48,.9,32) : new THREE.BoxGeometry(.85,.85,.85)
    const mesh = new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.35}))
    mesh.position.set((Math.random()-.5)*2, .8+Math.random(), (Math.random()-.5)*2)
    scene.add(mesh); objects.current.push(mesh); setCount(c=>c+1)
  }
  const save = async () => {
    const data = {name:'Mening robotim', shapes:objects.current.length, color, savedAt:new Date().toISOString()}
    localStorage.setItem('trc-project',JSON.stringify(data));
    try {
      const token=localStorage.getItem('trc-token')
      if(!token) throw new Error('Bulutga saqlash uchun avval Real integratsiya bo‘limida hisobga kiring.')
      const r=await fetch(API_BASE+'/api/projects',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({title:data.name,kind:'cad',data})})
      const result=await r.json()
      if(!r.ok)throw new Error(result.error||'API xatosi')
      alert('Loyiha server va ma’lumotlar bazasiga saqlandi!')
    } catch(e) { alert('Loyiha qurilmada saqlandi. Bulutga saqlash: '+e.message) }
  }
  const exportSTL = () => {
    const exporter = new STLExporter()
    const output = exporter.parse(sceneRef.current,{binary:true})
    const blob = new Blob([output],{type:'application/octet-stream'})
    const url=URL.createObjectURL(blob), a=document.createElement('a')
    a.href=url; a.download='texnorobocad-loyiha.stl'; a.click(); URL.revokeObjectURL(url)
  }
  return <div className="studio">
    <div className="studio-toolbar">
      <div><b>3D ish maydoni</b><small>Modelni sichqoncha bilan aylantiring</small></div>
      <span className="live-dot">● 3D FAOL</span>
    </div>
    <div className="viewport" ref={mount}></div>
    <div className="tool-row">
      <button onClick={()=>addShape('box')}>＋ Kub</button><button onClick={()=>addShape('sphere')}>＋ Shar</button><button onClick={()=>addShape('cone')}>＋ Konus</button>
      <label className="colorpick">Rang <input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
    </div>
    <div className="studio-footer"><span>{count} ta qo‘shimcha shakl</span><div><button className="secondary" onClick={save}>Saqlash</button><button className="primary" onClick={exportSTL}>STL eksport</button></div></div>
  </div>
}


function RoboSimulator() {
  const [pos,setPos]=useState({x:2,y:2})
  const [angle,setAngle]=useState(0)
  const [running,setRunning]=useState(false)
  const [log,setLog]=useState(['Robot tizimga ulandi. Boshqaruvga tayyor.'])
  const [obstacles,setObstacles]=useState([[4,2],[4,3],[1,5],[6,5]])
  const addLog=(message)=>setLog(old=>[message,...old].slice(0,5))
  const move=(dx,dy,label)=>{
    const nx=pos.x+dx, ny=pos.y+dy
    if(nx<0||nx>7||ny<0||ny>7){addLog('Chegara: robot maydon tashqarisiga chiqa olmaydi.');return}
    if(obstacles.some(([x,y])=>x===nx&&y===ny)){addLog('To‘siq aniqlandi! Harakat to‘xtatildi.');return}
    setPos({x:nx,y:ny});setAngle(dx===1?90:dx===-1?270:dy===1?180:0);addLog('Robot '+label+' harakatlandi.')
  }
  const reset=()=>{setPos({x:2,y:2});setAngle(0);setRunning(false);addLog('Robot boshlang‘ich nuqtaga qaytdi.')}
  const toggleObstacle=(x,y)=>setObstacles(old=>old.some(p=>p[0]===x&&p[1]===y)?old.filter(p=>p[0]!==x||p[1]!==y):[...old,[x,y]])
  return <div className="sim-layout">
    <section className="sim-panel">
      <div className="sim-head"><div><b>Virtual robot maydoni</b><small>Katakni tanlab to‘siq qo‘shing yoki olib tashlang</small></div><span className="status-pill">● SIMULYATOR</span></div>
      <div className="robot-grid" role="grid" aria-label="Robot harakat maydoni">
        {Array.from({length:64},(_,i)=>{const x=i%8,y=Math.floor(i/8),isRobot=pos.x===x&&pos.y===y,isObstacle=obstacles.some(p=>p[0]===x&&p[1]===y);return <button key={i} className={'robot-cell '+(isRobot?'robot-here ':'')+(isObstacle?'obstacle':'')} onClick={()=>toggleObstacle(x,y)} title="To‘siq qo‘shish yoki olib tashlash">{isRobot?<span style={{transform:`rotate(${angle}deg)`}}>🤖</span>:isObstacle?'▧':''}</button>})}
      </div>
      <div className="sim-legend"><span>🤖 Robot</span><span>▧ To‘siq</span><span>Bo‘sh katak</span></div>
    </section>
    <aside className="sim-panel control-panel">
      <b>Robot boshqaruvi</b><p className="muted">Harakat tugmalari orqali robotni boshqaring.</p>
      <div className="dpad"><span></span><button onClick={()=>move(0,-1,'yuqoriga')}>↑</button><span></span><button onClick={()=>move(-1,0,'chapga')}>←</button><button className="stop" onClick={reset}>■</button><button onClick={()=>move(1,0,'o‘ngga')}>→</button><span></span><button onClick={()=>move(0,1,'pastga')}>↓</button><span></span></div>
      <div className="robot-stats"><div><small>X koordinata</small><b>{pos.x}</b></div><div><small>Y koordinata</small><b>{pos.y}</b></div><div><small>Holat</small><b>{running?'Faol':'Tayyor'}</b></div></div>
      <button className="primary full" onClick={()=>{setRunning(!running);addLog(!running?'Avtomatik rejim yoqildi.':'Avtomatik rejim to‘xtatildi.')}}>{running?'Avtomatik rejimni to‘xtatish':'Avtomatik rejimni yoqish'}</button>
      <div className="event-log"><b>Harakatlar jurnali</b>{log.map((l,i)=><p key={i}>{l}</p>)}</div>
    </aside>
  </div>
}

function ElectroSimulator() {
  const [supply,setSupply]=useState(5)
  const [resistance,setResistance]=useState(220)
  const [enabled,setEnabled]=useState(true)
  const [ledColor,setLedColor]=useState('#ff405e')
  const [saved,setSaved]=useState(false)
  const [wireFrom,setWireFrom]=useState('UNO 5V')
  const [wireTo,setWireTo]=useState('Rezistor')
  const [wires,setWires]=useState([['UNO 5V','Rezistor'],['Rezistor','LED anod'],['LED katod','GND']])
  const endpoints=['UNO 5V','UNO GND','UNO D13','Rezistor','LED anod','LED katod','Breadboard +','Breadboard −']
  const addWire=()=>{if(wireFrom===wireTo)return;setWires(v=>[...v,[wireFrom,wireTo]])}
  const forward=2
  const current=enabled?Math.max(0,(supply-forward)/resistance*1000):0
  const safe=current>5&&current<25
  const status=!enabled?'O‘chirilgan':current>=25?'Tok yuqori — rezistorni oshiring':current<=0?'Tok yetarli emas':'LED ishlayapti'
  const persist=()=>{localStorage.setItem('trc-electro',JSON.stringify({supply,resistance,enabled,ledColor}));setSaved(true)}
  return <div className="electro-layout">
    <section className="sim-panel circuit-panel">
      <div className="sim-head"><div><b>Arduino LED zanjiri</b><small>Oddiy DC zanjirining interaktiv modeli</small></div><span className="status-pill">● LIVE</span></div>
      <div className="circuit-stage">
        <div className="arduino-board"><div className="arduino-label">ARDUINO UNO</div><div className="usb-port"></div><div className="chip"></div><div className="pin-row">● ● ● ● ● ● ● ●</div></div>
        <div className="wire wire-top"></div><div className="wire wire-bottom"></div>
        <div className="resistor"><span>R</span><b>{resistance} Ω</b></div>
        <div className={'led '+(enabled&&current>0?'led-on':'')} style={{'--led-color':ledColor}}><span></span><b>LED</b></div>
        <div className="circuit-caption">5V → Rezistor → LED → GND</div>
      </div>
      <div className="circuit-status"><span className={enabled&&current>0?'good-dot':'warn-dot'}></span><b>{status}</b></div>
      <div className="wire-editor"><div className="sim-head"><div><b>Virtual ulanishlar</b><small>Komponent pinlarini tanlab sim ulang</small></div><span className="status-pill">{wires.length} sim</span></div>
        <div className="wire-controls"><select value={wireFrom} onChange={e=>setWireFrom(e.target.value)}>{endpoints.map(x=><option key={x}>{x}</option>)}</select><span>→</span><select value={wireTo} onChange={e=>setWireTo(e.target.value)}>{endpoints.map(x=><option key={x}>{x}</option>)}</select><button className="primary" onClick={addWire}>Ulash</button></div>
        <div className="wire-list">{wires.map((w,i)=><div key={i}><span>━</span>{w[0]} → {w[1]}<button onClick={()=>setWires(v=>v.filter((_,j)=>j!==i))}>×</button></div>)}</div>
      </div>
    </section>
    <aside className="sim-panel settings-panel">
      <b>Elektr parametrlar</b>
      <label className="range-label">Kuchlanish <strong>{supply.toFixed(1)} V</strong></label>
      <input type="range" min="3" max="12" step=".5" value={supply} onChange={e=>setSupply(Number(e.target.value))}/>
      <label className="range-label">Qarshilik <strong>{resistance} Ω</strong></label>
      <input type="range" min="100" max="1000" step="10" value={resistance} onChange={e=>setResistance(Number(e.target.value))}/>
      <label className="range-label">LED rangi</label>
      <div className="swatches">{['#ff405e','#35d5ff','#57e69b','#ffd05b'].map(c=><button key={c} style={{background:c}} className={ledColor===c?'chosen':''} onClick={()=>setLedColor(c)} aria-label="LED rangini tanlash"/>)}</div>
      <div className="switch-row"><div><b>Elektr manbai</b><small>Zanjirni yoqish yoki o‘chirish</small></div><button className={'toggle '+(enabled?'on':'')} onClick={()=>setEnabled(!enabled)}>{enabled?'ON':'OFF'}</button></div>
      <div className="meter"><small>Hisoblangan tok</small><strong>{current.toFixed(1)} mA</strong><span>{safe?'Tavsiya etilgan diapazon: 5–20 mA':'Tok qiymatini xavfsiz diapazonga sozlang.'}</span></div>
      <button className="primary full" onClick={persist}>Sozlamalarni saqlash</button>{saved&&<p className="success-note">Tajriba sozlamalari ushbu qurilmada saqlandi.</p>}
    </aside>
  </div>
}



const arduinoModules = [
  {name:'HC-SR04 ultratovush',pins:'VCC → 5V · GND → GND · TRIG → D9 · ECHO → D10',note:'ECHO 5V signal; UNO bilan bevosita mos.'},
  {name:'DHT11 harorat/namlik',pins:'VCC → 5V · GND → GND · DATA → D2',note:'DATA piniga 10 kΩ pull-up rezistor tavsiya etiladi (modul platada bo‘lishi mumkin).'},
  {name:'SG90 servo',pins:'Signal → D3 · VCC → tashqi 5V · GND → umumiy GND',note:'Servoni UNO 5V pinidan quvvatlantirmang; alohida 5V manba ishlating.'},
  {name:'DC motor + L298N',pins:'IN1 → D6 · IN2 → D7 · IN3 → D8 · IN4 → D9 · ENA/ENB → PWM pinlar',note:'Motor quvvati alohida manbadan; L298N GND va UNO GND umumiy bo‘lsin.'},
  {name:'LCD1602 I²C',pins:'VCC → 5V · GND → GND · SDA → A4 · SCL → A5',note:'I²C manzil odatda 0x27 yoki 0x3F; modulga qarab tekshiring.'},
  {name:'RFID RC522',pins:'3.3V → 3.3V · GND → GND · SDA/SS → D10 · SCK → D13 · MOSI → D11 · MISO → D12 · RST → D9',note:'Faqat 3.3V! RC522 kirishlari 5V tolerant emas; zarur bo‘lsa level shifter ishlating.'},
  {name:'Bluetooth HC-05',pins:'VCC → modul talabiga mos · GND → GND · TXD → D2 · RXD ← D3 (kuchlanish bo‘luvchi bilan)',note:'RXD liniyasiga 5V dan 3.3V ga rezistor bo‘luvchi qo‘ying; USB Serial D0/D1 bilan to‘qnashuv kamayadi.'},
  {name:'Wi‑Fi ESP8266',pins:'VCC/CH_PD → barqaror 3.3V · GND → GND · TX/RX → mos UART',note:'ESP8266 tok cho‘qqilari yuqori; UNO 3.3V pinidan quvvat bermang. Alohida 3.3V regulyator va level shifter ishlating.'},
]
function ArduinoWiringLibrary() {
  const [expanded,setExpanded]=useState(0)
  return <section className="sim-panel" style={{marginTop:18}}>
    <div className="sim-head"><div><b>Arduino qo‘shimcha qurilmalar kutubxonasi</b><small>Pinlar, quvvat va xavfsiz ulanish tavsiyalari</small></div><span className="status-pill">8 MODUL</span></div>
    <div className="module-wiring-grid">
      {arduinoModules.map((m,i)=><article className="module-wiring-card" key={m.name}>
        <button className="module-wiring-toggle" onClick={()=>setExpanded(expanded===i?-1:i)}><b>{m.name}</b><span>{expanded===i?'−':'+'}</span></button>
        {expanded===i&&<div className="module-wiring-details"><p>{m.pins}</p><small>{m.note}</small></div>}
      </article>)}
    </div>
    <p className="demo-warning">Diqqat: bu pin xaritalari alohida modul ulanishlari uchun. Bir nechta modulni bir vaqtda ulashdan oldin pin to‘qnashuvlarini tekshiring. Motor va servo uchun mos tashqi quvvat manbai, umumiy GND va zarur himoya elementlaridan foydalaning.</p>
  </section>
}

function ArduinoSimulator() {
  const [pins,setPins]=useState({13:true,12:false,11:false,10:false,9:false,8:false})
  const [mode,setMode]=useState('OUTPUT')
  const [serial,setSerial]=useState(['Arduino UNO virtual platasi ishga tayyor.'])
  const [code,setCode]=useState('void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}')
  const [serialPort,setSerialPort]=useState('')
  const [device,setDevice]=useState(null)
  const [reader,setReader]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [serialInput,setSerialInput]=useState('')
  const log=m=>setSerial(s=>[m,...s].slice(0,6))
  const toggle=pin=>{setPins(v=>({...v,[pin]:!v[pin]}));log(`D${pin} pin holati o‘zgartirildi.`)}
  const run=()=>{log('Virtual demo: kod apparatga yuklanmadi.');setPins(v=>({...v,13:!v[13]}))}
  const connectSerial=async()=>{try{if(!('serial' in navigator))throw new Error('Web Serial API qo‘llab-quvvatlanmaydi. Chrome yoki Edge va HTTPS/localhost ishlating.');const p=await navigator.serial.requestPort();await p.open({baudRate:9600});setDevice(p);log('Arduino USB Serial portiga ulandi (9600 baud).');const rd=p.readable.getReader();setReader(rd);(async()=>{try{while(true){const {value,done}=await rd.read();if(done)break;if(value)log(new TextDecoder().decode(value).trim())}}catch(e){log('Serial o‘qish: '+e.message)}})()}catch(e){log('Ulanish xatosi: '+e.message)}}
  const disconnectSerial=async()=>{try{if(device){if(reader){await reader.cancel().catch(()=>{});reader.releaseLock();setReader(null)}await device.close();setDevice(null);log('Arduino serial aloqasi uzildi.')}}catch(e){log(e.message)}}
  const sendSerial=async()=>{try{if(!device)throw new Error('Avval Arduino qurilmasiga ulaning.');const writer=device.writable.getWriter();await writer.write(new TextEncoder().encode(serialInput+'\n'));writer.releaseLock();log('Yuborildi: '+serialInput);setSerialInput('')}catch(e){log('Serial xato: '+e.message)}}
  const uploadSketch=async()=>{setUploading(true);try{const token=localStorage.getItem('trc-token');if(!token)throw new Error('Avval Real integratsiya sahifasida hisobga kiring.');if(!serialPort.trim())throw new Error('USB port nomini kiriting (masalan COM4 yoki /dev/ttyACM0).');const api=import.meta.env.VITE_API_URL||'';const r=await fetch(api+'/api/arduino/upload',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({code,port:serialPort.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Yuklash xatosi');log('Haqiqiy Arduino upload muvaffaqiyatli yakunlandi.');log(d.output||'Yuklash yakunlandi.')}catch(e){log('Upload: '+e.message)}finally{setUploading(false)}}
  return <><div className="arduino-layout">
    <section className="sim-panel"><div className="sim-head"><div><b>Arduino UNO R3</b><small>Virtual panel + haqiqiy USB Serial ulanish</small></div><span className="status-pill">{device?'● USB ULANDI':'● READY'}</span></div><div className="arduino-actions"><button className="secondary" onClick={device?disconnectSerial:connectSerial}>{device?'USB uzish':'USB Arduino ulash'}</button><input className="form-field" placeholder="COM4 yoki /dev/ttyACM0" value={serialPort} onChange={e=>setSerialPort(e.target.value)}/><button className="primary" onClick={uploadSketch} disabled={uploading}>{uploading?'Yuklanmoqda…':'Haqiqiy plataga kod yozish'}</button></div>
      <div className="uno-board"><div className="uno-usb">USB</div><div className="uno-title">ARDUINO <b>UNO</b></div><div className="uno-chip">ATmega<br/>328P</div><div className="uno-power">POWER</div><div className="uno-led" style={{background:pins[13]?'#ff4545':'#5d6472',boxShadow:pins[13]?'0 0 16px #ff4545':'none'}}></div>
      <div className="pin-bank digital"><b> DIGITAL (PWM ~)</b>{[13,12,11,10,9,8,7,6,5,4,3,2,1,0].map(n=><button key={n} className={pins[n]?'pin-active':''} onClick={()=>toggle(n)} title={`D${n}`}>{n}</button>)}</div>
      <div className="pin-bank analog"><b> ANALOG IN</b>{['A0','A1','A2','A3','A4','A5'].map(n=><button key={n} onClick={()=>log(`${n}: analog kirish qiymati 0 (demo).`)}>{n}</button>)}</div>
      <div className="uno-label-bottom">UNO R3 · DIGITAL I/O · ANALOG IN · POWER</div></div>
      <div className="pin-state-list">{[13,12,11,10,9,8].map(n=><button key={n} onClick={()=>toggle(n)}><span className={pins[n]?'pin-indicator on':'pin-indicator'}></span>D{n}<b>{pins[n]?'HIGH':'LOW'}</b></button>)}</div>
    </section>
    <section className="sim-panel code-panel"><div className="sim-head"><div><b>Arduino sketch</b><small>Namuna kodni tahrirlang</small></div><span className="status-pill">C++</span></div>
      <textarea className="arduino-code" value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/>
      <div className="arduino-actions"><button className="secondary" onClick={()=>{setCode('void setup() {\\n  pinMode(13, OUTPUT);\\n}\\nvoid loop() {\\n  digitalWrite(13, HIGH);\\n  delay(1000);\\n}') ;log('Blink namunasi yuklandi.')}}>Blink namunasi</button><button className="primary" onClick={run}>▶ Ishga tushirish</button></div>
      <div className="arduino-actions"><input className="form-field" placeholder="Serial buyruq yoki matn" value={serialInput} onChange={e=>setSerialInput(e.target.value)}/><button className="secondary" onClick={sendSerial} disabled={!device}>Serial yuborish</button></div><div className="event-log"><b>Serial monitor / Konsol</b>{serial.map((s,i)=><p key={i}>{s}</p>)}</div>
    </section>
  </div><ArduinoWiringLibrary/></>
}

const blockLibrary=[
  {id:'start',label:'Boshlash',color:'gold',code:'when_start'}, {id:'forward',label:'Oldinga yur (1 qadam)',color:'blue',code:'move_forward'},
  {id:'left',label:'Chapga buril',color:'purple',code:'turn_left'}, {id:'right',label:'O‘ngga buril',color:'purple',code:'turn_right'},
  {id:'wait',label:'Kutish (1 soniya)',color:'orange',code:'wait'}, {id:'led',label:'LEDni yoqish',color:'green',code:'led_on'},
  {id:'repeat',label:'2 marta takrorla',color:'pink',code:'repeat_2'}
]
function BlockCoding() {
  const [blocks,setBlocks]=useState([{...blockLibrary[0],uid:1},{...blockLibrary[1],uid:2},{...blockLibrary[2],uid:3},{...blockLibrary[5],uid:4}])
  const [robotStep,setRobotStep]=useState(0)
  const [output,setOutput]=useState('Dastur tayyor. “Ishga tushirish” tugmasini bosing.')
  const add=b=>setBlocks(v=>[...v,{...b,uid:Date.now()+Math.random()}])
  const run=()=>{const moves=blocks.filter(b=>['forward','left','right'].includes(b.id)).length;setRobotStep(v=>(v+moves)%8);setOutput(`Dastur bajarildi: ${blocks.length} blok tekshirildi. Robot ${moves} ta harakat buyrug‘ini bajardi.`)}
  return <div className="blocks-layout"><section className="sim-panel"><div className="sim-head"><div><b>Bloklar kutubxonasi</b><small>Blok ustiga bosing — dasturga qo‘shiladi</small></div></div><div className="block-library">{blockLibrary.map(b=><button key={b.id} className={'code-block '+b.color} onClick={()=>add(b)}>＋ {b.label}</button>)}</div><div className="block-hint">Maslahat: bloklarni qo‘shib, ketma-ketlikni pastdagi dastur maydonida tuzing.</div></section>
  <section className="sim-panel"><div className="sim-head"><div><b>Mening dasturim</b><small>{blocks.length} ta blok</small></div><button className="secondary" onClick={()=>setBlocks([])}>Tozalash</button></div><div className="workspace-blocks">{blocks.map((b,i)=><div key={b.uid} className={'workspace-block '+b.color}><span>{i+1}</span>{b.label}<button onClick={()=>setBlocks(v=>v.filter(x=>x.uid!==b.uid))}>×</button></div>)}</div><div className="block-run-row"><button className="primary" onClick={run}>▶ Ishga tushirish</button><button className="secondary" onClick={()=>{setRobotStep(0);setOutput('Robot boshlang‘ich holatga qaytdi.')}}>↺ Qayta tiklash</button></div><div className="mini-robot-stage"><div className="mini-track">{Array.from({length:8},(_,i)=><span key={i} className={i===robotStep?'current':''}>{i===robotStep?'🤖':''}</span>)}</div></div><p className="success-note">{output}</p></section></div>
}

function AIDesign() {
  const [prompt,setPrompt]=useState('To‘rt g‘ildirakli kichik robot shassisi, sensor uchun ustun bilan')
  const [kind,setKind]=useState('robot')
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('Haqiqiy AI 3D yaratish uchun hisobga kiring va serverda OpenAI kaliti hamda OpenSCAD sozlangan bo‘lishi kerak.')
  const generate=async()=>{
    setBusy(true);setNotice('AI 3D model yaratilmoqda…')
    try {
      const token=localStorage.getItem('trc-token')
      if(!token)throw new Error('Avval Real integratsiya sahifasida hisob yarating yoki tizimga kiring.')
      const r=await fetch(API_BASE+'/api/ai3d/generate',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({prompt,kind})})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'AI xizmatida xatolik')
      const bytes=Uint8Array.from(atob(d.stlBase64),c=>c.charCodeAt(0))
      const url=URL.createObjectURL(new Blob([bytes],{type:'model/stl'}))
      const a=document.createElement('a');a.href=url;a.download=d.filename||'texnorobocad-model.stl';a.click();URL.revokeObjectURL(url)
      setNotice('Haqiqiy STL model yaratildi va yuklab olindi ('+d.bytes+' bayt).')
    } catch(e) { setNotice(e.message) } finally { setBusy(false) }
  }
  return <><div className="page-heading"><div><div className="eyebrow">AI YORDAMIDA LOYIHALASH</div><h1>AI 3D Design</h1><p>Matnli tavsifdan OpenSCAD yordamida STL model yarating.</p></div><div className="module-symbol">✧</div></div>
    <div className="ai-layout"><section className="sim-panel"><b>G‘oyangizni tavsiflang</b><textarea className="ai-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)}/><label className="range-label">Model turi</label><div className="ai-types"><button className={kind==='robot'?'selected':''} onClick={()=>setKind('robot')}>🤖 Robot shassisi</button><button className={kind==='box'?'selected':''} onClick={()=>setKind('box')}>▣ Elektronika qutisi</button><button className={kind==='disc'?'selected':''} onClick={()=>setKind('disc')}>◉ G‘ildirak / disk</button></div><button className="primary full" onClick={generate} disabled={busy||!prompt.trim()}>{busy?'Yaratilmoqda…':'✧ Haqiqiy AI 3D model yaratish'}</button><p className="demo-warning">{notice}</p></section>
    <section className="sim-panel ai-preview"><div className="sim-head"><div><b>3D model natijasi</b><small>STL fayl</small></div><span className="status-pill">OpenSCAD</span></div><div className={'ai-object '+kind}>{kind==='robot'?'🤖':kind==='box'?'▣':'◉'}</div><p className="muted">{prompt}</p></section></div></>
}

function Classroom() {
  const [role,setRole]=useState('student')
  const [name,setName]=useState('Ali Valiyev')
  const [group,setGroup]=useState('Robototexnika — 7-A')
  const [tasks,setTasks]=useState([{title:'LED zanjirini yig‘ish',done:true},{title:'Robot yo‘nalishini dasturlash',done:false},{title:'3D detal chizish',done:false}])
  const [notice,setNotice]=useState('')
  return <><div className="page-heading"><div><div className="eyebrow">TA’LIM BOSHQARUVI</div><h1>Sinf kabineti</h1><p>O‘quvchi va o‘qituvchi uchun yagona demo kabinet.</p></div><div className="module-symbol">♙</div></div>
    <div className="sim-panel classroom-top"><div><b>Foydalanuvchi rolini tanlang</b><small>Bu prototipda rollar brauzer ichida almashadi.</small></div><div className="role-switch"><button className={role==='student'?'selected':''} onClick={()=>setRole('student')}>O‘quvchi</button><button className={role==='teacher'?'selected':''} onClick={()=>setRole('teacher')}>O‘qituvchi</button></div></div>
    <div className="classroom-grid"><section className="sim-panel"><div className="profile-line"><div className="avatar large-avatar">{role==='student'?'AV':'TR'}</div><div><b>{role==='student'?'O‘quvchi kabineti':'O‘qituvchi kabineti'}</b><small>{role==='student'?'Shaxsiy o‘quv jarayoningiz':'Sinf va topshiriqlar boshqaruvi'}</small></div></div><label className="range-label">Ism</label><input className="form-field" value={name} onChange={e=>setName(e.target.value)}/><label className="range-label">Guruh / sinf</label><input className="form-field" value={group} onChange={e=>setGroup(e.target.value)}/><div className="class-metrics"><div><b>{tasks.filter(t=>t.done).length}/{tasks.length}</b><small>Bajarilgan topshiriq</small></div><div><b>{role==='teacher'?'18':'72%'}</b><small>{role==='teacher'?'Sinf o‘quvchilari':'O‘zlashtirish'}</small></div></div></section>
    <section className="sim-panel"><div className="sim-head"><div><b>{role==='teacher'?'Topshiriqlarni boshqarish':'Mening topshiriqlarim'}</b><small>{role==='teacher'?'Topshiriq holatini belgilang':'Bajarilgan ishlarni belgilang'}</small></div></div>{tasks.map((t,i)=><label className="task-row" key={t.title}><input type="checkbox" checked={t.done} onChange={()=>setTasks(v=>v.map((x,j)=>j===i?{...x,done:!x.done}:x))}/><span>{t.title}</span><small>{t.done?'Bajarildi':'Jarayonda'}</small></label>)}{role==='teacher'&&<button className="primary full" onClick={()=>setNotice('Topshiriqlar sinf uchun demo tarzida yangilandi.')}>Topshiriqlarni sinfga yuborish</button>}{notice&&<p className="success-note">{notice}</p>}</section></div>
    <p className="demo-warning">Muhim: haqiqiy akkauntlar, sinfga taklif havolasi, baholar va bulut sinxronizatsiyasi uchun backend hamda ma’lumotlar bazasi ulanishi kerak.</p>
  </>
}

function RealIntegrations() {
  const API = API_BASE
  const [token,setToken] = useState(localStorage.getItem('trc-token') || '')
  const [email,setEmail] = useState(''), [password,setPassword] = useState(''), [name,setName] = useState('')
  const [prompt,setPrompt] = useState('Arduino robot uchun 4 ta g‘ildirakli ixcham shassi, motor o‘rnatish joylari va batareya bo‘limi bilan')
  const [kind,setKind] = useState('robot'), [code,setCode] = useState('void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);\n}')
  const [ports,setPorts] = useState([]), [port,setPort] = useState(''), [message,setMessage] = useState(''), [busy,setBusy] = useState(false)
  const request = async (path,opts={}) => { const r=await fetch(API+path,{...opts,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(opts.headers||{})}}); const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`); return d }
  const login = async (register=false) => {setBusy(true);try{const d=await request(register?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify(register?{name,email,password}:{email,password})});setToken(d.token);localStorage.setItem('trc-token',d.token);setMessage('Serverga muvaffaqiyatli kirdingiz: '+d.user.name)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  const generate = async () => {setBusy(true);try{const d=await request('/api/ai3d/generate',{method:'POST',body:JSON.stringify({prompt,kind})});const bytes=Uint8Array.from(atob(d.stlBase64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'model/stl'}));const a=document.createElement('a');a.href=url;a.download=d.filename;a.click();URL.revokeObjectURL(url);setMessage(`AI 3D model tayyor: ${d.bytes} bayt STL. OpenSCAD orqali geometriya yaratildi.`)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  const loadPorts = async () => {setBusy(true);try{const d=await request('/api/arduino/ports');setPorts(d);if(d[0])setPort(d[0].path);setMessage(d.length?`${d.length} ta port topildi`:'Arduino porti topilmadi. Plata USB orqali server kompyuteriga ulanganini tekshiring.')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  const arduino = async (action) => {setBusy(true);try{const d=await request('/api/arduino/'+action,{method:'POST',body:JSON.stringify(action==='upload'?{code,port}:{code})});setMessage(action==='upload'?'Kod Arduino qurilmasiga yuborildi.':`Kompilyatsiya muvaffaqiyatli. ${d.output||''}`)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  const logout=()=>{setToken('');localStorage.removeItem('trc-token');setMessage('Hisobdan chiqildi')}
  return <><div className="page-heading"><div><div className="eyebrow">REAL INTEGRATSIYALAR</div><h1>AI, Arduino va Cloud</h1><p>Haqiqiy xizmatlar backend API orqali ulanadi. Server kompyuterida kerakli kalitlar va qurilmalar sozlangan bo‘lishi shart.</p></div><div className="module-symbol">⚙</div></div>
    <section className="sim-panel" style={{marginBottom:18}}><div className="sim-head"><div><b>Server holati</b><small>{API}</small></div><button className="secondary" onClick={async()=>{try{const d=await fetch(API+'/api/health').then(r=>r.json());setMessage(`API faol. AI kaliti: ${d.ai?'sozlangan':'sozlanmagan'}`)}catch(e){setMessage('Serverga ulanib bo‘lmadi: '+e.message)}}}>Tekshirish</button></div>
    <div className="sim-head"><div><b>Hisob va bulutli saqlash</b><small>PostgreSQL ma’lumotlar bazasiga JWT orqali xavfsiz kirish</small></div>{token&&<button className="secondary" onClick={logout}>Chiqish</button>}</div>
    {!token&&<><input className="form-field" placeholder="Ism (ro‘yxatdan o‘tishda)" value={name} onChange={e=>setName(e.target.value)}/><input className="form-field" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="form-field" type="password" placeholder="Parol (kamida 8 belgi)" value={password} onChange={e=>setPassword(e.target.value)}/><div className="tool-row"><button className="primary" disabled={busy} onClick={()=>login(true)}>Ro‘yxatdan o‘tish</button><button className="secondary" disabled={busy} onClick={()=>login(false)}>Kirish</button></div></>}
    {token&&<p className="success-note">Server sessiyasi faol. Loyihalarni API orqali saqlash va o‘qish mumkin.</p>}</section>
    <div className="classroom-grid"><section className="sim-panel"><div className="sim-head"><div><b>AI 3D generator</b><small>Matndan parametrik OpenSCAD va STL model</small></div><span className="status-pill">AI API</span></div><textarea className="ai-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)}/><select className="form-field" value={kind} onChange={e=>setKind(e.target.value)}><option value="robot">Robot shassisi</option><option value="box">Elektronika qutisi</option><option value="disc">G‘ildirak / disk</option></select><button className="primary full" disabled={!token||busy} onClick={generate}>✧ Haqiqiy 3D model yaratish va STL yuklash</button><p className="demo-warning">Talab: serverda OPENAI_API_KEY va OpenSCAD CLI o‘rnatilgan bo‘lishi kerak.</p></section>
    <section className="sim-panel"><div className="sim-head"><div><b>Arduino apparat ulanishi</b><small>USB port · Arduino CLI · UNO R3</small></div><span className="status-pill">USB</span></div><button className="secondary full" disabled={!token||busy} onClick={loadPorts}>USB portlarni topish</button><select className="form-field" value={port} onChange={e=>setPort(e.target.value)}><option value="">Port tanlang</option>{ports.map(p=><option key={p.path} value={p.path}>{p.path} {p.manufacturer}</option>)}</select><textarea className="ai-prompt" value={code} onChange={e=>setCode(e.target.value)}/><div className="tool-row"><button className="secondary" disabled={!token||busy} onClick={()=>arduino('compile')}>Kompilyatsiya</button><button className="primary" disabled={!token||!port||busy} onClick={()=>arduino('upload')}>Plataга yuklash</button></div><p className="demo-warning">Arduino USB kabel bilan backend ishlayotgan kompyuterga ulangan bo‘lishi va arduino-cli core install arduino:avr bajarilgan bo‘lishi kerak.</p></section></div>
    {message&&<p className="success-note" style={{marginTop:16,whiteSpace:'pre-wrap'}}>{message}</p>}
  </>
}


function App() {
  const [active,setActive]=useState('home')
  const [mobile,setMobile]=useState(false)
  const [installPrompt,setInstallPrompt]=useState(null)
  const [saved,setSaved]=useState(false)
  useEffect(()=>{const handler=e=>{e.preventDefault();setInstallPrompt(e)};window.addEventListener('beforeinstallprompt',handler);return()=>window.removeEventListener('beforeinstallprompt',handler)},[])
  const install=async()=>{if(installPrompt){installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null)}else alert('Brauzer menyusidan “Ilovani o‘rnatish” bandini tanlang.')}
  const title=sections.find(s=>s[0]===active)?.[1]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon">✦</div><div><b>TexnoRobo<span>CAD</span></b><small>Yarat. O‘rgan. Innovatsiya qil!</small></div></div>
      <div className="nav-label">ASOSIY MENYU</div>
      {sections.map(s=><button key={s[0]} className={'nav-item '+(active===s[0]?'active':'')} onClick={()=>setActive(s[0])}><i>{s[2]}</i>{s[1]}</button>)}
      <div className="sidebar-bottom"><div className="help-card"><b>Yordam kerakmi?</b><p>Texnologiya olamida birga o‘rganamiz.</p><button onClick={()=>setActive('edu')}>Darslarni ko‘rish ↗</button></div><small>TexnoRoboCAD v0.1 · Demo</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="hamburger" onClick={()=>setMobile(!mobile)}>☰</button><div className="crumb">Platforma <span>/</span> {title}</div><div className="top-actions"><input placeholder="Qidiruv..."/><button aria-label="Bildirishnomalar">♧</button><div className="avatar">TR</div></div></header>
      {mobile&&<div className="mobile-nav">{sections.map(s=><button key={s[0]} onClick={()=>{setActive(s[0]);setMobile(false)}}>{s[2]} {s[1]}</button>)}</div>}
      <div className="content">
        {active==='integrations'&&<RealIntegrations/>}
        {active==='home'&&<><section className="hero"><div className="hero-copy"><div className="eyebrow">✦ KELAJAK SHU YERDAN BOSHLANADI</div><h1>G‘oyangizni <em>haqiqiy</em><br/>loyihaga aylantiring.</h1><p>Robototexnika, elektronika, 3D dizayn va dasturlashni bitta platformada o‘rganing.</p><button className="primary big" onClick={()=>setActive('cad')}>Ishni boshlash <span>→</span></button></div><div className="hero-art"><div className="orb">🤖</div><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="floating f1">3D CAD</div><div className="floating f2">ROBO LAB</div><div className="floating f3">AI ✦</div></div></section>
        <div className="stats"><div><b>01</b><span>Yagona platforma</span></div><div><b>08</b><span>Ta’lim bo‘limi</span></div><div><b>24/7</b><span>O‘rganish imkoniyati</span></div><div><b>∞</b><span>Ijodiy imkoniyat</span></div></div>
        <div className="section-heading"><div><div className="eyebrow">O‘RGANISH VA YARATISH</div><h2>Laboratoriyalar</h2></div><span className="muted">O‘zingizga mos yo‘nalishni tanlang</span></div>
        <div className="feature-grid">{[['cad','◇','3D CAD Studio','3D modellarni yarating va loyihalang','blue'],['robo','◉','RoboLab','Robotlarni yig‘ing va boshqaring','purple'],['electro','ϟ','ElectroLab','Elektron sxemalarni sinab ko‘ring','cyan'],['code','⌘','CodeLab','Dasturlashni amaliy o‘rganing','orange'],['ai','✧','AI Design','Sun’iy intellekt bilan g‘oya yarating','pink'],['edu','▤','EduCenter','Kurslar, testlar va sertifikatlar','green']].map(c=><button className={'feature-card '+c[4]} key={c[0]} onClick={()=>setActive(c[0])}><div className="feature-icon">{c[1]}</div><h3>{c[2]}</h3><p>{c[3]}</p><span className="arrow">↗</span></button>)}</div></>}
        {active==='cad'&&<><div className="page-heading"><div><div className="eyebrow">LOYIHALASH MUHITI</div><h1>3D CAD Studio</h1><p>Shakllar qo‘shing, modelni aylantiring va STL formatida eksport qiling.</p></div><span className="status-pill">● Ishlayapti</span></div><CADStudio/></>}
        {active==='robo'&&<><div className="page-heading"><div><div className="eyebrow">ROBOTOTEXNIKA</div><h1>RoboLab</h1><p>Virtual robotni boshqaring, to‘siqlardan olib o‘ting va koordinatalarni kuzating.</p></div><div className="module-symbol">◉</div></div><RoboSimulator/></>}
        {active==='electro'&&<><div className="page-heading"><div><div className="eyebrow">ELEKTROTEXNIKA</div><h1>ElectroLab</h1><p>LED zanjirini sozlang, kuchlanish va qarshilikni o‘zgartiring, tokni kuzating.</p></div><div className="module-symbol">ϟ</div></div><ElectroSimulator/></>}
        {active==='arduino'&&<><div className="page-heading"><div><div className="eyebrow">MIKROKONTROLLER LABORATORIYASI</div><h1>Arduino UNO Simulator</h1><p>Virtual UNO platasida pin holatlarini kuzating va Blink kodini sinab ko‘ring.</p></div><div className="module-symbol">▦</div></div><ArduinoSimulator/></>}
        {active==='blocks'&&<><div className="page-heading"><div><div className="eyebrow">VIZUAL DASTURLASH</div><h1>Blokli dasturlash</h1><p>Buyruq bloklarini ketma-ket joylashtirib, robot harakatini rejalashtiring.</p></div><div className="module-symbol">▤</div></div><BlockCoding/></>}
        {active==='ai'&&<AIDesign/>}
        {active==='class'&&<Classroom/>}
        {active==='code'&&<Module title="CodeLab" eyebrow="DASTURLASH" icon="⌘" description="Blokli dasturlashdan Python va mikrokontroller kodlarigacha." items={['Algoritmlar va mantiq','Python asoslari','Arduino dasturlash','Robot harakatini kodlash']} action="Darsni boshlash"/>}
        {active==='edu'&&<Module title="EduCenter" eyebrow="TA’LIM MARKAZI" icon="▤" description="O‘quvchilar va o‘qituvchilar uchun mavzulashtirilgan kurslar, amaliy vazifalar va bilim tekshiruvi." items={['Boshlang‘ich robototexnika','Elektronika asoslari','3D modellashtirish','Dasturlash va algoritmlar']} action="Kurslarni ko‘rish"/>}
        {active==='projects'&&<div className="page-heading"><div><div className="eyebrow">SHAXSIY KUTUBXONA</div><h1>Loyihalarim</h1><p>Saqlangan loyihalaringiz shu yerda ko‘rinadi.</p></div></div>}
      </div>
    </main>
    <button className="install-fab" onClick={install}>⇩ Ilovani o‘rnatish</button>
  </div>
}

function Module({title,eyebrow,icon,description,items,action}) {
 const [opened,setOpened]=useState(false)
 return <><div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="module-symbol">{icon}</div></div><div className="module-layout"><div className="module-main"><div className="module-banner"><div className="banner-orb">{icon}</div><div><b>{title} laboratoriyasi</b><p>Amaliy bilim va ijodiy tajriba uchun maxsus muhit.</p></div></div><h2>O‘quv yo‘nalishlari</h2><div className="lesson-list">{items.map((it,i)=><div className="lesson" key={it}><span className="lesson-num">0{i+1}</span><b>{it}</b><span className="lesson-arrow">→</span></div>)}</div><button className="primary" onClick={()=>setOpened(!opened)}>{opened?'Mashg‘ulot tanlandi ✓':action}</button>{opened&&<p className="success-note">Ajoyib! Bu bo‘lim uchun o‘quv mashg‘uloti tanlandi. To‘liq dars kontenti keyingi bosqichda ulanadi.</p>}</div><aside className="side-note"><div className="eyebrow">TEXNOROBO MASLAHAT</div><h3>Har kuni yangi narsa yarating.</h3><p>Kichik tajribalar katta ixtirolarga olib keladi.</p><div className="note-art">✦</div></aside></div></>
}

createRoot(document.getElementById('root')).render(<App/>)

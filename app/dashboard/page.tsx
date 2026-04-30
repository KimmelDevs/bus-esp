'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useMqttScan } from '@/lib/useMqttScan'

type Stats = { users: number; transactions: number; income: number }
type Tx = { id: string; rfid_uid: string; status: string; amount: number; balance_after: number; created_at: string; users?: { name: string; type: string } }
type User = { id: string; name: string; rfid_uid: string; balance: number; type: string; created_at: string }

type LiveEvent = {
  id: string
  rfid_uid: string
  name: string
  type: string
  status: 'APPROVED' | 'INSUFFICIENT' | 'NOT FOUND' | 'PROCESSING' | 'COOLDOWN'
  amount: number
  balance_after: number
  ts: number
}

const SCAN_COOLDOWN_MS = 5000

function StatCard({ label, value, unit, color, icon, sub }: {
  label: string; value: string | number; unit?: string; color: string; icon: React.ReactNode; sub?: string
}) {
  return (
    <div style={{ background:'var(--white)',border:'1px solid var(--border)',borderRadius:14,padding:'22px 24px',boxShadow:'var(--shadow-sm)',display:'flex',flexDirection:'column',gap:8,transition:'box-shadow 0.2s,transform 0.2s',cursor:'default',position:'relative',overflow:'hidden' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-md)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-sm)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)'}}>
      <div style={{position:'absolute',top:0,right:0,width:90,height:90,background:color,opacity:0.06,borderRadius:'0 14px 0 100%'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{width:38,height:38,borderRadius:10,background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,boxShadow:`0 2px 8px ${color}55`}}>{icon}</div>
        {sub&&<span style={{fontSize:10,color:'var(--success)',background:'var(--success-bg)',padding:'3px 8px',borderRadius:99,fontWeight:700}}>{sub}</span>}
      </div>
      <div>
        <div style={{fontSize:28,fontWeight:800,color:'var(--text)',lineHeight:1.1,fontFamily:'var(--font-mono)'}}>{value}</div>
        {unit&&<div style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{unit}</div>}
      </div>
      <div style={{fontSize:12,color:'var(--text-mid)',fontWeight:600}}>{label}</div>
    </div>
  )
}

function statusColor(s:string){if(s==='APPROVED')return'var(--success)';if(s==='TOPUP')return'var(--royal)';if(s==='INSUFFICIENT')return'var(--warning)';if(s==='PROCESSING')return'#a855f7';if(s==='COOLDOWN')return'#64748b';return'var(--danger)'}
function statusBg(s:string){if(s==='APPROVED')return'var(--success-bg)';if(s==='TOPUP')return'var(--royal-subtle)';if(s==='INSUFFICIENT')return'var(--warning-bg)';if(s==='PROCESSING')return'#f3e8ff';if(s==='COOLDOWN')return'#f1f5f9';return'var(--danger-bg)'}
function statusIcon(s:string){if(s==='APPROVED')return'✅';if(s==='INSUFFICIENT')return'⚠️';if(s==='NOT FOUND')return'❓';if(s==='PROCESSING')return'⏳';if(s==='COOLDOWN')return'🔒';return'❌'}

function MqttDot({status}:{status:string}){
  const color=status==='connected'?'#22c55e':status==='connecting'?'#f59e0b':'#ef4444'
  const label=status==='connected'?'LIVE':status==='connecting'?'CONNECTING':'OFFLINE'
  return(
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',background:color+'15',borderRadius:99,border:`1px solid ${color}44`}}>
      <div style={{width:7,height:7,borderRadius:'50%',background:color,boxShadow:status==='connected'?`0 0 6px ${color}`:'none'}}/>
      <span style={{fontSize:10,fontWeight:700,color,fontFamily:'var(--font-mono)',letterSpacing:'0.08em'}}>{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [stats,setStats]=useState<Stats>({users:0,transactions:0,income:0})
  const [recent,setRecent]=useState<Tx[]>([])
  const [users,setUsers]=useState<User[]>([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<'transactions'|'users'>('transactions')
  const [liveEvents,setLiveEvents]=useState<LiveEvent[]>([])
  const [currentEvent,setCurrentEvent]=useState<LiveEvent|null>(null)
  const processingRef=useRef(false)
  const cooldownRef=useRef<Map<string,number>>(new Map())
  const {lastScan,status:mqttStatus,clearScan}=useMqttScan()

  const loadStats=useCallback(async()=>{
    const [usersRes,txRes,txAllRes]=await Promise.all([
      supabase.from('users').select('*').order('created_at',{ascending:false}),
      supabase.from('transactions').select('*, users(name, type)').order('created_at',{ascending:false}).limit(8),
      supabase.from('transactions').select('amount').eq('status','APPROVED'),
    ])
    const income=(txAllRes.data??[]).reduce((sum:number,t:any)=>sum+Number(t.amount),0)
    setUsers(usersRes.data??[])
    setStats({users:usersRes.data?.length??0,transactions:txRes.data?.length??0,income})
    setRecent(txRes.data??[])
    setLoading(false)
  },[])

  useEffect(()=>{loadStats()},[loadStats])

  useEffect(()=>{
    if(!lastScan||processingRef.current)return
    const uid=lastScan.trim().toUpperCase()
    clearScan()
    const now=Date.now()
    const lastTime=cooldownRef.current.get(uid)??0
    const remaining=SCAN_COOLDOWN_MS-(now-lastTime)
    if(remaining>0){
      const ev:LiveEvent={id:crypto.randomUUID(),rfid_uid:uid,name:'—',type:'—',status:'COOLDOWN',amount:0,balance_after:0,ts:now}
      setCurrentEvent(ev)
      setLiveEvents(prev=>[ev,...prev].slice(0,20))
      return
    }
    processingRef.current=true
    cooldownRef.current.set(uid,now)
    const processingEv:LiveEvent={id:crypto.randomUUID(),rfid_uid:uid,name:'Looking up...',type:'—',status:'PROCESSING',amount:0,balance_after:0,ts:now}
    setCurrentEvent(processingEv)
    ;(async()=>{
      try{
        const body=new URLSearchParams({uid})
        const res=await fetch('/api/process-payment',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()})
        const text=await res.text()
        const [statusStr,balStr]=text.split('|')
        const {data:user}=await supabase.from('users').select('name, type, balance').eq('rfid_uid',uid).single()
        const {data:settings}=await supabase.from('settings').select('fare').eq('id',1).single()
        let fare=Number(settings?.fare??10)
        if(user?.type==='Student')fare=Math.max(0,fare-5)
        const finalEv:LiveEvent={
          id:processingEv.id,rfid_uid:uid,name:user?.name??'—',type:user?.type??'—',
          status:statusStr as LiveEvent['status'],
          amount:statusStr==='APPROVED'?fare:0,
          balance_after:balStr?Number(balStr):0,
          ts:now,
        }
        setCurrentEvent(finalEv)
        setLiveEvents(prev=>[finalEv,...prev].slice(0,20))
        await loadStats()
      }finally{processingRef.current=false}
    })()
  },[lastScan])// eslint-disable-line

  const tabStyle=(active:boolean):React.CSSProperties=>({padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',background:active?'var(--royal)':'transparent',color:active?'#fff':'var(--muted)',transition:'all 0.15s'})

  return(
    <div>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:22,fontWeight:800,color:'var(--text)',marginBottom:4}}>Dashboard</h1>
        <p style={{fontSize:13,color:'var(--muted)'}}>Overview of your RFID payment system</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginBottom:28}}>
        <StatCard label="Registered Users" value={stats.users} unit="RFID card holders" color="var(--royal)" icon="👤"/>
        <StatCard label="Total Transactions" value={stats.transactions} unit="processed entries" color="#7c3aed" icon="🧾"/>
        <StatCard label="Total Income" value={`₱${stats.income.toLocaleString('en-PH',{minimumFractionDigits:2})}`} unit="approved fare payments" color="var(--success)" icon="💰"/>
        <StatCard label="System Mode" value="TEST" unit="sandbox environment" color="var(--warning)" icon="⚠️"/>
      </div>

      {/* LIVE RFID */}
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',boxShadow:'var(--shadow-sm)',marginBottom:24}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:20}}>📡</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#fff'}}>Live RFID Scanner</div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>Auto-deducts fare on card tap • {SCAN_COOLDOWN_MS/1000}s cooldown per card</div>
            </div>
          </div>
          <MqttDot status={mqttStatus}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
          {/* Current scan */}
          <div style={{padding:24,borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:200,background:currentEvent?(statusBg(currentEvent.status)+'55'):'var(--off-white)',transition:'background 0.3s'}}>
            {!currentEvent?(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:40,marginBottom:10}}>🔍</div>
                <div style={{fontSize:14,fontWeight:700,color:'var(--text-mid)'}}>Waiting for scan...</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Tap an RFID card to the reader</div>
              </div>
            ):(
              <div style={{textAlign:'center',width:'100%'}}>
                <div style={{fontSize:36,marginBottom:8}}>{statusIcon(currentEvent.status)}</div>
                <div style={{fontSize:22,fontWeight:900,color:statusColor(currentEvent.status),marginBottom:4}}>{currentEvent.status}</div>
                {currentEvent.status==='COOLDOWN'&&(
                  <div style={{fontSize:11,color:'var(--muted)',marginBottom:6,padding:'4px 10px',background:'#e2e8f0',borderRadius:99,display:'inline-block'}}>🔒 Double-pay blocked — scan cooldown active</div>
                )}
                <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:2}}>{currentEvent.name}</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--muted)',marginBottom:10}}>{currentEvent.rfid_uid}</div>
                {currentEvent.status==='APPROVED'&&(
                  <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Charged</div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:20,fontWeight:900,color:'var(--danger)'}}>−₱{currentEvent.amount.toFixed(2)}</div>
                    </div>
                    <div style={{width:1,background:'var(--border)'}}/>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>Remaining</div>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:20,fontWeight:900,color:'var(--success)'}}>₱{currentEvent.balance_after.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                {currentEvent.status==='INSUFFICIENT'&&<div style={{fontSize:13,color:'var(--warning)',fontWeight:700}}>Balance: ₱{currentEvent.balance_after.toFixed(2)} — Please top up</div>}
                {currentEvent.status==='PROCESSING'&&<div style={{fontSize:12,color:'#a855f7',fontWeight:600}}>Processing payment...</div>}
                {currentEvent.status==='NOT FOUND'&&<div style={{fontSize:12,color:'var(--danger)',fontWeight:600}}>Card not registered in the system</div>}
              </div>
            )}
          </div>

          {/* Activity list */}
          <div style={{maxHeight:260,overflowY:'auto'}}>
            {liveEvents.length===0?(
              <div style={{padding:24,textAlign:'center',color:'var(--muted)',fontSize:12}}>No activity yet this session</div>
            ):liveEvents.map(ev=>(
              <div key={ev.id} style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,transition:'background 0.15s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--off-white)'}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
                <div style={{fontSize:18,flexShrink:0}}>{statusIcon(ev.status)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.name} <span style={{fontWeight:400,color:'var(--muted)'}}>· {ev.type}</span></div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--muted)'}}>{ev.rfid_uid}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:statusColor(ev.status),fontFamily:'var(--font-mono)'}}>{ev.status==='APPROVED'?`−₱${ev.amount.toFixed(2)}`:ev.status}</div>
                  <div style={{fontSize:10,color:'var(--muted)'}}>{new Date(ev.ts).toLocaleTimeString('en-PH')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'var(--white)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',boxShadow:'var(--shadow-sm)'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:6,background:'var(--off-white)',padding:4,borderRadius:10}}>
            <button style={tabStyle(tab==='transactions')} onClick={()=>setTab('transactions')}>🧾 Recent Transactions</button>
            <button style={tabStyle(tab==='users')} onClick={()=>setTab('users')}>👤 Users & Balance</button>
          </div>
          {tab==='transactions'&&<a href="/transactions" style={{fontSize:12,fontWeight:600,color:'var(--royal)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px'}}>View All →</a>}
          {tab==='users'&&<a href="/add-user" style={{fontSize:12,fontWeight:600,color:'var(--royal)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px'}}>+ Add User</a>}
        </div>

        {tab==='transactions'&&(
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--off-white)'}}>{['Name','RFID UID','Type','Status','Amount','Balance After','Date'].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:10,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,fontFamily:'var(--font-mono)'}}>{h}</th>)}</tr></thead>
            <tbody>
              {loading?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:13}}>Loading...</td></tr>
              :recent.length===0?<tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:13}}>No transactions yet</td></tr>
              :recent.map((tx,i)=>(
                <tr key={tx.id} style={{borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'var(--off-white)',transition:'background 0.15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLTableRowElement).style.background='var(--royal-subtle)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=i%2===0?'transparent':'var(--off-white)'}}>
                  <td style={{padding:'12px 20px',fontSize:13,color:'var(--text)',fontWeight:600}}>{tx.users?.name??'—'}</td>
                  <td style={{padding:'12px 20px',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-mid)',fontWeight:600}}>{tx.rfid_uid}</td>
                  <td style={{padding:'12px 20px',fontSize:12,color:'var(--text)'}}>{tx.users?.type??'—'}</td>
                  <td style={{padding:'12px 20px'}}><span style={{fontSize:10,padding:'4px 10px',borderRadius:99,fontWeight:700,fontFamily:'var(--font-mono)',color:statusColor(tx.status),background:statusBg(tx.status),border:`1px solid ${statusColor(tx.status)}44`,letterSpacing:'0.06em'}}>{tx.status}</span></td>
                  <td style={{padding:'12px 20px',fontFamily:'var(--font-mono)',fontSize:13,color:'var(--text)',fontWeight:600}}>₱{Number(tx.amount).toFixed(2)}</td>
                  <td style={{padding:'12px 20px',fontFamily:'var(--font-mono)',fontSize:13,color:'var(--royal)',fontWeight:700}}>₱{Number(tx.balance_after).toFixed(2)}</td>
                  <td style={{padding:'12px 20px',fontSize:11,color:'var(--muted)'}}>{new Date(tx.created_at).toLocaleString('en-PH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab==='users'&&(
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--off-white)'}}>{['Name','RFID UID','Type','Balance','Registered'].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:10,color:'var(--muted)',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,fontFamily:'var(--font-mono)'}}>{h}</th>)}</tr></thead>
            <tbody>
              {loading?<tr><td colSpan={5} style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:13}}>Loading...</td></tr>
              :users.length===0?<tr><td colSpan={5} style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:13}}>No users registered yet</td></tr>
              :users.map((u,i)=>(
                <tr key={u.id} style={{borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'var(--off-white)',transition:'background 0.15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLTableRowElement).style.background='var(--royal-subtle)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=i%2===0?'transparent':'var(--off-white)'}}>
                  <td style={{padding:'12px 20px',fontSize:13,fontWeight:700,color:'var(--text)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:9}}>
                      <div style={{width:30,height:30,borderRadius:'50%',background:'var(--royal-subtle)',border:'1px solid rgba(26,63,204,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>{u.name.charAt(0).toUpperCase()}</div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{padding:'12px 20px',fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text-mid)',fontWeight:600}}>{u.rfid_uid}</td>
                  <td style={{padding:'12px 20px'}}><span style={{fontSize:10,padding:'4px 10px',borderRadius:99,fontWeight:700,background:u.type==='Student'?'#fef9c3':'var(--royal-subtle)',color:u.type==='Student'?'#854d0e':'var(--royal)',border:`1px solid ${u.type==='Student'?'#fde04788':'rgba(26,63,204,0.2)'}`}}>{u.type}</span></td>
                  <td style={{padding:'12px 20px'}}><span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:800,color:Number(u.balance)<15?'var(--danger)':'var(--success)'}}>₱{Number(u.balance).toFixed(2)}</span>{Number(u.balance)<15&&<span style={{marginLeft:6,fontSize:10,color:'var(--danger)',fontWeight:700}}>LOW</span>}</td>
                  <td style={{padding:'12px 20px',fontSize:11,color:'var(--muted)'}}>{new Date(u.created_at).toLocaleString('en-PH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

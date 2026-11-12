import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/axios';
import '../styles/MembershipManagement.css';
export default function MembershipRegistration(){
 const navigate=useNavigate(); const user=JSON.parse(localStorage.getItem('user')||'{}');
 const [name,setName]=useState(user.name||''); const [phone,setPhone]=useState(user.phone_number||'');
 const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 useEffect(()=>{api.get('/membership/me').then(r=>{if(r.data.data?.membership_expiry)navigate('/membership',{replace:true});}).catch(()=>{});},[navigate]);
 const submit=async(e)=>{e.preventDefault();setLoading(true);setError('');try{await api.post('/membership/register');navigate('/membership');}catch(err){setError(err.response?.data?.message||'Membership registration failed.');}finally{setLoading(false);}};
 return <main className="membership-page"><section className="m-card m-register"><h1>Membership Registration</h1><p>Register and become a Bronze Member for one year.</p>{error&&<p className="m-alert error">{error}</p>}<form onSubmit={submit}><label>Full Name<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input type="email" value={user.email||''} readOnly/></label><label>Phone Number<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter phone number"/></label><div className="m-registration-tier"><b>Membership Tier: Bronze</b><span>Validity: 1 year from registration</span></div><button disabled={loading}>{loading?'Registering...':'Register Membership'}</button></form></section></main>;
}

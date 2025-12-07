import { Routes, Route } from "react-router-dom"; 
import HomePage from "./pages/HomePage"; 
import AdminPage from "./pages/AdminPage"; 
 
function App() { 
  return ( 
    <div> 
      <h1 style={{color: 'red', padding: '20px', textAlign: 'center'}}> 
        ? Etsub Shop Working! 
      </h1> 
      <nav style={{padding: '10px', background: '#eee', textAlign: 'center'}}> 
        <a href="#/" style={{marginRight: '20px'}}>Home</a> 
        <a href="#/admin">Admin</a> 
      </nav> 
      <Routes> 
        <Route path="/" element={<HomePage />} /> 
        <Route path="/admin" element={<AdminPage />} /> 
      </Routes> 
    </div> 
  ); 
} 
 

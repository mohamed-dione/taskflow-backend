import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Connexion Admin
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.user.role === 'ADMIN') {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        alert('Connexion admin réussie !');
        fetchDashboardData(data.token);
      } else {
        alert('Accès refusé : Compte Administrateur requis.');
      }
    } catch (err) {
      console.error(err);
      ('Erreur de connexion');
    }
  };

  // Récupération des données statistiques et utilisateurs
  const fetchDashboardData = async (authToken) => {
    try {
      const resStats = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const statsData = await resStats.json();
      setStats(statsData);

      const resUsers = await fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const usersData = await resUsers.json();
      setUsers(usersData);
    } catch (err) {
      console.error('Erreur chargement données', err);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData(token);
  }, [token]);

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>Connexion Backoffice Admin</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="email" placeholder="Email Admin" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => PASSWORD(e.target.value)} required />
          <button type="submit" style={{ background: '#007bff', color: '#fff', padding: '10px', border: 'none' }}>Se connecter</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>📊 Tableau de Bord Administrateur - TaskFlow</h1>
      <button onClick={() => { localStorage.clear(); setToken(''); }} style={{ background: 'red', color: 'white', padding: '5px 10px' }}>Déconnexion</button>
      
      {/* Statistiques Globales */}
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <div style={{ background: '#f8f9fa', padding: '20px', border: '1px solid #ccc', flex: 1 }}>
          <h3>Total Utilisateurs</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalUsers || 0}</p>
        </div>
        <div style={{ background: '#f8f9fa', padding: '20px', border: '1px solid #ccc', flex: 1 }}>
          <h3>Total Projets</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalProjects || 0}</p>
        </div>
        <div style={{ background: '#f8f9fa', padding: '20px', border: '1px solid #ccc', flex: 1 }}>
          <h3>Total Tâches</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalTasks || 0}</p>
        </div>
      </div>

      {/* Gestion des utilisateurs */}
      <h2>👥 Liste des Utilisateurs</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#007bff', color: 'white' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nom</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.name}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.email}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
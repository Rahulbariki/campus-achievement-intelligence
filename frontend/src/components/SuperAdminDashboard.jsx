import { useEffect, useState } from 'react';
import api from '../services/api';

export default function SuperAdminDashboard() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data } = await api.get('/super-admin/collections');
      setCollections(data);
    } catch (err) {
      console.error('Failed to fetch collections', err);
    }
  };

  const fetchCollectionData = async (name) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/super-admin/db/${name}`);
      setData(data);
    } catch (err) {
      alert('Failed to fetch collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('CRITICAL: Are you sure you want to PERMANENTLY delete this document?')) return;
    try {
      await api.delete(`/super-admin/db/${selectedCollection}/${id}`);
      fetchCollectionData(selectedCollection);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(e.target.docData.value);
      await api.put(`/super-admin/db/${selectedCollection}/${editingDoc._id}`, parsedData);
      setEditingDoc(null);
      fetchCollectionData(selectedCollection);
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  return (
    <div className="panel" style={{ marginTop: '2rem' }}>
      <div className="section-header" style={{ border: '1px solid var(--ink)', padding: '2rem', background: '#fcfcfc' }}>
        <p className="eyebrow" style={{ color: '#d9534f', letterSpacing: '0.15em', marginBottom: '1rem' }}>LEVEL 5 ACCESS | DATABASE CONTROLLER</p>
        <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: '"Playfair Display", serif', textTransform: 'uppercase', marginBottom: '0.75rem' }}>SUPER ADMIN COMMAND CONSOLE</h3>
        <p className="font-serif" style={{ fontSize: '1.05rem', lineHeight: '1.5', opacity: '0.9', maxWidth: '800px' }}>Global override authority for document rectification, audit trail management, and systemic data hygiene.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', marginTop: '2rem' }}>
        <aside>
          <p className="eyebrow" style={{ color: '#d9534f', letterSpacing: '0.1em', marginBottom: '1rem' }}>SYSTEM COLLECTIONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '1px solid var(--ink)', paddingLeft: '1rem' }}>
            {collections.map(c => (
              <button key={c} 
                 onClick={() => { setSelectedCollection(c); fetchCollectionData(c); }}
                 className={`ghost-button ${selectedCollection === c ? 'active' : ''}`}
                 style={{ 
                   textAlign: 'left',
                   fontSize: '0.85rem',
                   textTransform: 'uppercase',
                   fontFamily: '"JetBrains Mono", monospace',
                   border: selectedCollection === c ? '1px solid var(--ink)' : '1px solid transparent',
                   background: selectedCollection === c ? 'var(--paper-strong)' : 'transparent',
                   padding: '0.75rem',
                   cursor: 'pointer'
                 }}>
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </aside>

        <main>
          <div className="metadata" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid transparent' }}>
            <p className="eyebrow" style={{ color: '#d9534f', letterSpacing: '0.1em' }}>
              {selectedCollection ? `INSPECTING ${selectedCollection.toUpperCase()}` : 'SELECT COLLECTION TO INSPECT'}
            </p>
            <p className="eyebrow" style={{ color: '#d9534f', letterSpacing: '0.1em' }}>
              {data.length} RECORDS CACHED
            </p>
          </div>

          {loading ? (
             <div style={{ padding: '4rem', textAlign: 'center', border: '1px solid var(--ink)' }}>
               <p className="font-serif italic">Loading data streams...</p>
             </div>
          ) : (
             <div className="table-container" style={{ border: '1px solid var(--ink)', maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid var(--ink)' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase' }}>OBJECT_ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase' }}>DATA_PAYLOAD_MAP</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase' }}>OPERATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(doc => (
                    <tr key={doc._id} style={{ borderBottom: '1px solid #eaeaea' }}>
                      <td style={{ padding: '1rem', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', verticalAlign: 'top' }}>{doc._id}</td>
                      <td style={{ padding: '1rem', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        {JSON.stringify(doc)}
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', border: '1px solid var(--ink)', background: 'transparent', cursor: 'pointer' }} onClick={() => setEditingDoc(doc)}>EDIT</button>
                          <button style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', border: '1px solid #d9534f', color: '#d9534f', background: 'transparent', cursor: 'pointer' }} onClick={() => handleDelete(doc._id)}>WARN</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '4rem', fontStyle: 'italic', fontFamily: '"Playfair Display", serif', fontSize: '1.1rem' }}>No data streams found for this collection.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {editingDoc && (
        <div className="modal-overlay">
          <div className="modal-content panel">
            <p className="eyebrow">Document Editor</p>
            <h4 className="font-mono" style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>{editingDoc._id}</h4>
            <form onSubmit={handleUpdate}>
              <textarea 
                name="docData"
                defaultValue={JSON.stringify(editingDoc, null, 2)}
                className="font-mono"
                style={{ 
                  width: '100%', 
                  height: '350px', 
                  marginTop: '1.5rem', 
                  border: '1px solid var(--line)', 
                  padding: '1.5rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  background: 'var(--paper-strong)'
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="primary-button" type="submit" style={{ flex: 1 }}>Save Changes</button>
                <button className="ghost-button" type="button" onClick={() => setEditingDoc(null)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

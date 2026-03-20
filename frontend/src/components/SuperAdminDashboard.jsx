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
    <div className="card-section newsprint-texture" style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <div className="metadata" style={{ color: 'var(--accent)' }}>LEVEL 5 ACCESS | DATABASE CONTROLLER</div>
        <h3 style={{ fontSize: '2rem' }}>SUPER ADMIN COMMAND CONSOLE</h3>
        <p className="font-serif italic">Global override authority for document rectification, audit trail management, and systemic data hygiene.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', marginTop: '2rem' }}>
        <aside style={{ borderRight: '1px solid var(--line)', paddingRight: '2rem' }}>
          <div className="metadata" style={{ marginBottom: '1rem' }}>SYSTEM COLLECTIONS</div>
          <div className="sidebar-nav">
            {collections.map(c => (
              <a key={c} 
                 href="#"
                 onClick={(e) => { e.preventDefault(); setSelectedCollection(c); fetchCollectionData(c); }}
                 style={{ 
                   display: 'block',
                   background: selectedCollection === c ? 'var(--ink)' : 'transparent', 
                   color: selectedCollection === c ? 'white' : 'inherit',
                   marginBottom: '0.5rem',
                   fontWeight: 900,
                   fontSize: '0.75rem'
                 }}>
                {c.toUpperCase()}
              </a>
            ))}
          </div>
        </aside>

        <main>
          <div className="metadata" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{selectedCollection ? `ACTIVE LEDGER: ${selectedCollection.toUpperCase()}` : 'SELECT COLLECTION TO INSPECT'}</span>
            <span>{data.length} RECORDS CACHED</span>
          </div>

          {loading ? (
             <div style={{ padding: '4rem', textAlign: 'center' }}>
               <p className="font-mono italic">Synchronizing with core cluster...</p>
             </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '500px' }}>
              <table>
                <thead>
                  <tr>
                    <th>OBJECT_ID</th>
                    <th>DATA_PAYLOAD_MAP</th>
                    <th>OPERATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(doc => (
                    <tr key={doc._id}>
                      <td className="font-mono" style={{ fontSize: '0.65rem', fontWeight: 900 }}>{doc._id}</td>
                      <td className="font-mono" style={{ fontSize: '0.65rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(doc)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="small-btn" onClick={() => setEditingDoc(doc)}>MODIFY</button>
                          <button className="small-btn btn-danger" onClick={() => handleDelete(doc._id)}>PURGE</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem', fontStyle: 'italic' }}>No data streams found for this collection.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {editingDoc && (
        <div className="modal-overlay">
          <div className="modal-content newsprint-texture">
            <div className="metadata" style={{ color: 'var(--accent)' }}>DOCUMENT EDITOR</div>
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
                  border: '2px solid var(--ink)', 
                  padding: '1.5rem',
                  fontSize: '0.8rem',
                  lineHeight: '1.6',
                  background: '#fdfdfd'
                }}
              />
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
                <button className="primary-button" type="submit" style={{ flex: 1 }}>SAVE & COMMIT TO DB</button>
                <button className="ghost-button" type="button" onClick={() => setEditingDoc(null)} style={{ flex: 1 }}>ABORT CHANGES</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

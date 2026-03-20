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
      <div className="section-header">
        <p className="eyebrow">System Administration</p>
        <h3>Database Management</h3>
        <p className="font-serif">Global tools for managing system collections, document rectification, and data maintenance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', marginTop: '2rem' }}>
        <aside style={{ borderRight: '1px solid var(--line)', paddingRight: '2rem' }}>
          <p className="eyebrow" style={{ marginBottom: '1rem' }}>Collections</p>
          <nav className="sidebar-nav">
            {collections.map(c => (
              <button key={c} 
                 onClick={() => { setSelectedCollection(c); fetchCollectionData(c); }}
                 className={`workspace-menu-button ${selectedCollection === c ? 'active' : ''}`}
                 style={{ 
                   display: 'block',
                   width: '100%',
                   textAlign: 'left',
                   marginBottom: '0.5rem',
                   fontSize: '0.8rem',
                   textTransform: 'capitalize'
                 }}>
                {c.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <div className="metadata" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{selectedCollection ? `Collection: ${selectedCollection}` : 'Select a collection'}</span>
            <span>{data.length} records found</span>
          </div>

          {loading ? (
             <div style={{ padding: '4rem', textAlign: 'center' }}>
               <p className="font-serif italic">Loading data...</p>
             </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '500px' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data Summary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(doc => (
                    <tr key={doc._id}>
                      <td className="font-mono" style={{ fontSize: '0.7rem' }}>{doc._id}</td>
                      <td className="font-mono" style={{ fontSize: '0.7rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(doc)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="small-btn" onClick={() => setEditingDoc(doc)}>Edit</button>
                          <button className="small-btn btn-danger" onClick={() => handleDelete(doc._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem', fontStyle: 'italic' }}>No records found in this collection.</td></tr>
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

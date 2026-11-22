import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatCategory } from '../utils/formatters.js';
import { Plus, Edit2, Trash2, Power, Building2, Users, Search } from 'lucide-react';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'COMPUTER_LAB',
    building: '',
    floor: 1,
    roomNumber: '',
    capacity: 30,
    equipment: '',
    status: 'ACTIVE',
    minBookingDuration: 30,
    maxBookingDuration: 240,
    description: '',
  });

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      if (res.data?.success) {
        setResources(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      name: '',
      category: 'COMPUTER_LAB',
      building: '',
      floor: 1,
      roomNumber: '',
      capacity: 30,
      equipment: 'Workstations, Projector, Whiteboard',
      status: 'ACTIVE',
      minBookingDuration: 30,
      maxBookingDuration: 240,
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingResource(r);
    setFormData({
      name: r.name,
      category: r.category,
      building: r.building,
      floor: r.floor,
      roomNumber: r.roomNumber,
      capacity: r.capacity,
      equipment: (r.equipment || []).join(', '),
      status: r.status,
      minBookingDuration: r.minBookingDuration,
      maxBookingDuration: r.maxBookingDuration,
      description: r.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      floor: Number(formData.floor),
      minBookingDuration: Number(formData.minBookingDuration),
      maxBookingDuration: Number(formData.maxBookingDuration),
      equipment: formData.equipment
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingResource) {
        await api.put(`/resources/${editingResource.id}`, payload);
      } else {
        await api.post('/resources', payload);
      }
      setModalOpen(false);
      fetchResources();
    } catch (err) {
      alert(`Save failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleToggleStatus = async (r) => {
    const nextStatus = r.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.put(`/resources/${r.id}`, { status: nextStatus });
      fetchResources();
    } catch (err) {
      alert(`Failed to update status: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredResources = resources.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.building?.toLowerCase().includes(q) ||
      r.roomNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Campus Facilities Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision, update specifications, configure operating hours, and toggle maintenance status.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Resource</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 bg-white"
        />
      </div>

      {/* Resources Table */}
      {loading ? (
        <LoadingSpinner message="Loading facilities list..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Venue Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Capacity</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{r.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{r.description}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{formatCategory(r.category)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.building}, Rm {r.roomNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{r.capacity} Seats</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(r)}
                        title="Toggle Maintenance"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(r)}
                        title="Edit Details"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        title="Delete Resource"
                        className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingResource ? 'Edit Resource Specifications' : 'Provision New Campus Resource'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              >
                <option value="COMPUTER_LAB">Computer Lab</option>
                <option value="SEMINAR_ROOM">Seminar Room</option>
                <option value="STUDY_ROOM">Study Room</option>
                <option value="SPORTS_COURT">Sports Court</option>
                <option value="CONFERENCE_HALL">Conference Hall</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building</label>
              <input
                type="text"
                required
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Equipment & Amenities (Comma Separated)
            </label>
            <input
              type="text"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              placeholder="e.g. Projector, Whiteboard, GPUs, Audio System"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs shadow-xs"
            >
              {editingResource ? 'Save Modifications' : 'Create Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

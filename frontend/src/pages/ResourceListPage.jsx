import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCategory } from '../utils/formatters.js';
import {
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';

export default function ResourceListPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState([]);

  const equipmentOptions = [
    'Projector',
    'Whiteboard',
    'Workstations',
    'GPUs',
    'Sound System',
    'Video Conferencing',
  ];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (minCapacity) params.minCapacity = minCapacity;

      const res = await api.get('/resources', { params });
      if (res.data?.success) {
        setResources(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [category, minCapacity]);

  const toggleEquipment = (item) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const filteredResources = resources.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchBuilding = r.building?.toLowerCase().includes(q);
      const matchRoom = r.roomNumber?.toLowerCase().includes(q);
      if (!matchName && !matchBuilding && !matchRoom) return false;
    }

    if (selectedEquipment.length > 0) {
      const hasAll = selectedEquipment.every((eq) =>
        r.equipment && r.equipment.some((item) => item.toLowerCase().includes(eq.toLowerCase()))
      );
      if (!hasAll) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Auto-allocate banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Campus Facilities & Resources</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and reserve computer labs, seminar halls, collaborative study rooms, and sports venues.
          </p>
        </div>
        <Link
          to="/auto-allocate"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-medium text-sm shadow-xs transition-colors self-start"
        >
          <Sparkles className="w-4 h-4" />
          <span>Intelligent Auto-Allocation</span>
        </Link>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, building, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 text-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 text-sm bg-white"
            >
              <option value="">All Categories</option>
              <option value="COMPUTER_LAB">Computer Lab</option>
              <option value="SEMINAR_ROOM">Seminar Room</option>
              <option value="STUDY_ROOM">Study Room</option>
              <option value="SPORTS_COURT">Sports Court</option>
              <option value="CONFERENCE_HALL">Conference Hall</option>
            </select>
          </div>

          {/* Minimum Capacity */}
          <div>
            <input
              type="number"
              min="1"
              placeholder="Min Capacity (e.g. 10)"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-campus-800/20 focus:border-campus-800 text-sm"
            />
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setMinCapacity('');
                setSelectedEquipment([]);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Equipment Filter Chips */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Equipment:
          </span>
          {equipmentOptions.map((eq) => {
            const isSelected = selectedEquipment.includes(eq);
            return (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-campus-800 text-white border-campus-800 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Searching campus venues..." />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          title="No facilities found"
          description="Try adjusting your category, capacity or equipment requirements."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategory('');
            setMinCapacity('');
            setSelectedEquipment([]);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Resource Image Header */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={resource.imageUrl || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80'}
                    alt={resource.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={resource.status} />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {formatCategory(resource.category)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                    {resource.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{resource.building}, Rm {resource.roomNumber}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{resource.capacity} Seats</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {resource.description || 'Modern campus resource equipped with standard presentation equipment and connectivity.'}
                  </p>

                  {/* Equipment badges */}
                  {resource.equipment && resource.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {resource.equipment.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {item}
                        </span>
                      ))}
                      {resource.equipment.length > 3 && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-400 font-medium">
                          +{resource.equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-xs text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>Operating Hours: {resource.operatingHours?.start} - {resource.operatingHours?.end}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  to={`/resources/${resource.id}`}
                  style={{ backgroundColor: '#8B1E2D', color: '#ffffff' }}
                  className="w-full py-2.5 px-4 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-xs text-center block shadow-md hover:shadow-lg transition-all"
                >
                  View 30-Min Schedule & Reserve
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

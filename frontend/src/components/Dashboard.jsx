import { useState, useEffect } from 'react';
import { getTemplates, getActiveInstances, createInstance } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [activeInstances, setActiveInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showCreateInstanceModal, setShowCreateInstanceModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const navigate = useNavigate();

  // Hardcoded userId for now (you'll add auth later)
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const templatesData = await getTemplates(userId);
      setTemplates(templatesData.data || []);

      // Fetch active instances for first template if it exists
      if (templatesData.data && templatesData.data.length > 0) {
        const firstTemplateId = templatesData.data[0].id;
        setSelectedTemplateId(firstTemplateId);
        try {
          const instancesData = await getActiveInstances(firstTemplateId);
          setActiveInstances(instancesData.data || []);
        } catch (err) {
          setActiveInstances([]);
        }
      } else {
        setActiveInstances([]);
      }
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    try {
      // TODO: integrate with backend when template creation endpoint is ready
      setNewTemplateName('');
      setNewTemplateDescription('');
      setShowCreateTemplateModal(false);
      // fetchData();
      alert('Template creation coming soon! Use Postman to create templates for now.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateInstance = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !newInstanceName.trim()) return;

    try {
      await createInstance(selectedTemplateId, newInstanceName);
      setNewInstanceName('');
      setShowCreateInstanceModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Expense Splitter</h1>
          <p className="text-gray-600">Manage shared expenses with ease</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* No Templates State */}
        {templates.length === 0 ? (
          <div className="mb-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-12 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2m4-4l2 2m-2-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Templates Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first template to start tracking shared expenses. A template defines the structure and default values for your monthly instances.
            </p>
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium inline-block"
            >
              Create First Template
            </button>
          </div>
        ) : (
          <>
            {/* Active Instances Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Instances</h2>
              {activeInstances.length === 0 ? (
                <p className="text-gray-500 mb-6">No active instances. Create one to get started.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {activeInstances.map((instance) => (
                    <div
                      key={instance.id}
                      className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{instance.name}</h3>
                          <p className="text-gray-600 mt-1">Status: {instance.status}</p>
                          <p className="text-gray-500 text-sm mt-2">
                            Last updated: {new Date(instance.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/instance/${instance.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowCreateInstanceModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                + Create New Instance
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium">
                Manage Templates
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium">
                View History
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Template</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Templates are coming soon! For now, use the Postman collection to create templates with your desired fields, participants, and split rules.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Instance Modal */}
      {showCreateInstanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Instance</h2>

            <form onSubmit={handleCreateInstance}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template *
                </label>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance Name *
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="e.g., February 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateInstanceModal(false);
                    setNewInstanceName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
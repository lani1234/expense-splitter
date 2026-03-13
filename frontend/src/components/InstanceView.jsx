import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getInstance,
  getFieldValuesByInstance,
  getTotalForParticipant,
  getTemplateParticipants,
  getParticipantEntryAmountsByFieldValue,
  deleteFieldValue,
  getTemplateFields,
} from '../services/api';
import InstanceField from './InstanceField';
import AddExpenseModal from './AddExpenseModal';

export default function InstanceView() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [youOwe, setYouOwe] = useState(0);
  const [partnerOwes, setPartnerOwes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFieldForSplit, setSelectedFieldForSplit] = useState(null);
  const [selectedFieldValueForSplit, setSelectedFieldValueForSplit] = useState(null);

  useEffect(() => {
    fetchInstanceData();
  }, [instanceId]);

  const fetchInstanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const instanceData = await getInstance(instanceId);
      setInstance(instanceData.data);

      const fieldValuesData = await getFieldValuesByInstance(instanceId);
      setFieldValues(fieldValuesData.data || []);

      // Get the template to fetch fields and participants
      const templateId = instanceData.data.template.id;

      const fieldsData = await getTemplateFields(templateId);
      setFields(fieldsData.data || []);

      const participantsData = await getTemplateParticipants(templateId);
      setParticipants(participantsData.data || []);

      // Fetch totals for both participants
      if (participantsData.data && participantsData.data.length >= 2) {
        try {
          const total1 = await getTotalForParticipant(instanceId, participantsData.data[0].id);
          setYouOwe(total1.data || 0);
        } catch (err) {
          setYouOwe(0);
        }

        try {
          const total2 = await getTotalForParticipant(instanceId, participantsData.data[1].id);
          setPartnerOwes(total2.data || 0);
        } catch (err) {
          setPartnerOwes(0);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitConfigure = (field, fieldValue) => {
    setSelectedFieldForSplit(field);
    setSelectedFieldValueForSplit(fieldValue);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading instance...</p>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="mb-8 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Instance not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">{instance.name}</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Status and Actions */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Status: {instance.status}
            </span>
          </div>
          {instance.status === 'IN_PROGRESS' && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Mark as Settled
            </button>
          )}
        </div>

        {/* Summary Section */}
        <div className="mb-12 bg-white p-8 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Summary</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {participants.length > 0 ? participants[0].name : 'You'} owes:
              </p>
              <p className="text-3xl font-bold text-gray-900">${youOwe.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-2">
                {participants.length > 1 ? participants[1].name : 'Partner'} owes:
              </p>
              <p className="text-3xl font-bold text-gray-900">${partnerOwes.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Expenses Section - Using InstanceField Component */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Expenses</h2>

          {fields.length === 0 ? (
            <p className="text-gray-500">No fields in this template.</p>
          ) : (
            <div>
              {fields.map((field) => (
                <InstanceField
                  key={field.id}
                  field={field}
                  fieldValues={fieldValues}
                  participants={participants}
                  onFieldValueUpdated={fetchInstanceData}
                  onSplitConfigure={handleSplitConfigure}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Configure Split Modal */}
      {showAddModal && (
        <AddExpenseModal
          instanceId={instanceId}
          selectedField={selectedFieldForSplit}
          selectedFieldValue={selectedFieldValueForSplit}
          onClose={() => {
            setShowAddModal(false);
            setSelectedFieldForSplit(null);
            setSelectedFieldValueForSplit(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedFieldForSplit(null);
            setSelectedFieldValueForSplit(null);
            fetchInstanceData();
          }}
        />
      )}
    </div>
  );
}
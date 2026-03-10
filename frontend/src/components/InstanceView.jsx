import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getInstance,
  getFieldValuesByInstance,
  getTotalForParticipant,
  getTemplateParticipants,
  getParticipantEntryAmountsByFieldValue,
  deleteFieldValue
} from '../services/api';
import AddExpenseModal from './AddExpenseModal';

export default function InstanceView() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState(null);
  const [fieldValues, setFieldValues] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [youOwe, setYouOwe] = useState(0);
  const [partnerOwes, setPartnerOwes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseBreakdowns, setExpenseBreakdowns] = useState({});

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
      const fieldValuesArray = fieldValuesData.data || [];
      setFieldValues(fieldValuesArray);

      // Get the template to fetch actual participants
      const templateId = instanceData.data.template.id;
      const participantsData = await getTemplateParticipants(templateId);
      const participantsArray = participantsData.data || [];
      setParticipants(participantsArray);

      // Fetch individual breakdowns for each field value
      const breakdowns = {};
      for (const fieldValue of fieldValuesArray) {
        try {
          const amountsData = await getParticipantEntryAmountsByFieldValue(fieldValue.id);
          breakdowns[fieldValue.id] = amountsData.data || [];
        } catch (err) {
          breakdowns[fieldValue.id] = [];
        }
      }
      setExpenseBreakdowns(breakdowns);

      // Fetch totals for both participants
      if (participantsArray.length >= 2) {
        try {
          const total1 = await getTotalForParticipant(instanceId, participantsArray[0].id);
          setYouOwe(total1.data || 0);
        } catch (err) {
          setYouOwe(0);
        }

        try {
          const total2 = await getTotalForParticipant(instanceId, participantsArray[1].id);
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

  const getExpenseBreakdown = (fieldValueId) => {
    return expenseBreakdowns[fieldValueId] || [];
  };

  const getParticipantAmount = (fieldValueId, participantId) => {
    const breakdown = getExpenseBreakdown(fieldValueId);
    const participantAmount = breakdown.find((p) => p.templateParticipant.id === participantId);
    return participantAmount ? participantAmount.amount : 0;
  };

  const handleDeleteExpense = async (fieldValueId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        setError(null);
        await deleteFieldValue(fieldValueId);
        fetchInstanceData();
      } catch (err) {
        setError(err.message);
      }
    }
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

        {/* Expenses Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Expenses</h2>

          {fieldValues.length === 0 ? (
            <p className="text-gray-500 mb-6">No expenses added yet.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {fieldValues.map((fieldValue) => (
                <div
                  key={fieldValue.id}
                  className="bg-white p-6 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fieldValue.templateField.label}
                      </h3>
                      {fieldValue.note && (
                        <p className="text-gray-600 text-sm mt-1">{fieldValue.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${fieldValue.amount.toFixed(2)}
                      </p>
                      {fieldValue.entryDate && (
                        <p className="text-gray-500 text-sm">
                          {new Date(fieldValue.entryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-between text-sm">
                    <div>
                      <p className="text-gray-600">
                        {participants.length > 0 ? participants[0].name : 'You'}:{' '}
                        <span className="font-semibold text-gray-900">
                          ${getParticipantAmount(fieldValue.id, participants[0]?.id).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        {participants.length > 1 ? participants[1].name : 'Partner'}:{' '}
                        <span className="font-semibold text-gray-900">
                          ${getParticipantAmount(fieldValue.id, participants[1]?.id).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(fieldValue.id)}
                    className="mt-4 ml-4 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          instanceId={instanceId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchInstanceData();
          }}
        />
      )}
    </div>
  );
}
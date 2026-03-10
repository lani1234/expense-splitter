import { useState, useEffect } from 'react';
import { addFieldValue, getInstance, getTemplateFields, createSplitRule, addAllocationToRule } from '../services/api';

export default function AddExpenseModal({ instanceId, onClose, onSuccess }) {
  const [fields, setFields] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateId, setTemplateId] = useState(null);

  // Form state
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitMode, setSplitMode] = useState('TEMPLATE_FIELD_PERCENT_SPLIT');
  const [customPercentages, setCustomPercentages] = useState({});
  const [customAmounts, setCustomAmounts] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [instanceId]);

  // When amount changes, recalculate custom amounts
  useEffect(() => {
    if (amount && participants.length > 0 && splitMode === 'FIELD_VALUE_FIXED_AMOUNTS') {
      const totalAmount = parseFloat(amount) || 0;
      const equalAmount = totalAmount / participants.length;
      const newAmounts = {};
      participants.forEach((p) => {
        newAmounts[p.id] = equalAmount;
      });
      setCustomAmounts(newAmounts);
    }
  }, [amount, participants, splitMode]);

  // When custom percentage changes, recalculate other percentages
  const handlePercentageChange = (participantId, newPercent) => {
    const newPercentages = { ...customPercentages };
    newPercentages[participantId] = parseFloat(newPercent) || 0;

    // If there are 2 participants, auto-adjust the other one
    if (participants.length === 2) {
      const otherParticipant = participants.find((p) => p.id !== participantId);
      newPercentages[otherParticipant.id] = 100 - newPercentages[participantId];
    }

    setCustomPercentages(newPercentages);
  };

  // When custom amount changes, recalculate other amounts
  const handleAmountChange = (participantId, newAmount) => {
    const newAmounts = { ...customAmounts };
    newAmounts[participantId] = parseFloat(newAmount) || 0;

    // If there are 2 participants, auto-adjust the other one
    if (participants.length === 2) {
      const totalAmount = parseFloat(amount) || 0;
      const otherParticipant = participants.find((p) => p.id !== participantId);
      newAmounts[otherParticipant.id] = totalAmount - newAmounts[participantId];
    }

    setCustomAmounts(newAmounts);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the instance to find its template
      const instanceData = await getInstance(instanceId);
      const tId = instanceData.data.template.id;
      setTemplateId(tId);

      // Get all fields for this template
      const fieldsData = await getTemplateFields(tId);
      setFields(fieldsData.data || []);

      // Get participants
      const participantsData = await fetch(`http://localhost:8080/api/templates/${tId}/participants`);
      const parsedParticipants = await participantsData.json();
      setParticipants(parsedParticipants.data || []);

      // Initialize custom percentages with equal split
      if (parsedParticipants.data && parsedParticipants.data.length > 0) {
        const equalPercent = 100 / parsedParticipants.data.length;
        const initialPercentages = {};
        parsedParticipants.data.forEach((p) => {
          initialPercentages[p.id] = equalPercent;
        });
        setCustomPercentages(initialPercentages);

        // Initialize custom amounts with equal split
        const initialAmounts = {};
        parsedParticipants.data.forEach((p) => {
          initialAmounts[p.id] = 0;
        });
        setCustomAmounts(initialAmounts);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFieldId || !amount) {
      setError('Field and amount are required');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    // Validate custom split if selected
    if (splitMode === 'FIELD_VALUE_CUSTOM_PERCENT') {
      const totalPercent = Object.values(customPercentages).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setError(`Percentages must total 100% (currently ${totalPercent.toFixed(1)}%)`);
        return;
      }
    }

    if (splitMode === 'FIELD_VALUE_FIXED_AMOUNTS') {
      const totalAmount = Object.values(customAmounts).reduce((sum, a) => sum + a, 0);
      if (Math.abs(totalAmount - parseFloat(amount)) > 0.01) {
        setError(`Amounts must total $${parseFloat(amount).toFixed(2)}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      let overrideSplitRuleId = null;

      // Create override split rule if needed
      if (splitMode === 'FIELD_VALUE_CUSTOM_PERCENT' || splitMode === 'FIELD_VALUE_FIXED_AMOUNTS') {
        // Create a split rule (unnamed, for this expense only)
        const splitRuleResponse = await createSplitRule(templateId, `Auto-generated split for ${amount}`);
        overrideSplitRuleId = splitRuleResponse.data.id;

        // Add allocations to the split rule
        if (splitMode === 'FIELD_VALUE_CUSTOM_PERCENT') {
          for (const participantId of Object.keys(customPercentages)) {
            await addAllocationToRule(overrideSplitRuleId, participantId, customPercentages[participantId]);
          }
        } else {
          // For fixed amounts, convert amounts to percentages
          const totalAmount = parseFloat(amount);
          for (const participantId of Object.keys(customAmounts)) {
            const percent = (customAmounts[participantId] / totalAmount) * 100;
            await addAllocationToRule(overrideSplitRuleId, participantId, percent);
          }
        }
      }

    // Create the field value
    // Convert participantAmounts to the format the backend expects (UUID as string keys)
    const participantAmountsPayload = splitMode === 'FIELD_VALUE_FIXED_AMOUNTS'
      ? Object.keys(customAmounts).reduce((acc, participantId) => {
           acc[participantId] = customAmounts[participantId];
           return acc;
        }, {})
      : null;

    await addFieldValue(
      instanceId,
      selectedFieldId,
      parseFloat(amount),
      note,
      entryDate,
      splitMode,
      overrideSplitRuleId,
      participantAmountsPayload
    );

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Expense</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Field/Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="">Select a name...</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {/* Note */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {/* Split Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How to split?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="TEMPLATE_FIELD_PERCENT_SPLIT"
                  checked={splitMode === 'TEMPLATE_FIELD_PERCENT_SPLIT'}
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Use default split</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="FIELD_VALUE_CUSTOM_PERCENT"
                  checked={splitMode === 'FIELD_VALUE_CUSTOM_PERCENT'}
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Custom percentages</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="FIELD_VALUE_FIXED_AMOUNTS"
                  checked={splitMode === 'FIELD_VALUE_FIXED_AMOUNTS'}
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Fixed amounts</span>
              </label>
            </div>
          </div>

          {/* Custom Percentages Form */}
          {splitMode === 'FIELD_VALUE_CUSTOM_PERCENT' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Split Percentages</h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 w-20">{participant.name}:</label>
                    <div className="flex items-center flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={customPercentages[participant.id] || 0}
                        onChange={(e) => handlePercentageChange(participant.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-500 ml-2">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Total: {Object.values(customPercentages).reduce((sum, p) => sum + p, 0).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Custom Amounts Form */}
          {splitMode === 'FIELD_VALUE_FIXED_AMOUNTS' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Split Amounts</h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 w-20">{participant.name}:</label>
                    <div className="flex items-center flex-1">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customAmounts[participant.id] || 0}
                        onChange={(e) => handleAmountChange(participant.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm ml-1"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Total: ${Object.values(customAmounts).reduce((sum, a) => sum + a, 0).toFixed(2)}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
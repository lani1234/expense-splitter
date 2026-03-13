import { useState, useEffect } from 'react';
import { updateFieldValueAmount, deleteFieldValue, getParticipantEntryAmountsByFieldValue, getSplitRule, getSplitRuleAllocations } from '../services/api';

export default function InstanceField({ field, fieldValues, participants, onFieldValueUpdated, onSplitConfigure }) {
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [error, setError] = useState(null);
  const [breakdowns, setBreakdowns] = useState({});
  const [allocations, setAllocations] = useState({});

  // Get field values for this specific field
  const fieldValuesForThis = fieldValues.filter((fv) => fv.templateField.id === field.id);

  // Fetch breakdowns when field values change
  useEffect(() => {
    const fetchBreakdowns = async () => {
      const newBreakdowns = {};
      const newAllocations = {};

      for (const fv of fieldValuesForThis) {
        try {
          const data = await getParticipantEntryAmountsByFieldValue(fv.id);
          newBreakdowns[fv.id] = data.data || [];
        } catch (err) {
          newBreakdowns[fv.id] = [];
        }

        // Fetch split rule allocations if there's an override split rule
        if (fv.overrideSplitRule) {
          try {
            const allocData = await getSplitRuleAllocations(fv.overrideSplitRule.id);
            newAllocations[fv.id] = allocData.data || [];
          } catch (err) {
            newAllocations[fv.id] = [];
          }
        }
      }

      setBreakdowns(newBreakdowns);
      setAllocations(newAllocations);
    };

    if (fieldValuesForThis.length > 0) {
      fetchBreakdowns();
    }
  }, [fieldValuesForThis]);

  const handleEditClick = (fieldValue) => {
    setEditingId(fieldValue.id);
    setEditAmount(fieldValue.amount.toString());
    setError(null);
  };

  const handleSaveAmount = async (fieldValueId) => {
    if (!editAmount || parseFloat(editAmount) < 0) {
      setError('Amount must be zero or greater');
      return;
    }

    try {
      await updateFieldValueAmount(fieldValueId, parseFloat(editAmount));
      setEditingId(null);
      onFieldValueUpdated();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRow = async (fieldValueId) => {
    if (window.confirm('Delete this row?')) {
      try {
        await deleteFieldValue(fieldValueId);
        onFieldValueUpdated();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddRow = () => {
    // For now, just trigger the split configure modal for a new row
    // We'll pass null to indicate it's a new row
    onSplitConfigure(field, null);
  };

  if (fieldValuesForThis.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{field.label}</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {fieldValuesForThis.map((fieldValue) => (
          <div key={fieldValue.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              {/* Amount Input */}
              <div className="flex-1">
                {editingId === fieldValue.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveAmount(fieldValue.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      ${fieldValue.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleEditClick(fieldValue)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Split Configuration Button */}
              <button
                onClick={() => onSplitConfigure(field, fieldValue)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200"
              >
                Split
              </button>

              {/* Delete Button (for MULTIPLE fields or if more than one row) */}
              {field.fieldType === 'MULTIPLE' && fieldValuesForThis.length > 1 && (
                <button
                  onClick={() => handleDeleteRow(fieldValue.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Split Breakdown */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
              {breakdowns[fieldValue.id] && breakdowns[fieldValue.id].length > 0 ? (
                <div className="space-y-1">
                  {breakdowns[fieldValue.id].map((pea) => (
                    <div key={pea.id} className="flex justify-between">
                      <span>{pea.templateParticipant.name}:</span>
                      <span className="font-medium">${pea.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No allocation yet</p>
              )}
            </div>

            {/* Split Rule Info */}
            <div className="mt-2 text-xs text-gray-500">
              {fieldValue.overrideSplitRule ? (
                <div>
                  <p>Split: <span className="font-semibold">Custom</span></p>
                  {allocations && allocations[fieldValue.id] && Array.isArray(allocations[fieldValue.id]) && allocations[fieldValue.id].length > 0 && (
                    <div className="mt-1 space-y-0.5 text-gray-600">
                      {allocations[fieldValue.id].map((alloc) => {
                        const participantName = alloc?.templateParticipant?.name || 'Unknown';
                        const percent = alloc?.percent || 0;
                        return (
                          <div key={alloc.id} className="flex justify-between text-xs">
                            <span>{participantName}:</span>
                            <span>{percent.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p>Split: <span className="font-semibold">Default (Template)</span></p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Row Button (for MULTIPLE fields) */}
      {field.fieldType === 'MULTIPLE' && (
        <button
          onClick={handleAddRow}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
        >
          + Add Row
        </button>
      )}
    </div>
  );
}
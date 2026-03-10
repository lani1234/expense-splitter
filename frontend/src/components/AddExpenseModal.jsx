import { useState, useEffect } from 'react';
import { addFieldValue, getInstance, getTemplateFields } from '../services/api';

export default function AddExpenseModal({ instanceId, onClose, onSuccess }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templateId, setTemplateId] = useState(null);

  // Form state
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitMode, setSplitMode] = useState('DEFAULT');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [instanceId]);

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

    try {
      setSubmitting(true);
      setError(null);

      await addFieldValue(
        instanceId,
        selectedFieldId,
        parseFloat(amount),
        note,
        entryDate,
        splitMode
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
          {/* Field Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
            >
              <option value="">Select a category...</option>
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
              Split Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="DEFAULT"
                  checked={splitMode === 'DEFAULT'}
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Default split</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="CUSTOM_PERCENT"
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Custom percentages (coming soon)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitMode"
                  value="FIXED_AMOUNTS"
                  onChange={(e) => setSplitMode(e.target.value)}
                  disabled={submitting}
                  className="mr-3"
                />
                <span className="text-gray-700">Fixed amounts (coming soon)</span>
              </label>
            </div>
          </div>

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
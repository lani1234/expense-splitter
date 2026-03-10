const API_BASE_URL = 'http://localhost:8080/api';

// Templates
export const getTemplates = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/templates/user/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
};

export const createTemplate = async (userId, name, description) => {
  const response = await fetch(`${API_BASE_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, description }),
  });
  if (!response.ok) throw new Error('Failed to create template');
  return response.json();
};

// Instances
export const getInstancesByTemplate = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/instances/template/${templateId}`);
  if (!response.ok) throw new Error('Failed to fetch instances');
  return response.json();
};

export const getActiveInstances = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/instances/template/${templateId}/status/IN_PROGRESS`);
  if (!response.ok) throw new Error('Failed to fetch active instances');
  return response.json();
};

export const createInstance = async (templateId, name) => {
  const params = new URLSearchParams({ templateId, name });
  const response = await fetch(`${API_BASE_URL}/instances?${params}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to create instance');
  return response.json();
};

export const getInstance = async (instanceId) => {
  const response = await fetch(`${API_BASE_URL}/instances/${instanceId}`);
  if (!response.ok) throw new Error('Failed to fetch instance');
  return response.json();
};

export const getFieldValuesByInstance = async (instanceId) => {
  const response = await fetch(`${API_BASE_URL}/instances/${instanceId}/field-values`);
  if (!response.ok) throw new Error('Failed to fetch field values');
  return response.json();
};

export const addFieldValue = async (instanceId, templateFieldId, amount, note, entryDate, splitMode, overrideSplitRuleId, participantAmounts) => {
  const response = await fetch(`${API_BASE_URL}/instances/${instanceId}/field-values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateFieldId,
      amount,
      note,
      entryDate,
      splitMode: splitMode || 'TEMPLATE_FIELD_PERCENT_SPLIT',
      overrideSplitRuleId,
      participantAmounts
    }),
  });
  if (!response.ok) throw new Error('Failed to add field value');
  return response.json();
};

export const getTemplate = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
};

export const getTemplateFields = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}/fields`);
  if (!response.ok) throw new Error('Failed to fetch fields');
  return response.json();
};

export const getTotalForParticipant = async (instanceId, participantId) => {
  const response = await fetch(
    `${API_BASE_URL}/participant-entry-amounts/instance/${instanceId}/participant/${participantId}/total`
  );
  if (!response.ok) throw new Error('Failed to fetch total');
  return response.json();
};

export const getTemplateParticipants = async (templateId) => {
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}/participants`);
  if (!response.ok) throw new Error('Failed to fetch participants');
  return response.json();
};

export const getParticipantEntryAmountsByFieldValue = async (fieldValueId) => {
  console.log('Fetching amounts for fieldValueId:', fieldValueId);
  const response = await fetch(
    `${API_BASE_URL}/participant-entry-amounts/field-value/${fieldValueId}`
  );
  const data = await response.json();
  console.log('Response data:', data);
  console.log('Response data.data:', data.data);
  if (!response.ok) throw new Error('Failed to fetch participant amounts');
  return data;
};

export const createSplitRule = async (templateId, name) => {
  const params = new URLSearchParams({ name });
  const response = await fetch(`${API_BASE_URL}/templates/${templateId}/split-rules?${params}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to create split rule');
  return response.json();
};

export const addAllocationToRule = async (splitRuleId, participantId, percent) => {
  const params = new URLSearchParams({ participantId, percent });
  const response = await fetch(`${API_BASE_URL}/templates/split-rules/${splitRuleId}/allocations?${params}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to add allocation');
  return response.json();
};

export const deleteFieldValue = async (fieldValueId) => {
  const response = await fetch(`${API_BASE_URL}/instances/field-values/${fieldValueId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete field value');
  return response.json();
};

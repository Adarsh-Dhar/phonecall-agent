/**
 * Typed API client for stress testing
 *
 * Provides methods for all API endpoints with proper authentication
 */

class ApiClient {
  constructor(opts) {
    this.baseUrl = opts.baseUrl;
    this.jwt = opts.jwt;
    this.cookie = opts.cookie;
    this.timeout = opts.timeout || 30000;
  }

  async _request(method, path, body = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.jwt) {
      headers['Authorization'] = `Bearer ${this.jwt}`;
    } else if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const opts = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body !== null) {
      opts.body = JSON.stringify(body);
    }

    const response = await fetch(url, opts);
    const contentType = response.headers.get('content-type');

    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  }

  async get(path, options = {}) {
    return this._request('GET', path, null, options);
  }

  async post(path, body, options = {}) {
    return this._request('POST', path, body, options);
  }

  async put(path, body, options = {}) {
    return this._request('PUT', path, body, options);
  }

  async patch(path, body, options = {}) {
    return this._request('PATCH', path, body, options);
  }

  async delete(path, options = {}) {
    return this._request('DELETE', path, null, options);
  }

  // Contacts
  async searchContacts(query) {
    return this.get('/contacts/search', { headers: { 'X-Search-Query': query } });
  }

  async createContact(contact) {
    return this.post('/contacts', contact);
  }

  async updateContact(id, contact) {
    return this.patch(`/contacts/${id}`, contact);
  }

  async deleteContact(id) {
    return this.delete(`/contacts/${id}`);
  }

  async getContact(id) {
    return this.get(`/contacts/${id}`);
  }

  async listContacts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/contacts${qs ? `?${qs}` : ''}`);
  }

  async getContactBriefing(id) {
    return this.get(`/contacts/${id}/briefing`);
  }

  // Conversations
  async getConversation(id) {
    return this.get(`/conversations/${id}`);
  }

  async createConversation(conversation) {
    return this.post('/conversations', conversation);
  }

  async updateConversation(id, conversation) {
    return this.patch(`/conversations/${id}`, conversation);
  }

  async extractConversation(id) {
    return this.post(`/conversations/${id}/extract`);
  }

  async listConversations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/conversations${qs ? `?${qs}` : ''}`);
  }

  // Messages
  async createMessage(message) {
    return this.post('/messages', message);
  }

  // Calls
  async dialCall(call) {
    return this.post('/calls/dial', call);
  }

  async acceptCall(id) {
    return this.post(`/calls/${id}/accept`);
  }

  async declineCall(id) {
    return this.post(`/calls/${id}/decline`);
  }

  async endCall(id, outcome) {
    return this.post(`/calls/${id}/end`, { outcome });
  }

  async getCall(id) {
    return this.get(`/calls/${id}`);
  }

  async listCalls(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/calls${qs ? `?${qs}` : ''}`);
  }

  // Tasks
  async createTask(task) {
    return this.post('/tasks', task);
  }

  async updateTask(id, task) {
    return this.patch(`/tasks/${id}`, task);
  }

  async completeTask(id) {
    return this.post(`/tasks/${id}/complete`);
  }

  async cancelTask(id) {
    return this.post(`/tasks/${id}/cancel`);
  }

  async getTask(id) {
    return this.get(`/tasks/${id}`);
  }

  async listTasks(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/tasks${qs ? `?${qs}` : ''}`);
  }

  // Knowledge
  async upsertKnowledge(knowledge) {
    return this.post('/knowledge', knowledge);
  }

  async getKnowledge(id) {
    return this.get(`/knowledge/${id}`);
  }

  async listKnowledge(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/knowledge${qs ? `?${qs}` : ''}`);
  }

  // Approval Rules
  async createApprovalRule(rule) {
    return this.post('/approval-rules', rule);
  }

  async updateApprovalRule(id, rule) {
    return this.patch(`/approval-rules/${id}`, rule);
  }

  async deleteApprovalRule(id) {
    return this.delete(`/approval-rules/${id}`);
  }

  async getApprovalRule(id) {
    return this.get(`/approval-rules/${id}`);
  }

  async listApprovalRules(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/approval-rules${qs ? `?${qs}` : ''}`);
  }

  // Calendar
  async holdCalendarSlot(hold) {
    return this.post('/calendar/events/hold', hold);
  }

  // Account
  async getAccount(id) {
    return this.get(`/accounts/${id}`);
  }

  async updateAccount(id, account) {
    return this.patch(`/accounts/${id}`, account);
  }

  // Test control routes (/_test/*)
  async testGeminiSay(callId, text) {
    return this.post(`/_test/gemini/${callId}/say`, { text });
  }

  async testGeminiAgentSay(callId, text) {
    return this.post(`/_test/gemini/${callId}/agent-say`, { text });
  }

  async testGeminiTool(callId, tool) {
    return this.post(`/_test/gemini/${callId}/tool`, tool);
  }

  async testGeminiDrop(callId) {
    return this.post(`/_test/gemini/${callId}/drop`);
  }

  async testGeminiConnectMode(mode) {
    return this.post('/_test/gemini/connect-mode', { mode });
  }

  async testGeminiLog(callId) {
    return this.get(`/_test/gemini/${callId}/log`);
  }

  async testSchedulerAutoDial(enabled) {
    return this.post('/_test/scheduler/auto-dial', { enabled });
  }

  async testState() {
    return this.get('/_test/state');
  }

  async testBriefing(callId) {
    return this.get(`/_test/briefing/${callId}`);
  }
}

export { ApiClient };
export { ApiClient as api };

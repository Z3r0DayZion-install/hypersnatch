/**
 * WorkspaceStore.js (Phase 76)
 * Multi-workspace support with strict isolation, roles, activity feeds, and case assignments.
 */
class WorkspaceStore {
    constructor() {
        this.workspaces = new Map();
        this.activityLog = [];
    }

    createWorkspace(name, options = {}) {
        const ws = {
            id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name,
            createdAt: new Date().toISOString(),
            settings: { isolation: 'strict', ...options },
            members: [],
            cases: [],
            caseAssignments: []
        };
        this.workspaces.set(ws.id, ws);
        this._logActivity(ws.id, 'WORKSPACE_CREATED', { name });
        return ws;
    }

    addMember(workspaceId, member) {
        const ws = this.workspaces.get(workspaceId);
        if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
        const record = {
            id: member.id || `mem_${Date.now()}`,
            name: member.name,
            role: member.role || 'analyst',
            addedAt: new Date().toISOString()
        };
        ws.members.push(record);
        this._logActivity(workspaceId, 'MEMBER_ADDED', { member: record.name, role: record.role });
        return record;
    }

    assignCase(workspaceId, caseId, analystId) {
        const ws = this.workspaces.get(workspaceId);
        if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
        const assignment = {
            caseId,
            analystId,
            assignedAt: new Date().toISOString(),
            status: 'assigned'
        };
        ws.caseAssignments.push(assignment);
        this._logActivity(workspaceId, 'CASE_ASSIGNED', { caseId, analystId });
        return assignment;
    }

    listWorkspaces() {
        return Array.from(this.workspaces.values());
    }

    getWorkspace(id) {
        return this.workspaces.get(id) || null;
    }

    getActivityFeed(workspaceId = null) {
        if (workspaceId) return this.activityLog.filter(a => a.workspaceId === workspaceId);
        return this.activityLog;
    }

    _logActivity(workspaceId, action, details) {
        this.activityLog.push({
            workspaceId,
            action,
            details,
            timestamp: new Date().toISOString()
        });
    }

    getStats() {
        return {
            totalWorkspaces: this.workspaces.size,
            totalMembers: Array.from(this.workspaces.values()).reduce((s, ws) => s + ws.members.length, 0),
            totalActivities: this.activityLog.length
        };
    }
}

module.exports = WorkspaceStore;

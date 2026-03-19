/**
 * PublicationPipeline.js (Phase 83)
 * Controlled evidence publication: draft → review → approved → exported.
 * All state transitions are audited with timestamps and actors.
 */
class PublicationPipeline {
    constructor() {
        this.items = [];
        this.auditLog = [];
    }

    submit(report, author) {
        const item = {
            id: report.id || `pub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            title: report.title || 'Untitled Report',
            content: report.content || {},
            state: 'draft',
            author: author || 'system',
            history: [{ state: 'draft', timestamp: new Date().toISOString(), actor: author || 'system' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.items.push(item);
        this._auditLog('SUBMIT', item.id, author);
        return item;
    }

    transition(itemId, newState, actor) {
        const validTransitions = {
            'draft': ['review', 'rejected'],
            'review': ['approved', 'draft', 'rejected'],
            'approved': ['exported', 'review'],
            'rejected': ['draft'],
            'exported': []
        };

        const item = this.items.find(i => i.id === itemId);
        if (!item) throw new Error(`Publication ${itemId} not found`);

        const allowed = validTransitions[item.state] || [];
        if (!allowed.includes(newState)) {
            throw new Error(`Cannot transition from '${item.state}' to '${newState}'`);
        }

        item.state = newState;
        item.updatedAt = new Date().toISOString();
        item.history.push({ state: newState, timestamp: new Date().toISOString(), actor: actor || 'system' });
        this._auditLog('TRANSITION', itemId, actor, { from: item.history[item.history.length - 2].state, to: newState });
        return item;
    }

    approve(itemId, actor) { return this.transition(itemId, 'approved', actor); }
    reject(itemId, actor) { return this.transition(itemId, 'rejected', actor); }

    getByState(state) {
        return this.items.filter(i => i.state === state);
    }

    _auditLog(action, itemId, actor, details = {}) {
        this.auditLog.push({ action, itemId, actor, details, timestamp: new Date().toISOString() });
    }

    getStats() {
        return {
            total: this.items.length,
            draft: this.getByState('draft').length,
            review: this.getByState('review').length,
            approved: this.getByState('approved').length,
            exported: this.getByState('exported').length,
            rejected: this.getByState('rejected').length
        };
    }
}

module.exports = PublicationPipeline;

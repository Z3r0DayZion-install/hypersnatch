/**
 * ReviewWorkflow.js (Phase 81)
 * Structured analyst collaboration: reviewer assignment, comment threads,
 * decision states (pending/accepted/rejected), and evidence annotations.
 */
class ReviewWorkflow {
    constructor() {
        this.reviews = [];
    }

    createReview(caseId, reviewer, options = {}) {
        const review = {
            id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            caseId,
            reviewer,
            assignedBy: options.assignedBy || 'system',
            state: 'pending',
            comments: [],
            annotations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.reviews.push(review);
        return review;
    }

    comment(reviewId, author, text) {
        const r = this.reviews.find(x => x.id === reviewId);
        if (!r) throw new Error(`Review ${reviewId} not found`);
        const comment = {
            id: `cmt_${Date.now()}`,
            author,
            text,
            timestamp: new Date().toISOString()
        };
        r.comments.push(comment);
        r.updatedAt = new Date().toISOString();
        return comment;
    }

    annotate(reviewId, author, annotation) {
        const r = this.reviews.find(x => x.id === reviewId);
        if (!r) throw new Error(`Review ${reviewId} not found`);
        const ann = {
            id: `ann_${Date.now()}`,
            author,
            target: annotation.target || 'general',
            text: annotation.text,
            severity: annotation.severity || 'info',
            timestamp: new Date().toISOString()
        };
        r.annotations.push(ann);
        r.updatedAt = new Date().toISOString();
        return ann;
    }

    decide(reviewId, decision, reason) {
        const validStates = ['pending', 'accepted', 'rejected', 'deferred'];
        if (!validStates.includes(decision)) throw new Error(`Invalid state: ${decision}`);
        const r = this.reviews.find(x => x.id === reviewId);
        if (!r) throw new Error(`Review ${reviewId} not found`);
        r.state = decision;
        r.decision = { state: decision, reason, timestamp: new Date().toISOString() };
        r.updatedAt = new Date().toISOString();
        return r;
    }

    getReviewsByCase(caseId) {
        return this.reviews.filter(r => r.caseId === caseId);
    }

    getPending() {
        return this.reviews.filter(r => r.state === 'pending');
    }

    getStats() {
        return {
            totalReviews: this.reviews.length,
            pending: this.reviews.filter(r => r.state === 'pending').length,
            accepted: this.reviews.filter(r => r.state === 'accepted').length,
            rejected: this.reviews.filter(r => r.state === 'rejected').length,
            totalComments: this.reviews.reduce((s, r) => s + r.comments.length, 0)
        };
    }
}

module.exports = ReviewWorkflow;

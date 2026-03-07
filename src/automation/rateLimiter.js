/**
 * rateLimiter.js
 * Enforces cooldowns and burst limits on automation execution.
 * Standard implementation: Token Bucket.
 */

class RateLimiter {
    constructor(maxTokens = 5, msPerToken = 3000) {
        this.maxTokens = maxTokens;
        this.msPerToken = msPerToken;
        this.tokens = maxTokens;
        this.lastRefill = Date.now();
    }

    _refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = Math.floor(elapsed / this.msPerToken);

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }

    canExecute() {
        this._refill();
        return this.tokens > 0;
    }

    recordExecution() {
        this._refill();
        if (this.tokens > 0) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }
}

module.exports = new RateLimiter();

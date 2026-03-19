/**
 * HyperSnatch Phase 6: Stitch Plan
 * Generates a reconstruction plan from captured segments and MSE events.
 */

class StitchPlan {
    generate(mseEvents, networkHar) {
        const plan = {
            generated: Date.now(),
            segments: [],
            totalDuration: 0,
            gaps: []
        };

        // Logic to align HAR requests with MSE appendBuffer events
        const appends = mseEvents.filter(e => e.type === 'appendBuffer');

        appends.forEach((event, index) => {
            plan.segments.push({
                index,
                timestamp: event.timestamp,
                sbState: event.sbState,
                byteLength: event.byteLength
            });
        });

        return plan;
    }
}

module.exports = new StitchPlan();

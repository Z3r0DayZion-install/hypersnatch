
        try {
            const fs = require('fs');
            module.exports = { data: 'FAIL' };
        } catch (e) {
            module.exports = { data: 'SECURE', error: e.message };
        }
    
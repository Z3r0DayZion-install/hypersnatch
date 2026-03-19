/**
 * DeploymentProfiles.js (Phase 80)
 * Enterprise deployment controls: profiles, quotas, retention, restrictions.
 * All controls support sovereign/air-gapped/offline deployments.
 */
class DeploymentProfiles {
    constructor() {
        this.profiles = new Map([
            ['sovereign_airgap', {
                name: 'Sovereign Air-Gap',
                remote_exchange: false,
                plugins: 'disabled',
                network: 'disabled',
                signing: 'required',
                offline_only: true,
                storage_quota_mb: 10000,
                retention_days: 365
            }],
            ['enterprise_offline', {
                name: 'Enterprise Offline',
                remote_exchange: 'manual_only',
                plugins: 'approved_only',
                network: 'disabled',
                signing: 'required',
                offline_only: true,
                storage_quota_mb: 50000,
                retention_days: 180
            }],
            ['research_lab', {
                name: 'Research Lab',
                remote_exchange: 'manual_only',
                plugins: 'sandboxed',
                network: 'limited',
                signing: 'recommended',
                offline_only: false,
                storage_quota_mb: 100000,
                retention_days: 90
            }],
            ['plugin_restricted', {
                name: 'Plugin Restricted',
                remote_exchange: false,
                plugins: 'disabled',
                network: 'disabled',
                signing: 'required',
                offline_only: true,
                storage_quota_mb: 25000,
                retention_days: 270
            }],
            ['analyst_standard', {
                name: 'Analyst Standard',
                remote_exchange: 'manual_only',
                plugins: 'approved_only',
                network: 'limited',
                signing: 'recommended',
                offline_only: false,
                storage_quota_mb: 50000,
                retention_days: 120
            }]
        ]);
        this.activeProfile = null;
        this.controlState = [];
    }

    getProfile(name) {
        return this.profiles.get(name) || null;
    }

    listProfiles() {
        return Array.from(this.profiles.entries()).map(([key, val]) => ({ id: key, ...val }));
    }

    activateProfile(name) {
        const profile = this.profiles.get(name);
        if (!profile) throw new Error(`Profile '${name}' not found`);
        this.activeProfile = { id: name, ...profile, activatedAt: new Date().toISOString() };
        this.controlState.push({
            action: 'PROFILE_ACTIVATED',
            profile: name,
            timestamp: new Date().toISOString()
        });
        return this.activeProfile;
    }

    checkCompliance(action, context = {}) {
        if (!this.activeProfile) return { compliant: true, reason: 'No active profile' };

        const violations = [];

        if (action === 'remote_exchange' && this.activeProfile.remote_exchange === false) {
            violations.push({ rule: 'remote_exchange_disabled', reason: 'Air-gap profile blocks remote exchange' });
        }

        if (action === 'load_plugin' && this.activeProfile.plugins === 'disabled') {
            violations.push({ rule: 'plugins_disabled', reason: 'Plugin loading is disabled in this profile' });
        }

        if (action === 'network_access' && this.activeProfile.network === 'disabled') {
            violations.push({ rule: 'network_disabled', reason: 'Network access is disabled in this profile' });
        }

        return {
            compliant: violations.length === 0,
            violations,
            profile: this.activeProfile.id,
            timestamp: new Date().toISOString()
        };
    }

    getQuotaReport() {
        if (!this.activeProfile) return null;
        return {
            profile: this.activeProfile.id,
            storage_quota_mb: this.activeProfile.storage_quota_mb,
            retention_days: this.activeProfile.retention_days,
            timestamp: new Date().toISOString(),
            deterministic: true
        };
    }

    getStats() {
        return {
            totalProfiles: this.profiles.size,
            activeProfile: this.activeProfile ? this.activeProfile.id : 'none',
            controlActions: this.controlState.length
        };
    }
}

module.exports = DeploymentProfiles;

Phase 61 introduces the HyperQuery Engine.

Purpose:
Allow analysts to query bundles, infrastructure fingerprints, and intelligence graph relationships.

Example queries:

SELECT bundles WHERE cdn="cloudfront"
SELECT bundles WHERE similarity(bundle_22) > 80
SELECT players GROUP BY protocol

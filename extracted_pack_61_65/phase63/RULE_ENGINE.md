Phase 63 introduces the Detection Rule Engine.

Example rule:

IF protocol="dash"
AND token_ttl < 60
AND cdn="akamai"
THEN flag "short ttl token"

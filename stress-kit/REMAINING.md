# Stress harness: what is done and what is left

## Done in this patch (verified here where noted)
- Max call duration is enforced: callLifecycle.ts hangs up at MAX_CALL_DURATION_MINUTES (outcome needs_user, socket closed). Parses OK; NOT run.
- H0 rewritten: 6 runner-honesty checks (RUN here: all pass) + 7 infra checks (need a live server).
- P1 (silent line), P2 (13 end_call checks), P7 (cap, junk frames, 1009) written against the real fake-Gemini control plane. NOT run: need Postgres + server.
- run-all.mjs: a scenario that records zero checks now FAILS instead of vanishing.
- server.mjs passes MAX_CALL_DURATION_MINUTES (default 1) to the test server.
- tokens.json deleted; known-issues entry P2-invalid-date removed (fixed by endCallArgs.ts).

## First run
    node run-all.mjs H0 P2 P1 P7
Expected: H0 and P2 all PASS. P1 may FAIL on call-row-closed / rejoin: that would be a real finding, not a harness bug.

## Still stubs (they will FAIL "no assertions", which is correct)
M1-M7, N1-N4, P3-P6, X1-X3. Each needs real drives and assertions, per the plan:
- P3 rulebook: fake model ignores rules; assert systemInstruction (GET /_test/gemini/:id/log) contains the owner rules.
- P4 question unanswered: tool ask_user with no owner reply; assert USER_UNAVAILABLE and the call continues.
- P5 fast talker: 50 say() calls in 1s; assert no crash, transcript order preserved (Message.seq).
- P6 social engineer: say() attempts to extract owner info; assert tool responses never leak owner-only knowledge.
- M*: drive fakeNebius modes (fenced, truncated, garbled) and assert on Task/Knowledge rows.

## Operator actions
- Rotate JWT_SECRET if tokens.json was ever pushed to a remote.
- Requires: Postgres DB whose name contains _test, TEST_DATABASE_URL, JWT_SECRET, pnpm install, TEST_MODE build for dist/testing/fakeGemini.mjs.

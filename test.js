/**
 * Pre-deployment test suite for Notes API
 * Tests every endpoint from the assignment spec + edge cases
 * Run: node test.js
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let token1 = '';
let token2 = '';
let noteId = '';
const testEmail1 = `testuser_${Date.now()}@example.com`;
const testEmail2 = `testuser2_${Date.now()}@example.com`;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${name}${detail ? ' → ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(55));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testMeta() {
  section('1. META ENDPOINTS');

  // GET /about
  const about = await req('GET', '/about');
  assert('GET /about → 200', about.status === 200);
  assert('GET /about has name', typeof about.data?.name === 'string');
  assert('GET /about has email', typeof about.data?.email === 'string');
  assert('GET /about has my_features', typeof about.data?.my_features === 'object');

  // GET /openapi.json
  const spec = await req('GET', '/openapi.json');
  assert('GET /openapi.json → 200', spec.status === 200);
  assert('GET /openapi.json has openapi field', spec.data?.openapi === '3.0.0');
  assert('GET /openapi.json has paths', typeof spec.data?.paths === 'object');

  // GET /docs (Swagger UI)
  const docsRes = await fetch(`${BASE_URL}/docs`);
  assert('GET /docs → 200 (Swagger UI)', docsRes.status === 200);
}

async function testRegister() {
  section('2. REGISTER  POST /register');

  // Valid registration user 1
  const r1 = await req('POST', '/register', { email: testEmail1, password: 'password123' });
  assert('Register user1 → 201', r1.status === 201);
  assert('Register user1 has message', !!r1.data?.message);

  // Valid registration user 2
  const r2 = await req('POST', '/register', { email: testEmail2, password: 'password123' });
  assert('Register user2 → 201', r2.status === 201);

  // Duplicate email → 409
  const dup = await req('POST', '/register', { email: testEmail1, password: 'password123' });
  assert('Duplicate email → 409', dup.status === 409);

  // Missing email → 400
  const noEmail = await req('POST', '/register', { password: 'password123' });
  assert('Missing email → 400', noEmail.status === 400);

  // Missing password → 400
  const noPass = await req('POST', '/register', { email: 'x@x.com' });
  assert('Missing password → 400', noPass.status === 400);

  // Invalid email format → 400
  const badEmail = await req('POST', '/register', { email: 'notanemail', password: 'password123' });
  assert('Invalid email format → 400', badEmail.status === 400);

  // Short password → 400
  const shortPass = await req('POST', '/register', { email: 'new@x.com', password: '123' });
  assert('Password too short → 400', shortPass.status === 400);

  // Empty body → 400
  const empty = await req('POST', '/register', {});
  assert('Empty body → 400', empty.status === 400);
}

async function testLogin() {
  section('3. LOGIN  POST /login');

  // Valid login user1
  const l1 = await req('POST', '/login', { email: testEmail1, password: 'password123' });
  assert('Login user1 → 200', l1.status === 200);
  assert('Login returns access_token', !!l1.data?.access_token);
  token1 = l1.data?.access_token;

  // Valid login user2
  const l2 = await req('POST', '/login', { email: testEmail2, password: 'password123' });
  assert('Login user2 → 200', l2.status === 200);
  token2 = l2.data?.access_token;

  // Wrong password → 401
  const wrongPass = await req('POST', '/login', { email: testEmail1, password: 'wrongpass' });
  assert('Wrong password → 401', wrongPass.status === 401);
  assert('Wrong password message correct', wrongPass.data?.message === 'Invalid email or password');

  // Non-existent email → 401
  const noUser = await req('POST', '/login', { email: 'ghost@x.com', password: 'password123' });
  assert('Non-existent user → 401', noUser.status === 401);

  // Missing fields → 400
  const noFields = await req('POST', '/login', {});
  assert('Missing fields → 400', noFields.status === 400);
}

async function testCreateNote() {
  section('4. CREATE NOTE  POST /notes');

  // Valid create
  const c1 = await req('POST', '/notes', { title: 'Test Note', content: 'Hello world' }, token1);
  assert('Create note → 201', c1.status === 201);
  assert('Create note has id', !!c1.data?.id);
  assert('Create note has title', c1.data?.title === 'Test Note');
  assert('Create note has content', c1.data?.content === 'Hello world');
  assert('Create note has created_at', !!c1.data?.created_at);
  assert('Create note has updated_at', !!c1.data?.updated_at);
  assert('Create note has isPinned=false', c1.data?.isPinned === false);
  noteId = c1.data?.id;

  // No auth → 401
  const noAuth = await req('POST', '/notes', { title: 'T', content: 'C' });
  assert('Create note no auth → 401', noAuth.status === 401);

  // Missing title → 400
  const noTitle = await req('POST', '/notes', { content: 'C' }, token1);
  assert('Create note missing title → 400', noTitle.status === 400);

  // Missing content → 400
  const noContent = await req('POST', '/notes', { title: 'T' }, token1);
  assert('Create note missing content → 400', noContent.status === 400);

  // Empty title → 400
  const emptyTitle = await req('POST', '/notes', { title: '', content: 'C' }, token1);
  assert('Create note empty title → 400', emptyTitle.status === 400);

  // Invalid token → 401
  const badToken = await req('POST', '/notes', { title: 'T', content: 'C' }, 'bad.token.here');
  assert('Create note invalid token → 401', badToken.status === 401);
}

async function testGetAllNotes() {
  section('5. GET ALL NOTES  GET /notes');

  // Create a second note for pagination test
  await req('POST', '/notes', { title: 'Second Note', content: 'Content 2' }, token1);

  const all = await req('GET', '/notes', null, token1);
  assert('GET /notes → 200', all.status === 200);
  assert('GET /notes returns data array', Array.isArray(all.data?.data));
  assert('GET /notes has pagination', !!all.data?.pagination);
  assert('GET /notes has at least 2 notes', all.data?.data?.length >= 2);
  assert('GET /notes pagination has total', typeof all.data?.pagination?.total === 'number');
  assert('GET /notes pagination has totalPages', typeof all.data?.pagination?.totalPages === 'number');

  // Pagination params
  const paged = await req('GET', '/notes?page=1&limit=1', null, token1);
  assert('GET /notes?limit=1 returns 1 note', paged.data?.data?.length === 1);
  assert('GET /notes?limit=1 pagination correct', paged.data?.pagination?.limit === 1);

  // No auth → 401
  const noAuth = await req('GET', '/notes');
  assert('GET /notes no auth → 401', noAuth.status === 401);

  // User2 should see 0 notes (hasn't created any)
  const user2Notes = await req('GET', '/notes', null, token2);
  assert('GET /notes user2 sees 0 notes initially', user2Notes.data?.data?.length === 0);
}

async function testGetNoteById() {
  section('6. GET NOTE BY ID  GET /notes/:id');

  // Valid get
  const get = await req('GET', `/notes/${noteId}`, null, token1);
  assert('GET /notes/:id → 200', get.status === 200);
  assert('GET /notes/:id returns correct note', get.data?.id === noteId);

  // User2 cannot access user1 note → 403
  const forbidden = await req('GET', `/notes/${noteId}`, null, token2);
  assert('GET /notes/:id other user → 403', forbidden.status === 403);

  // Non-existent note → 404
  const notFound = await req('GET', '/notes/00000000-0000-0000-0000-000000000000', null, token1);
  assert('GET /notes/:id not found → 404', notFound.status === 404);

  // No auth → 401
  const noAuth = await req('GET', `/notes/${noteId}`);
  assert('GET /notes/:id no auth → 401', noAuth.status === 401);
}

async function testUpdateNote() {
  section('7. UPDATE NOTE  PUT /notes/:id');

  // Valid update
  const upd = await req('PUT', `/notes/${noteId}`, { title: 'Updated Title', content: 'Updated content' }, token1);
  assert('PUT /notes/:id → 200', upd.status === 200);
  assert('PUT /notes/:id title updated', upd.data?.title === 'Updated Title');
  assert('PUT /notes/:id content updated', upd.data?.content === 'Updated content');

  // Partial update (only title)
  const partial = await req('PUT', `/notes/${noteId}`, { title: 'Only Title Changed' }, token1);
  assert('PUT /notes/:id partial update → 200', partial.status === 200);
  assert('PUT /notes/:id partial title correct', partial.data?.title === 'Only Title Changed');

  // User2 cannot update user1 note → 403
  const forbidden = await req('PUT', `/notes/${noteId}`, { title: 'Hack' }, token2);
  assert('PUT /notes/:id other user → 403', forbidden.status === 403);

  // No fields → 400
  const noFields = await req('PUT', `/notes/${noteId}`, {}, token1);
  assert('PUT /notes/:id no fields → 400', noFields.status === 400);

  // Empty title → 400
  const emptyTitle = await req('PUT', `/notes/${noteId}`, { title: '' }, token1);
  assert('PUT /notes/:id empty title → 400', emptyTitle.status === 400);

  // Non-existent → 404
  const notFound = await req('PUT', '/notes/00000000-0000-0000-0000-000000000000', { title: 'X' }, token1);
  assert('PUT /notes/:id not found → 404', notFound.status === 404);

  // No auth → 401
  const noAuth = await req('PUT', `/notes/${noteId}`, { title: 'X' });
  assert('PUT /notes/:id no auth → 401', noAuth.status === 401);
}

async function testShareNote() {
  section('8. SHARE NOTE  POST /notes/:id/share');

  // Valid share
  const share = await req('POST', `/notes/${noteId}/share`, { share_with_email: testEmail2 }, token1);
  assert('POST /notes/:id/share → 200', share.status === 200);
  assert('POST /notes/:id/share has message', !!share.data?.message);

  // After sharing, user2 can access the note
  const access = await req('GET', `/notes/${noteId}`, null, token2);
  assert('Shared note accessible by user2 → 200', access.status === 200);
  assert('Shared note correct id', access.data?.id === noteId);

  // Shared note appears in user2 GET /notes
  const user2Notes = await req('GET', '/notes', null, token2);
  const found = user2Notes.data?.data?.some(n => n.id === noteId);
  assert('Shared note appears in user2 notes list', found === true);

  // Share again (idempotent) → 200
  const shareAgain = await req('POST', `/notes/${noteId}/share`, { share_with_email: testEmail2 }, token1);
  assert('Share same note again → 200 (idempotent)', shareAgain.status === 200);

  // Share with self → 400
  const shareSelf = await req('POST', `/notes/${noteId}/share`, { share_with_email: testEmail1 }, token1);
  assert('Share with self → 400', shareSelf.status === 400);

  // Share with non-existent user → 404
  const noUser = await req('POST', `/notes/${noteId}/share`, { share_with_email: 'ghost@nowhere.com' }, token1);
  assert('Share with non-existent user → 404', noUser.status === 404);

  // User2 cannot share user1 note → 403
  const forbidden = await req('POST', `/notes/${noteId}/share`, { share_with_email: testEmail2 }, token2);
  assert('Share by non-owner → 403', forbidden.status === 403);

  // Missing share_with_email → 400
  const noEmail = await req('POST', `/notes/${noteId}/share`, {}, token1);
  assert('Share missing email → 400', noEmail.status === 400);

  // Invalid email format → 400
  const badEmail = await req('POST', `/notes/${noteId}/share`, { share_with_email: 'notanemail' }, token1);
  assert('Share invalid email format → 400', badEmail.status === 400);

  // No auth → 401
  const noAuth = await req('POST', `/notes/${noteId}/share`, { share_with_email: testEmail2 });
  assert('Share no auth → 401', noAuth.status === 401);
}

async function testPinNote() {
  section('9. PIN NOTE (Custom Feature)  PATCH /notes/:id/pin');

  // Pin note
  const pin = await req('PATCH', `/notes/${noteId}/pin`, null, token1);
  assert('PATCH /notes/:id/pin → 200', pin.status === 200);
  assert('Note is now pinned', pin.data?.isPinned === true);

  // Unpin note
  const unpin = await req('PATCH', `/notes/${noteId}/pin`, null, token1);
  assert('PATCH /notes/:id/pin toggle → 200', unpin.status === 200);
  assert('Note is now unpinned', unpin.data?.isPinned === false);

  // Pin again and verify pinned notes appear first
  await req('PATCH', `/notes/${noteId}/pin`, null, token1);
  const notes = await req('GET', '/notes', null, token1);
  assert('Pinned note appears first in list', notes.data?.data?.[0]?.isPinned === true);

  // User2 cannot pin user1 note → 403
  const forbidden = await req('PATCH', `/notes/${noteId}/pin`, null, token2);
  assert('Pin by non-owner → 403', forbidden.status === 403);

  // No auth → 401
  const noAuth = await req('PATCH', `/notes/${noteId}/pin`);
  assert('Pin no auth → 401', noAuth.status === 401);
}

async function testSearch() {
  section('10. SEARCH  GET /search?q=');

  // Create a uniquely named note to search for
  await req('POST', '/notes', { title: 'Meeting agenda XYZ123', content: 'Discuss quarterly results' }, token1);
  await req('POST', '/notes', { title: 'Shopping list', content: 'Milk XYZ123 eggs bread' }, token1);

  // Search by title keyword
  const s1 = await req('GET', '/search?q=XYZ123', null, token1);
  assert('GET /search?q= → 200', s1.status === 200);
  assert('GET /search returns array', Array.isArray(s1.data));
  assert('GET /search finds notes by title', s1.data?.length >= 1);

  // Search by content keyword
  const s2 = await req('GET', '/search?q=quarterly', null, token1);
  assert('GET /search finds by content', s2.data?.length >= 1);

  // Case-insensitive search
  const s3 = await req('GET', '/search?q=xyz123', null, token1);
  assert('GET /search is case-insensitive', s3.data?.length >= 1);

  // Search shared notes (user2 searches for shared note)
  const s4 = await req('GET', '/search?q=Only Title Changed', null, token2);
  assert('GET /search includes shared notes', s4.data?.length >= 1);

  // No results
  const s5 = await req('GET', '/search?q=ZZZNORESULTZZZ', null, token1);
  assert('GET /search no results returns empty array', Array.isArray(s5.data) && s5.data.length === 0);

  // Missing q → 400
  const noQ = await req('GET', '/search', null, token1);
  assert('GET /search missing q → 400', noQ.status === 400);

  // Empty q → 400
  const emptyQ = await req('GET', '/search?q=', null, token1);
  assert('GET /search empty q → 400', emptyQ.status === 400);

  // No auth → 401
  const noAuth = await req('GET', '/search?q=test');
  assert('GET /search no auth → 401', noAuth.status === 401);
}

async function testDeleteNote() {
  section('11. DELETE NOTE  DELETE /notes/:id');

  // Create a note to delete
  const created = await req('POST', '/notes', { title: 'To Delete', content: 'bye' }, token1);
  const delId = created.data?.id;

  // User2 cannot delete user1 note → 403
  const forbidden = await req('DELETE', `/notes/${delId}`, null, token2);
  assert('DELETE /notes/:id other user → 403', forbidden.status === 403);

  // Valid delete
  const del = await req('DELETE', `/notes/${delId}`, null, token1);
  assert('DELETE /notes/:id → 204', del.status === 204);

  // Deleted note no longer accessible → 404
  const gone = await req('GET', `/notes/${delId}`, null, token1);
  assert('Deleted note → 404', gone.status === 404);

  // Delete non-existent → 404
  const notFound = await req('DELETE', '/notes/00000000-0000-0000-0000-000000000000', null, token1);
  assert('DELETE non-existent → 404', notFound.status === 404);

  // No auth → 401
  const noAuth = await req('DELETE', `/notes/${noteId}`);
  assert('DELETE /notes/:id no auth → 401', noAuth.status === 401);
}

async function testInvalidUUID() {
  section('12. INVALID UUID VALIDATION (Step 16)');

  // Non-UUID string → 400
  const r1 = await req('GET', '/notes/123', null, token1);
  assert('GET /notes/123 (invalid UUID) → 400', r1.status === 400);
  assert('GET /notes/123 has message', !!r1.data?.message);

  const r2 = await req('PUT', '/notes/abc', { title: 'X' }, token1);
  assert('PUT /notes/abc (invalid UUID) → 400', r2.status === 400);

  const r3 = await req('DELETE', '/notes/not-a-uuid', null, token1);
  assert('DELETE /notes/not-a-uuid (invalid UUID) → 400', r3.status === 400);

  const r4 = await req('POST', '/notes/badid/share', { share_with_email: 'x@x.com' }, token1);
  assert('POST /notes/badid/share (invalid UUID) → 400', r4.status === 400);

  const r5 = await req('PATCH', '/notes/badid/pin', null, token1);
  assert('PATCH /notes/badid/pin (invalid UUID) → 400', r5.status === 400);
}

async function testAuthEdgeCases() {
  section('13. AUTH EDGE CASES');

  // Expired/malformed token
  const bad = await req('GET', '/notes', null, 'eyJhbGciOiJIUzI1NiJ9.bad.payload');
  assert('Malformed token → 401', bad.status === 401);

  // No Bearer prefix
  const res = await fetch(`${BASE_URL}/notes`, {
    headers: { 'Authorization': token1 }
  });
  assert('Token without Bearer prefix → 401', res.status === 401);

  // Unknown route → 404
  const unknown = await req('GET', '/unknown-route');
  assert('Unknown route → 404', unknown.status === 404);
}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║         NOTES API — PRE-DEPLOYMENT TEST SUITE         ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test users: ${testEmail1}`);
  console.log(`              ${testEmail2}`);

  try {
    await testMeta();
    await testRegister();
    await testLogin();
    await testCreateNote();
    await testGetAllNotes();
    await testGetNoteById();
    await testUpdateNote();
    await testShareNote();
    await testPinNote();
    await testSearch();
    await testDeleteNote();
    await testInvalidUUID();
    await testAuthEdgeCases();
  } catch (err) {
    console.error('\n💥 Test runner crashed:', err.message);
  }

  const total = passed + failed;
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed}/${total} passed  ${failed > 0 ? `(${failed} FAILED)` : '(ALL PASSED ✅)'}`.padEnd(56) + '║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  if (failed > 0) process.exit(1);
}

run();

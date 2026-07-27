/**
 * AI 윤리 법정 — Apps Script 범용 API 라우터 (M1)
 *
 * 계약: app/src/api/contract.ts 와 1:1 (기획안 §5). 변경 시 양쪽을 함께 수정할 것.
 *
 * [설치]
 * 1) 새 Google 스프레드시트를 만든다 (탭은 스크립트가 자동 생성).
 * 2) 확장 프로그램 > Apps Script 를 열고 이 파일 전체를 붙여넣는다.
 * 3) 편집기 상단에서 함수 `setup` 을 선택해 1회 실행한다.
 *    → 권한 승인 후, 실행 로그에 표시되는 "교사 키"를 복사해 앱에 등록한다.
 * 4) 배포 > 새 배포 > 유형 "웹 앱" / 실행: "나" / 액세스: "모든 사용자" 로 배포한다.
 *    → 웹 앱 URL 을 복사해 앱의 설치 마법사에 붙여넣는다.
 *
 * [중요 — 재사용 원칙]
 * 코드 수정 후에는 "새 배포"를 만들지 말 것. 배포 관리에서 기존 배포를 편집해
 * 버전만 갱신해야 URL이 바뀌지 않는다 (기획안 §13-4).
 */

var VERSION = '1.1.1-M3';

/** 증분 폴링 오버랩(ms) — 읽기 스냅숏과 boardVersion 시각 사이 경계 유실 방지 (중복은 클라이언트 병합으로 흡수) */
var SINCE_OVERLAP_MS = 30000;

var HEADERS = {
  Sessions: ['session_id', 'code', 'title', 'mode', 'status', 'class_name', 'situation_board', 'questions_json', 'roles_json', 'team_assign', 'team_count', 'show_likes', 'created_at', 'updated_at'],
  Students: ['session_id', 'student_id', 'name', 'team', 'role_id', 'joined_at'],
  Submissions: ['submission_id', 'session_id', 'student_id', 'student_name', 'team', 'role_id', 'mode', 'status', 'fields_json', 'pin', 'teacher_note', 'created_at', 'updated_at'],
  Comments: ['comment_id', 'session_id', 'submission_id', 'author_student_id', 'author_name', 'author_team', 'text', 'status', 'created_at'],
  Likes: ['session_id', 'submission_id', 'student_id', 'created_at']
};

/** 설치 마법사 3단계에서 1회 실행 — 탭 생성 + 교사 키 발급/표시 */
function setup() {
  ensureTabs();
  var key = getOrCreateTeacherKey();
  Logger.log('=====================================');
  Logger.log('교사 키 (teacherKey): ' + key);
  Logger.log('이 키를 복사해 앱의 [교사] 화면에 등록하세요.');
  Logger.log('=====================================');
  try {
    SpreadsheetApp.getUi().alert('교사 키: ' + key + '\n\n이 키를 복사해 앱의 [교사] 화면에 등록하세요.');
  } catch (e) { /* 편집기에서 실행하면 UI가 없을 수 있음 — 로그로 확인 */ }
  return key;
}

/** 키 재발급 (유출 의심 시 실행 후 앱에 새 키 등록) */
function regenerateTeacherKey() {
  var key = makeId('key') + makeId('x').slice(2);
  PropertiesService.getScriptProperties().setProperty('teacherKey', key);
  Logger.log('새 교사 키: ' + key);
  return key;
}

function getOrCreateTeacherKey() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('teacherKey');
  if (!key) {
    key = makeId('key') + makeId('x').slice(2);
    props.setProperty('teacherKey', key);
  }
  return key;
}

// ================= 진입점 =================

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    ensureTabs();
    switch (p.action) {
      case 'ping':
        return out(ok({ version: VERSION }));
      case 'getSession':
        return out(ok(getSession(p)));
      case 'getBoard':
        return out(ok(getBoard(p)));
      case 'getTeacherBoard':
        requireTeacher(p);
        return out(ok(getTeacherBoard(p)));
      case 'listSessions':
        requireTeacher(p);
        return out(ok(listSessions()));
      case 'getStudentStats': // M3 — 학기말 학생별 누적 집계 (기획안 §9)
        requireTeacher(p);
        return out(ok(getStudentStats(p)));
      default:
        return out(fail('NOT_FOUND', '알 수 없는 액션입니다: ' + p.action));
    }
  } catch (err) {
    return out(fail(err.apiCode || 'VALIDATION', err.message || String(err)));
  }
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents); // text/plain 바디 (기획안 §5.1 CORS 우회)
  } catch (err) {
    return out(fail('VALIDATION', '요청 본문이 올바르지 않습니다.'));
  }
  var action = body.action;
  var p = body.payload || {};
  if (action === 'ping') return out(ok({ version: VERSION }));

  // 모든 쓰기 액션은 ScriptLock (기획안 §5.1)
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return out(fail('BUSY', '서버가 바쁩니다. 잠시 후 다시 시도하세요.'));
  }
  try {
    ensureTabs();
    var data;
    switch (action) {
      // 교사 액션 — teacherKey 필수
      case 'createSession': requireTeacher(p); data = createSession(p); break;
      case 'updateSession': requireTeacher(p); data = updateSession(p); break;
      case 'assignTeams': requireTeacher(p); data = assignTeams(p); break;
      case 'setVerdict': requireTeacher(p); data = setVerdict(p); break;
      case 'adminEdit': requireTeacher(p); data = adminEdit(p); break;
      // 학생 액션
      case 'join': data = join(p); break;
      case 'saveDraft': data = saveDraft(p); break;
      case 'submitOpinion': data = submitOpinion(p); break;
      case 'updateSubmission': data = updateSubmission(p); break;
      case 'addComment': data = addComment(p); break;
      case 'toggleLike': data = toggleLike(p); break;
      default:
        return out(fail('NOT_FOUND', '알 수 없는 액션입니다: ' + action));
    }
    return out(ok(data));
  } catch (err) {
    return out(fail(err.apiCode || 'VALIDATION', err.message || String(err)));
  } finally {
    lock.releaseLock();
  }
}

// ================= 교사 액션 =================

function createSession(p) {
  var sessions = readRows('Sessions');
  var activeCodes = {};
  sessions.forEach(function (s) {
    if (s.status === 'draft' || s.status === 'open') activeCodes[s.code] = true;
  });
  var code = makeCode();
  while (activeCodes[code]) code = makeCode();
  var now = nowIso();
  var session = {
    session_id: makeId('ses'),
    code: code,
    title: p.title || '',
    mode: p.mode || 'truth',
    status: 'draft',
    class_name: p.class_name || '',
    situation_board: p.situation_board || '',
    questions_json: JSON.stringify(p.questions || {}),
    roles_json: JSON.stringify(p.roles || []),
    team_assign: p.team_assign || 'random',
    team_count: String(p.team_count || 6),
    show_likes: 'TRUE',
    created_at: now,
    updated_at: now
  };
  appendObj('Sessions', session);
  return { session: session };
}

function updateSession(p) {
  var found = findRow('Sessions', 'session_id', p.sessionId);
  if (!found) throw apiErr('NOT_FOUND', '사건을 찾을 수 없습니다.');
  var patch = p.patch || {};
  var allowed = ['title', 'situation_board', 'status', 'team_assign', 'class_name'];
  allowed.forEach(function (k) {
    if (patch[k] !== undefined) found.obj[k] = patch[k];
  });
  if (patch.questions !== undefined) found.obj.questions_json = JSON.stringify(patch.questions);
  if (patch.team_count !== undefined) found.obj.team_count = String(patch.team_count);
  // M3: 공감 수 학생 노출 옵션 (기획안 R23 show_likes) — 시트에는 'TRUE'/'FALSE' 문자열로 저장
  if (patch.show_likes !== undefined) {
    var offValue = patch.show_likes === false || String(patch.show_likes).toUpperCase() === 'FALSE';
    found.obj.show_likes = offValue ? 'FALSE' : 'TRUE';
  }
  found.obj.updated_at = nowIso();
  writeRow('Sessions', found.row, found.obj);
  return { session: stripRowMeta(found.obj) };
}

function assignTeams(p) {
  var session = mustSession(p.sessionId);
  var students = readRows('Students').filter(function (s) { return s.session_id === p.sessionId; });
  if (p.mode === 'random') {
    var shuffled = students.slice().sort(function () { return Math.random() - 0.5; });
    var count = Math.max(1, Number(session.obj.team_count) || 1);
    shuffled.forEach(function (st, i) {
      st.team = String((i % count) + 1) + '모둠';
      writeRow('Students', st.__row, st);
    });
  } else {
    (p.assignments || []).forEach(function (a) {
      var st = students.filter(function (m) { return m.student_id === String(a.studentId); })[0];
      if (st) {
        st.team = a.team;
        if (a.roleId !== undefined) st.role_id = a.roleId;
        writeRow('Students', st.__row, st);
      }
    });
  }
  // 기존 의견서에 모둠 반영
  var subs = readRows('Submissions').filter(function (s) { return s.session_id === p.sessionId; });
  subs.forEach(function (sub) {
    var st = students.filter(function (m) { return m.student_id === sub.student_id; })[0];
    if (st && sub.team !== st.team) {
      sub.team = st.team;
      writeRow('Submissions', sub.__row, sub);
    }
  });
  return { students: students.map(stripRowMeta) };
}

function setVerdict(p) {
  var found = findRow('Submissions', 'submission_id', p.submissionId);
  if (!found || found.obj.status === 'deleted') throw apiErr('NOT_FOUND', '의견서를 찾을 수 없습니다.');
  if (p.verdict !== 'approved' && p.verdict !== 'rejected') throw apiErr('VALIDATION', '판결 값이 올바르지 않습니다.');
  found.obj.status = p.verdict;
  found.obj.teacher_note = p.note || '';
  found.obj.updated_at = nowIso();
  writeRow('Submissions', found.row, found.obj);
  return { submission: toClientSubmission(found.obj) };
}

function adminEdit(p) {
  var tab = p.target === 'submission' ? 'Submissions' : 'Comments';
  var idCol = p.target === 'submission' ? 'submission_id' : 'comment_id';
  var found = findRow(tab, idCol, p.id);
  if (!found) throw apiErr('NOT_FOUND', '대상을 찾을 수 없습니다.');
  var patch = p.patch || {};
  Object.keys(patch).forEach(function (k) {
    if (HEADERS[tab].indexOf(k) >= 0) found.obj[k] = patch[k];
  });
  if (found.obj.updated_at !== undefined) found.obj.updated_at = nowIso();
  writeRow(tab, found.row, found.obj);
  return { updated: true };
}

function listSessions() {
  var sessions = readRows('Sessions').map(stripRowMeta);
  sessions.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
  return { sessions: sessions };
}

function getTeacherBoard(p) {
  mustSession(p.sessionId);
  var submissions = readRows('Submissions')
    .filter(function (s) { return s.session_id === p.sessionId && s.status !== 'deleted'; })
    .map(toClientSubmission);
  var comments = readRows('Comments')
    .filter(function (c) { return c.session_id === p.sessionId && c.status === 'active'; })
    .map(stripRowMeta);
  var likeCounts = {};
  readRows('Likes').forEach(function (l) {
    if (l.session_id === p.sessionId) likeCounts[l.submission_id] = (likeCounts[l.submission_id] || 0) + 1;
  });
  var students = readRows('Students')
    .filter(function (s) { return s.session_id === p.sessionId; })
    .map(stripRowMeta);
  return { submissions: submissions, comments: comments, likeCounts: likeCounts, myLikes: [], boardVersion: 0, students: students };
}

// ================= 학생 액션 =================

function join(p) {
  var sessions = readRows('Sessions').filter(function (s) {
    return s.code === String(p.code) && (s.status === 'draft' || s.status === 'open');
  });
  var session = sessions[0];
  if (!session) throw apiErr('NOT_FOUND', '해당 코드의 사건이 없습니다. 코드를 확인하세요.');
  if (session.status === 'draft') throw apiErr('CLOSED', '아직 개정 전인 사건입니다. 선생님의 안내를 기다리세요.');

  var studentId = String(p.studentId);
  var all = readRows('Students');
  var mine = all.filter(function (s) { return s.session_id === session.session_id && s.student_id === studentId; })[0];

  if (mine) {
    // 재입장 — 행 재사용. 이름 불일치 경고 (기획안 §12 #6)
    if (mine.name !== p.name && !p.confirmName) {
      throw apiErr('NAME_MISMATCH', "이미 '" + mine.name + "'(으)로 입장한 학번입니다. 본인의 학번이 맞는지 확인하세요.");
    }
    if (p.confirmName && mine.name !== p.name) {
      mine.name = p.name;
      writeRow('Students', mine.__row, mine);
    }
  } else {
    var team = '';
    if (session.team_assign === 'random') {
      var counts = {};
      var teamCount = Math.max(1, Number(session.team_count) || 1);
      for (var i = 1; i <= teamCount; i++) counts[String(i) + '모둠'] = 0;
      all.forEach(function (s) {
        if (s.session_id === session.session_id && counts[s.team] !== undefined) counts[s.team]++;
      });
      var best = '1모둠', min = Infinity;
      Object.keys(counts).forEach(function (t) {
        if (counts[t] < min) { min = counts[t]; best = t; }
      });
      team = best;
    }
    mine = {
      session_id: session.session_id,
      student_id: studentId,
      name: p.name,
      team: team,
      role_id: '',
      joined_at: nowIso()
    };
    appendObj('Students', mine);
  }

  var mySub = readRows('Submissions').filter(function (s) {
    return s.session_id === session.session_id && s.student_id === studentId && s.status !== 'deleted';
  })[0];

  return {
    session: stripRowMeta(session),
    student: stripRowMeta(mine),
    mySubmission: mySub ? toClientSubmission(mySub) : null
  };
}

function saveDraft(p) {
  var session = mustSession(p.sessionId);
  requireWritable(session.obj);
  var studentId = String(p.studentId);
  var existing = readRows('Submissions').filter(function (s) {
    return s.session_id === p.sessionId && s.student_id === studentId && s.status !== 'deleted';
  })[0];
  var now = nowIso();
  if (existing) {
    if (existing.status !== 'draft') throw apiErr('VALIDATION', '이미 제출된 의견서입니다. 수정은 PIN으로 진행하세요.');
    existing.fields_json = JSON.stringify(p.fields || {});
    if (p.pin) existing.pin = String(p.pin);
    existing.updated_at = now;
    writeRow('Submissions', existing.__row, existing);
    return { submissionId: existing.submission_id, status: 'draft', updated_at: now };
  }
  var student = findStudent(p.sessionId, studentId);
  var sub = newSubmission(session.obj, student, studentId, p.fields, p.pin || '', 'draft', now);
  appendObj('Submissions', sub);
  return { submissionId: sub.submission_id, status: 'draft', updated_at: now };
}

function submitOpinion(p) {
  var session = mustSession(p.sessionId);
  requireWritable(session.obj);
  if (!/^\d{4}$/.test(String(p.pin))) throw apiErr('VALIDATION', 'PIN은 4자리 숫자여야 합니다.');
  validateFields(p.fields);
  var studentId = String(p.studentId);
  var existing = readRows('Submissions').filter(function (s) {
    return s.session_id === p.sessionId && s.student_id === studentId && s.status !== 'deleted';
  })[0];
  var now = nowIso();
  var student = findStudent(p.sessionId, studentId);
  if (existing) {
    // M3(P2-2): 역할 배정 전 서버 draft로 시작한 경우 대비 — 제출 시점의 모둠·역할 재스냅숏
    if (student) {
      existing.team = student.team;
      existing.role_id = student.role_id;
      existing.student_name = student.name;
    }
    existing.fields_json = JSON.stringify(p.fields || {});
    existing.pin = String(p.pin);
    existing.status = 'submitted';
    existing.updated_at = now;
    writeRow('Submissions', existing.__row, existing);
    return { submission: toClientSubmission(existing) };
  }
  var sub = newSubmission(session.obj, student, studentId, p.fields, String(p.pin), 'submitted', now);
  appendObj('Submissions', sub);
  return { submission: toClientSubmission(sub) };
}

function updateSubmission(p) {
  var found = findRow('Submissions', 'submission_id', p.submissionId);
  if (!found || found.obj.status === 'deleted') throw apiErr('NOT_FOUND', '의견서를 찾을 수 없습니다.');
  var session = mustSession(found.obj.session_id);
  requireWritable(session.obj);
  if (String(found.obj.pin) !== String(p.pin)) throw apiErr('WRONG_PIN', 'PIN이 일치하지 않습니다.');
  validateFields(p.fields);
  found.obj.fields_json = JSON.stringify(p.fields || {});
  found.obj.status = 'submitted'; // 수정 시 재심의 대상
  found.obj.updated_at = nowIso();
  writeRow('Submissions', found.row, found.obj);
  return { submission: toClientSubmission(found.obj) };
}

function addComment(p) {
  var subFound = findRow('Submissions', 'submission_id', p.submissionId);
  if (!subFound || subFound.obj.status === 'deleted') throw apiErr('NOT_FOUND', '의견서를 찾을 수 없습니다.');
  var session = mustSession(subFound.obj.session_id);
  requireWritable(session.obj);
  if (!p.text || !String(p.text).trim()) throw apiErr('VALIDATION', '댓글 내용을 입력하세요.');
  var comment = {
    comment_id: makeId('cmt'),
    session_id: subFound.obj.session_id,
    submission_id: p.submissionId,
    author_student_id: String(p.studentId),
    author_name: p.name || '',
    author_team: p.team || '',
    text: String(p.text).trim(),
    status: 'active',
    created_at: nowIso()
  };
  appendObj('Comments', comment);
  return { comment: comment };
}

function toggleLike(p) {
  var subFound = findRow('Submissions', 'submission_id', p.submissionId);
  if (!subFound || subFound.obj.status === 'deleted') throw apiErr('NOT_FOUND', '의견서를 찾을 수 없습니다.');
  var session = mustSession(subFound.obj.session_id);
  requireWritable(session.obj);
  var studentId = String(p.studentId);
  var likes = readRows('Likes');
  // (submission_id, student_id) 유일 — 학번당 1하트 (기획안 §4.5)
  var existing = likes.filter(function (l) {
    return l.submission_id === p.submissionId && l.student_id === studentId;
  })[0];
  var liked;
  if (existing) {
    // 토글 해제 — Likes만 예외적으로 물리 삭제 (집계 왜곡 방지)
    sheetOf('Likes').deleteRow(existing.__row);
    liked = false;
  } else {
    appendObj('Likes', {
      session_id: subFound.obj.session_id,
      submission_id: p.submissionId,
      student_id: studentId,
      created_at: nowIso()
    });
    liked = true;
  }
  var count = readRows('Likes').filter(function (l) { return l.submission_id === p.submissionId; }).length;
  return { liked: liked, likeCount: count };
}

// ================= 공용 읽기 =================

function getSession(p) {
  // P2-3(검수 P2-1): draft(개정 전) 세션은 학생에게 노출하지 않는다 — 코드 추측으로 상황판 조기 열람 차단.
  // archived는 기존대로 차단, open/closed만 조회 가능(closed는 열람 전용 폴백 용도).
  var session = readRows('Sessions').filter(function (s) {
    return s.code === String(p.code) && (s.status === 'open' || s.status === 'closed');
  })[0];
  if (!session) throw apiErr('NOT_FOUND', '해당 코드의 사건이 없습니다.');
  var student = null;
  if (p.studentId) {
    student = readRows('Students').filter(function (s) {
      return s.session_id === session.session_id && s.student_id === String(p.studentId);
    })[0] || null;
  }
  return { session: stripRowMeta(session), student: student ? stripRowMeta(student) : null };
}

/**
 * 광장 단일 통합 호출 — 분리 금지 (기획안 §5.3)
 * M3: since(=이전 응답의 boardVersion, ms) 파라미터를 주면 증분 응답.
 *   - submissions/comments: since - 오버랩(30초) 이후 변경분만
 *   - submissionIds/commentIds: 현재 보여야 할 전체 ID (클라이언트가 삭제를 감지)
 *   - likeCounts/myLikes/showLikes: 항상 전체 (소량)
 * since 없이 호출하면 기존(M1)과 동일하게 전체 반환 — 하위 호환.
 */
function getBoard(p) {
  var session = mustSession(p.sessionId);
  var cutoff = 0;
  if (p.since) {
    var sinceMs = Number(p.since);
    if (!isNaN(sinceMs) && sinceMs > 0) cutoff = sinceMs - SINCE_OVERLAP_MS;
  }
  function isNew(iso) {
    if (cutoff <= 0) return true;
    var t = new Date(iso).getTime();
    return isNaN(t) || t >= cutoff; // 파싱 실패 시 안전하게 포함
  }
  var all = readRows('Submissions').filter(function (s) {
    return s.session_id === p.sessionId &&
      (s.status === 'submitted' || s.status === 'approved' || s.status === 'rejected');
  });
  all.sort(function (a, b) {
    var t = teamCompare(a.team, b.team);
    if (t !== 0) return t;
    return a.created_at < b.created_at ? -1 : 1;
  });
  var submissionIds = all.map(function (s) { return s.submission_id; });
  var visibleSubs = {};
  submissionIds.forEach(function (id) { visibleSubs[id] = true; });
  var submissions = all
    .filter(function (s) { return isNew(s.updated_at); })
    .map(toClientSubmission);
  // 광장에 보이는 의견서의 댓글만 (삭제된 의견서의 고아 댓글 제외 — LocalBackend와 동일 규칙)
  var allComments = readRows('Comments').filter(function (c) {
    return c.session_id === p.sessionId && c.status === 'active' && visibleSubs[c.submission_id] === true;
  });
  var commentIds = allComments.map(function (c) { return c.comment_id; });
  var comments = allComments
    .filter(function (c) { return isNew(c.created_at); })
    .map(stripRowMeta);
  var likeCounts = {};
  var myLikes = [];
  readRows('Likes').forEach(function (l) {
    if (l.session_id !== p.sessionId) return;
    likeCounts[l.submission_id] = (likeCounts[l.submission_id] || 0) + 1;
    if (p.studentId && l.student_id === String(p.studentId)) myLikes.push(l.submission_id);
  });
  return {
    submissions: submissions,
    comments: comments,
    likeCounts: likeCounts,
    myLikes: myLikes,
    boardVersion: new Date().getTime(),
    showLikes: String(session.obj.show_likes).toUpperCase() !== 'FALSE',
    submissionIds: submissionIds,
    commentIds: commentIds
  };
}

/**
 * M3 — 학기말 학생별(학번) 누적 집계 (기획안 §9). 읽기 전용, deleted 행 제외.
 * from/to: 세션 개정일(created_at) 기준 기간 필터 (ISO 문자열 비교).
 */
function getStudentStats(p) {
  var sessions = readRows('Sessions');
  var from = p.from ? String(p.from) : '';
  var to = p.to ? String(p.to) : '';
  var allowed = null;
  if (from || to) {
    allowed = {};
    sessions.forEach(function (s) {
      if ((!from || s.created_at >= from) && (!to || s.created_at <= to + '\uffff')) {
        allowed[s.session_id] = true;
      }
    });
  }
  function inRange(sid) { return !allowed || allowed[sid] === true; }
  var sessionById = {};
  sessions.forEach(function (s) { sessionById[s.session_id] = s; });

  var stats = {};
  function stat(id) {
    if (!stats[id]) {
      stats[id] = {
        student_id: id, name: '', session_count: 0,
        submitted_count: 0, approved_count: 0, rejected_count: 0,
        likes_received: 0, likes_given: 0,
        comments_written: 0, comments_received: 0,
        first_activity: '', last_activity: '', sessions: [], _nameAt: ''
      };
    }
    return stats[id];
  }
  function touch(st, iso) {
    if (!iso) return;
    if (!st.first_activity || iso < st.first_activity) st.first_activity = iso;
    if (!st.last_activity || iso > st.last_activity) st.last_activity = iso;
  }

  readRows('Students').forEach(function (r) {
    if (!inRange(r.session_id)) return;
    var st = stat(r.student_id);
    st.session_count++;
    if (r.joined_at >= st._nameAt) { st.name = r.name; st._nameAt = r.joined_at; } // 최신 참여 행 기준 이름
    var ses = sessionById[r.session_id];
    st.sessions.push({
      session_id: r.session_id,
      title: ses ? ses.title : '',
      class_name: ses ? ses.class_name : '',
      mode: ses ? ses.mode : '',
      joined_at: r.joined_at,
      submission_id: null,
      submission_status: null
    });
    touch(st, r.joined_at);
  });

  var subAuthor = {}; // submission_id -> { studentId, deleted }
  readRows('Submissions').forEach(function (s) {
    if (!inRange(s.session_id)) return;
    subAuthor[s.submission_id] = { studentId: s.student_id, deleted: s.status === 'deleted' };
    if (s.status === 'deleted') return;
    var st = stat(s.student_id);
    if (s.status !== 'draft') {
      st.submitted_count++;
      if (s.status === 'approved') st.approved_count++;
      if (s.status === 'rejected') st.rejected_count++;
    }
    for (var i = 0; i < st.sessions.length; i++) {
      if (st.sessions[i].session_id === s.session_id) {
        st.sessions[i].submission_id = s.submission_id;
        st.sessions[i].submission_status = s.status;
        break;
      }
    }
    touch(st, s.created_at);
    touch(st, s.updated_at);
  });

  readRows('Comments').forEach(function (c) {
    if (!inRange(c.session_id) || c.status !== 'active') return;
    var st = stat(c.author_student_id);
    st.comments_written++;
    touch(st, c.created_at);
    var target = subAuthor[c.submission_id];
    if (target && !target.deleted) stat(target.studentId).comments_received++;
  });

  readRows('Likes').forEach(function (l) {
    if (!inRange(l.session_id)) return;
    var st = stat(l.student_id);
    st.likes_given++;
    touch(st, l.created_at);
    var target = subAuthor[l.submission_id];
    if (target && !target.deleted) stat(target.studentId).likes_received++;
  });

  var list = Object.keys(stats).map(function (k) {
    var s = stats[k];
    delete s._nameAt;
    return s;
  });
  list.sort(function (a, b) { return a.student_id < b.student_id ? -1 : 1; });
  return { stats: list };
}

// ================= 헬퍼 =================

function ok(data) {
  return { ok: true, data: data, serverTime: nowIso() };
}

function fail(code, message) {
  return { ok: false, error: code, message: message };
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function apiErr(code, message) {
  var e = new Error(message);
  e.apiCode = code;
  return e;
}

function requireTeacher(p) {
  var key = getOrCreateTeacherKey();
  if (!p.teacherKey || String(p.teacherKey) !== key) {
    throw apiErr('FORBIDDEN', '교사 키가 올바르지 않습니다.');
  }
}

function requireWritable(session) {
  if (session.status === 'closed' || session.status === 'archived') {
    throw apiErr('CLOSED', '종료된 사건입니다.');
  }
}

function validateFields(fields) {
  var evs = (fields && fields.evidences) || [];
  var filled = evs.filter(function (e) {
    return (e.claim && String(e.claim).trim() !== '') || (e.source && String(e.source).trim() !== '');
  });
  if (filled.length < 1) throw apiErr('VALIDATION', '근거를 최소 1개 입력해야 합니다.');
  var noSource = filled.filter(function (e) { return !e.source || String(e.source).trim() === ''; });
  if (noSource.length > 0) throw apiErr('VALIDATION', '모든 근거에 출처를 입력해야 합니다.');
}

function mustSession(sessionId) {
  var found = findRow('Sessions', 'session_id', sessionId);
  if (!found) throw apiErr('NOT_FOUND', '사건을 찾을 수 없습니다.');
  return found;
}

function findStudent(sessionId, studentId) {
  return readRows('Students').filter(function (s) {
    return s.session_id === sessionId && s.student_id === studentId;
  })[0] || null;
}

function newSubmission(session, student, studentId, fields, pin, status, now) {
  return {
    submission_id: makeId('sub'),
    session_id: session.session_id,
    student_id: studentId,
    student_name: student ? student.name : '',
    team: student ? student.team : '',
    role_id: student ? student.role_id : '',
    mode: session.mode,
    status: status,
    fields_json: JSON.stringify(fields || {}),
    pin: pin,
    teacher_note: '',
    created_at: now,
    updated_at: now
  };
}

/** doGet/doPost 응답용 — pin 절대 미포함 (기획안 §4.3) */
function toClientSubmission(sub) {
  var copy = stripRowMeta(sub);
  delete copy.pin;
  return copy;
}

function stripRowMeta(obj) {
  var copy = {};
  Object.keys(obj).forEach(function (k) {
    if (k !== '__row') copy[k] = obj[k];
  });
  return copy;
}

// ---- 시트 IO ----

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureTabs() {
  Object.keys(HEADERS).forEach(function (name) {
    var sheet = ss().getSheetByName(name);
    if (!sheet) {
      sheet = ss().insertSheet(name);
      // 학번·PIN·코드의 앞자리 0 보존 — 전체 텍스트 서식
      sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setNumberFormat('@');
      sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });
}

function sheetOf(name) {
  return ss().getSheetByName(name);
}

/** 헤더 기반 객체 배열 읽기. __row = 실제 시트 행 번호(1-base) */
function readRows(name) {
  var sheet = sheetOf(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = HEADERS[name];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = { __row: r + 1 };
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      var v = values[r][c];
      obj[headers[c]] = v === null || v === undefined ? '' : String(v);
      if (obj[headers[c]] !== '') empty = false;
    }
    if (!empty) rows.push(obj);
  }
  return rows;
}

/** idCol 값이 일치하는 첫 행을 { row: 시트행번호, obj: 행객체 } 로 반환. 없으면 null */
function findRow(name, idCol, value) {
  var rows = readRows(name);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(value)) {
      return { row: rows[i].__row, obj: rows[i] };
    }
  }
  return null;
}

function appendObj(name, obj) {
  var headers = HEADERS[name];
  var row = headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  // P1-2: 시트 생성 시 지정한 텍스트 서식('@')은 생성 시점의 행 범위에만 적용된다.
  // 그 범위를 넘는 신규 행(학기 누적 1,000행+)에서 학번·PIN의 앞자리 0이 숫자로 변형되지 않도록,
  // 기록 대상 행에 매번 '@' 서식을 지정한 뒤 값을 쓴다 (appendRow 대체 — 쓰기는 전역 ScriptLock으로 직렬화됨).
  var sheet = sheetOf(name);
  var rowNum = sheet.getLastRow() + 1;
  var range = sheet.getRange(rowNum, 1, 1, headers.length);
  range.setNumberFormat('@');
  range.setValues([row]);
}

function writeRow(name, rowNum, obj) {
  var headers = HEADERS[name];
  var row = headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; });
  sheetOf(name).getRange(rowNum, 1, 1, headers.length).setValues([row]);
}

// ---- 유틸 ----

function nowIso() {
  return new Date().toISOString();
}

/** ID 규칙: 접두사 + timestamp36 + 난수4 (기획안 §4) */
function makeId(prefix) {
  var ts = new Date().getTime().toString(36);
  var rand = Math.random().toString(36).slice(2, 6);
  return prefix + '_' + ts + '_' + rand;
}

function makeCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * 모둠명 정렬 (P2-4): "10모둠"이 "2모둠"보다 앞에 오는 문자열 비교 오류 방지.
 * 앞자리 숫자를 추출해 수치 비교, 숫자가 없으면 문자열 비교. 클라이언트 board.ts compareTeam과 동일 규칙.
 */
function teamCompare(a, b) {
  var sa = String(a || '');
  var sb = String(b || '');
  var na = parseInt(sa, 10);
  var nb = parseInt(sb, 10);
  var aNum = !isNaN(na);
  var bNum = !isNaN(nb);
  if (aNum && bNum && na !== nb) return na - nb;
  if (aNum !== bNum) return aNum ? -1 : 1; // 숫자 시작 모둠을 앞에
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

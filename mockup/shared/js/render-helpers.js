/*
 * Kleine Vanilla-JS-Helfer, die von allen Mockup-Seiten genutzt werden:
 * Query-Parameter lesen, Formatierung, gemeinsame Kopf-/Fußnavigation,
 * und ein paar Rendering-Bausteine, damit Detailseiten aus MOCK.* gespeist
 * werden statt Inhalte hart in jede HTML-Datei zu kopieren.
 */

function qp(name, fallback) {
  var params = new URLSearchParams(window.location.search);
  return params.has(name) ? params.get(name) : (fallback || null);
}

function initials(name) {
  return name.split(' ').map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
}

function avatarHtml(user, size) {
  size = size || 40;
  return '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + user.avatarColor + ';font-size:' + Math.round(size * 0.4) + 'px;">' + initials(user.name) + '</span>';
}

function formatDatum(dateStr, weekday) {
  var parts = dateStr.split('-');
  var kurz = weekday ? weekday.slice(0, 2) : '';
  return (kurz ? kurz + ', ' : '') + parts[2] + '.' + parts[1] + '.' + parts[0];
}

function formatPreis(num) {
  return num.toFixed(2).replace('.', ',') + ' €';
}

function badgeHtml(text, variant) {
  return '<span class="badge badge-' + (variant || 'default') + '">' + text + '</span>';
}

function plaetzeFrei(cs) {
  var ct = MOCK.getCourseType(cs.courseTypeId);
  return ct.maxParticipants - cs.participantIds.length;
}

function courseStatusBadge(cs) {
  if (cs.status === 'live') return badgeHtml('Läuft jetzt', 'live');
  if (cs.status === 'past') return badgeHtml('Vorbei', 'muted');
  var frei = plaetzeFrei(cs);
  if (frei <= 0) return badgeHtml('Ausgebucht', 'danger');
  if (frei <= 2) return badgeHtml(frei + ' Plätze frei', 'warning');
  return badgeHtml(frei + ' Plätze frei', 'success');
}

function isCurrentUserBooked(cs) {
  return cs.participantIds.indexOf(CURRENT_MEMBER_ID) !== -1;
}

function isCurrentUserWaitlisted(cs) {
  return cs.waitlistIds.indexOf(CURRENT_MEMBER_ID) !== -1;
}

function renderCourseCard(cs) {
  var ct = MOCK.getCourseType(cs.courseTypeId);
  var youBadge = '';
  if (cs.status !== 'past') {
    if (isCurrentUserBooked(cs)) youBadge = badgeHtml('Gebucht', 'success');
    else if (isCurrentUserWaitlisted(cs)) youBadge = badgeHtml('Warteliste', 'warning');
  }
  return '<a class="course-card card-link" href="course-detail.html?id=' + cs.id + '">' +
    '<div class="course-time">' + ct.time + '</div>' +
    '<div class="course-info">' +
      '<div class="course-name">' + ct.name + '</div>' +
      '<div class="course-meta">' + formatDatum(cs.date, cs.weekday) + ' · ' + cs.participantIds.length + '/' + ct.maxParticipants + ' Teilnehmer</div>' +
    '</div>' +
    '<div class="course-card-badges">' + courseStatusBadge(cs) + youBadge + '</div>' +
  '</a>';
}

function leaderboardGesamt(tenantId) {
  var totals = {};
  MOCK.leaderboardEntries
    .filter(function (e) { return e.tenantId === tenantId; })
    .forEach(function (e) {
      totals[e.userId] = (totals[e.userId] || 0) + e.points;
    });
  return Object.keys(totals)
    .map(function (userId) { return { user: MOCK.getUser(userId), points: totals[userId] }; })
    .sort(function (a, b) { return b.points - a.points; });
}

function leaderboardForSession(courseSessionId) {
  return MOCK.leaderboardEntries
    .filter(function (e) { return e.courseSessionId === courseSessionId; })
    .map(function (e) { return { user: MOCK.getUser(e.userId), points: e.points }; })
    .sort(function (a, b) { return b.points - a.points; });
}

var NAV_CONFIGS = {
  'super-admin': {
    title: 'Super-Admin',
    user: function () { return MOCK.getUser(CURRENT_SUPER_ADMIN_ID); },
    links: [{ href: 'tenants.html', key: 'tenants', label: 'Mandanten' }]
  },
  'box-admin': {
    title: function () { return MOCK.getTenant(CURRENT_TENANT_ID).name; },
    user: function () { return MOCK.getUser(CURRENT_BOX_ADMIN_ID); },
    links: [
      { href: 'dashboard.html', key: 'dashboard', label: 'Dashboard' },
      { href: 'members.html', key: 'members', label: 'Mitglieder' },
      { href: 'course-types.html', key: 'course-types', label: 'Kurse' }
    ]
  },
  member: {
    title: function () { return MOCK.getTenant(CURRENT_TENANT_ID).name; },
    user: function () { return MOCK.getUser(CURRENT_MEMBER_ID); },
    links: [
      { href: 'dashboard.html', key: 'dashboard', label: 'Kursplan' },
      { href: 'shop.html', key: 'shop', label: 'Shop' },
      { href: 'leaderboard.html', key: 'leaderboard', label: 'Leaderboard' },
      { href: 'profile.html', key: 'profile', label: 'Profil' }
    ]
  }
};

/*
 * Gemeinsame Kopf-/Navigation. Erwartet ein Element mit id="page-chrome"
 * ganz oben im <body>. Bei Admin-Rollen wird zusätzlich eine Sidebar-Navigation
 * in ein Element mit id="sidebar-chrome" gerendert (falls vorhanden), bei der
 * Rolle "member" eine fixe Bottom-Tab-Bar an den <body> angehängt.
 * Pfade sind relativ zum jeweiligen Rollenordner, da alle Seiten einer Rolle
 * im selben Verzeichnis liegen.
 */
function initPageChrome(role, activePage) {
  var cfg = NAV_CONFIGS[role];
  if (!cfg) return;
  var title = typeof cfg.title === 'function' ? cfg.title() : cfg.title;
  var user = cfg.user();

  var headerMount = document.getElementById('page-chrome');
  if (headerMount) {
    headerMount.innerHTML =
      '<header class="app-header">' +
        '<div class="app-header-left">' +
          '<span class="brand">CF</span>' +
          '<span class="app-title">' + title + '</span>' +
        '</div>' +
        '<div class="app-header-right">' +
          '<span class="app-user-name">' + user.name + '</span>' +
          avatarHtml(user, 32) +
          '<a class="logout-link" href="../index.html">Abmelden</a>' +
        '</div>' +
      '</header>';
  }

  var isAdminRole = role === 'super-admin' || role === 'box-admin';
  var sidebarMount = document.getElementById('sidebar-chrome');
  if (isAdminRole && sidebarMount) {
    sidebarMount.innerHTML = cfg.links.map(function (l) {
      var active = l.key === activePage ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + active + '>' + l.label + '</a>';
    }).join('');
  }

  if (role === 'member') {
    var tabbar = document.createElement('nav');
    tabbar.className = 'tab-bar';
    tabbar.innerHTML = cfg.links.map(function (l) {
      var active = l.key === activePage ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + active + '>' + l.label + '</a>';
    }).join('');
    // Direkt nach dem Header einfügen: auf breiten Screens (position: static
    // per Media Query) wirkt die Bar dadurch wie eine zweite Top-Nav-Zeile,
    // auf schmalen Screens hebt position: fixed sie ans untere Bildschirmende.
    if (headerMount && headerMount.parentNode) {
      headerMount.parentNode.insertBefore(tabbar, headerMount.nextSibling);
    } else {
      document.body.appendChild(tabbar);
    }
  }
}

var API_KEY = 'AIzaSyALt29XWpBt0CE1vnh93KHYyBF3xJFc5Xc';
var CAL_ID = 'fromtheashes.slgot%40gmail.com';
var ORDINALS = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth','Thirteenth','Fourteenth','Fifteenth','Sixteenth','Seventeenth','Eighteenth','Nineteenth','Twentieth','Twenty-First','Twenty-Second','Twenty-Third','Twenty-Fourth','Twenty-Fifth','Twenty-Sixth','Twenty-Seventh','Twenty-Eighth','Twenty-Ninth','Thirtieth'];
var MOON_ORDS = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var TOD = [[0,3,'deep in the night'],[3,6,'in the small hours before dawn'],[6,9,'in the morning'],[9,12,'before midday'],[12,13,'at midday'],[13,17,'in the afternoon'],[17,20,'at dusk'],[20,22,'in the evening'],[22,24,'late in the night']];

function getTOD(h) {
  for (var i = 0; i < TOD.length; i++) {
    if (h >= TOD[i][0] && h < TOD[i][1]) return TOD[i][2];
  }
  return 'in the night';
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function getWesterosiDate(date) {
  var y = date.getFullYear();
  var jan1 = new Date(y, 0, 1, 0, 0, 0, 0);
  var jan1next = new Date(y + 1, 0, 1, 0, 0, 0, 0);
  var spanMs, elapsedMs, totalACDays, acBase;
  if (y === 2026) {
    var jul1 = new Date(2026, 6, 1, 0, 0, 0, 0);
    if (date < jul1) return null;
    spanMs = jan1next - jul1;
    elapsedMs = date - jul1;
    totalACDays = 2 * 360;
    acBase = 140;
  } else {
    spanMs = jan1next - jan1;
    elapsedMs = date - jan1;
    totalACDays = 4 * 360;
    acBase = 142 + 4 * (y - 2027);
  }
  var frac = Math.max(0, Math.min(1, elapsedMs / spanMs));
  var igDay = Math.floor(frac * totalACDays);
  var acYear = acBase + Math.floor(igDay / 360);
  var dayInYear = igDay % 360;
  var moon = Math.floor(dayInYear / 30);
  var day = dayInYear % 30;
  var dayFrac = (elapsedMs % (spanMs / totalACDays)) / (spanMs / totalACDays);
  var hour = Math.floor(dayFrac * 24);
  return { acYear: acYear, moon: moon, day: day, hour: hour };
}

function formatIC(d, showTime) {
  if (!d) return 'The setting has not yet begun — it opens the First of July.';
  var s = 'The ' + ORDINALS[d.day] + ' Day of the ' + MOON_ORDS[d.moon] + ' Moon of ' + d.acYear + ' AC';
  if (showTime) s += ', ' + getTOD(d.hour);
  return s;
}

function formatICShort(date) {
  var d = getWesterosiDate(date);
  if (!d) return '';
  return ORDINALS[d.day] + ' Day, ' + MOON_ORDS[d.moon] + ' Moon, ' + d.acYear + ' AC';
}

var viewYear = new Date().getFullYear();
var viewMonth = new Date().getMonth();
var allEvents = [];

function fetchEvents(callback) {
  var start = new Date(viewYear, viewMonth, 1).toISOString();
  var end = new Date(viewYear, viewMonth + 1, 1).toISOString();
  var url = 'https://www.googleapis.com/calendar/v3/calendars/' + CAL_ID + '/events?key=' + API_KEY + '&timeMin=' + encodeURIComponent(start) + '&timeMax=' + encodeURIComponent(end) + '&singleEvents=true&orderBy=startTime&maxResults=50';
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = function() {
    try {
      var j = JSON.parse(xhr.responseText);
      allEvents = j.items || [];
    } catch(e) { allEvents = []; }
    callback();
  };
  xhr.onerror = function() { allEvents = []; callback(); };
  xhr.send();
}

function getEventsForDate(ds) {
  var out = [];
  for (var i = 0; i < allEvents.length; i++) {
    var ev = allEvents[i];
    var s = (ev.start.date || ev.start.dateTime || '').slice(0, 10);
    var e = (ev.end.date || ev.end.dateTime || '').slice(0, 10);
    if (s === ds || (s < ds && ds < e)) out.push(ev);
  }
  return out;
}

function renderICHeader() {
  var el = document.getElementById('ic-text');
  if (!el) return;
  var d = getWesterosiDate(new Date());
  el.innerHTML = formatIC(d, true);
}

function renderCalendar() {
  document.getElementById('month-label').innerHTML = MONTHS[viewMonth] + ' ' + viewYear;
  var today = new Date();
  var todayStr = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
  var firstDay = new Date(viewYear, viewMonth, 1).getDay();
  var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  var totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  var html = '';
  for (var i = 0; i < totalCells; i++) {
    var day, month, year, other = false;
    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1;
      month = viewMonth === 0 ? 11 : viewMonth - 1;
      year = viewMonth === 0 ? viewYear - 1 : viewYear;
      other = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      month = viewMonth === 11 ? 0 : viewMonth + 1;
      year = viewMonth === 11 ? viewYear + 1 : viewYear;
      other = true;
    } else {
      day = i - firstDay + 1;
      month = viewMonth;
      year = viewYear;
    }
    var ds = year + '-' + pad2(month + 1) + '-' + pad2(day);
    var isToday = ds === todayStr;
    var icShort = formatICShort(new Date(year, month, day, 12, 0, 0));
    var evs = getEventsForDate(ds);
    var evHTML = '';
    if (evs.length > 0) {
      evHTML = '<div class="cal-events">';
      var limit = evs.length > 2 ? 2 : evs.length;
      for (var k = 0; k < limit; k++) {
        var title = (evs[k].summary || 'Event').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        evHTML += '<div class="cal-event" onclick="showEvent(\'' + evs[k].id + '\')">' + title + '</div>';
      }
      if (evs.length > 2) {
        evHTML += '<div style="font-size:9px;color:#4a3f32;padding:1px 4px">+' + (evs.length - 2) + ' more</div>';
      }
      evHTML += '</div>';
    }
    var cls = 'cal-day' + (other ? ' other-month' : '') + (isToday ? ' today' : '');
    html += '<div class="' + cls + '">';
    html += '<div class="cal-day-num">' + day + '</div>';
    if (icShort) html += '<div class="cal-day-ic">' + icShort + '</div>';
    html += evHTML;
    html += '</div>';
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function showEvent(id) {
  var ev = null;
  for (var i = 0; i < allEvents.length; i++) {
    if (allEvents[i].id === id) { ev = allEvents[i]; break; }
  }
  if (!ev) return;
  var startStr = (ev.start.date || ev.start.dateTime || '').slice(0, 10);
  var icStr = formatICShort(new Date(startStr + 'T12:00:00'));
  var html = '<div class="cal-modal">';
  html += '<div class="cal-modal-title">' + (ev.summary || 'Event') + '</div>';
  html += '<div class="cal-modal-dates">' + startStr + (icStr ? ' &mdash; ' + icStr : '') + '</div>';
  if (ev.description) html += '<div class="cal-modal-desc">' + ev.description + '</div>';
  html += '<div class="cal-modal-close" onclick="document.getElementById(\'modal-area\').innerHTML=\'\'">Dismiss</div>';
  html += '</div>';
  document.getElementById('modal-area').innerHTML = html;
}

function loadMonth() {
  document.getElementById('cal-grid').innerHTML = '<div class="cal-loading">Consulting the ravens...</div>';
  fetchEvents(function() { renderCalendar(); });
}

document.getElementById('prev-btn').onclick = function() {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  loadMonth();
};
document.getElementById('next-btn').onclick = function() {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  loadMonth();
};

renderICHeader();
loadMonth();
setInterval(renderICHeader, 60000);

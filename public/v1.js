(function() {
  var s = document.querySelector('script[data-business-id]');
  if (!s) return;
  var bid = s.getAttribute('data-business-id');
  var color = s.getAttribute('data-color') || '#6c3cff';
  var pos = s.getAttribute('data-position') || 'right';
  var greeting = s.getAttribute('data-greeting') || '';
  var delay = parseInt(s.getAttribute('data-trigger-delay') || '0', 10);
  var baseUrl = s.getAttribute('data-url') || 'https://app.zypflow.com';

  // Create styles
  var style = document.createElement('style');
  style.textContent = [
    '@keyframes zyp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
    '@keyframes zyp-fade-in{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '@keyframes zyp-pulse{0%,100%{box-shadow:0 0 0 0 ' + color + '40}50%{box-shadow:0 0 0 12px ' + color + '00}}',
    '.zyp-bubble{position:fixed;bottom:24px;' + pos + ':24px;width:60px;height:60px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99998;box-shadow:0 4px 20px rgba(0,0,0,.2);transition:transform .2s,box-shadow .2s;animation:zyp-pulse 2s ease-in-out 3}',
    '.zyp-bubble:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(0,0,0,.25)}',
    '.zyp-frame{position:fixed;bottom:96px;' + pos + ':24px;width:380px;height:560px;border-radius:16px;overflow:hidden;z-index:99999;display:none;box-shadow:0 12px 48px rgba(0,0,0,.15);animation:zyp-fade-in .25s ease-out}',
    '.zyp-greeting{position:fixed;bottom:96px;' + pos + ':24px;max-width:260px;background:#fff;border-radius:16px 16px 4px 16px;padding:14px 18px;z-index:99998;box-shadow:0 4px 24px rgba(0,0,0,.12);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;color:#374151;line-height:1.5;animation:zyp-fade-in .3s ease-out;cursor:pointer}',
    '.zyp-greeting-close{position:absolute;top:6px;right:8px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;line-height:1}',
    '.zyp-unread{position:absolute;top:-4px;right:-4px;width:20px;height:20px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;font-family:-apple-system,sans-serif;animation:zyp-bounce .5s ease}',
    '@media(max-width:440px){.zyp-frame{width:calc(100vw - 24px);' + pos + ':12px;bottom:88px;height:calc(100vh - 120px);border-radius:12px}}'
  ].join('');
  document.head.appendChild(style);

  // Create bubble
  var bubble = document.createElement('div');
  bubble.className = 'zyp-bubble';
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="white"/></svg>';
  document.body.appendChild(bubble);

  // Create iframe container
  var frame = document.createElement('div');
  frame.className = 'zyp-frame';
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/widget/' + bid;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.setAttribute('loading', 'lazy');
  frame.appendChild(iframe);
  document.body.appendChild(frame);

  var isOpen = false;
  var greetingEl = null;
  var greetingDismissed = false;

  function toggleChat() {
    isOpen = !isOpen;
    frame.style.display = isOpen ? 'block' : 'none';
    if (greetingEl) {
      greetingEl.style.display = 'none';
      greetingDismissed = true;
    }
    // Update bubble icon
    if (isOpen) {
      bubble.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';
    } else {
      bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="white"/></svg>';
    }
  }

  bubble.onclick = toggleChat;

  // Proactive greeting trigger
  function showGreeting() {
    if (isOpen || greetingDismissed || !greeting) return;

    greetingEl = document.createElement('div');
    greetingEl.className = 'zyp-greeting';
    greetingEl.innerHTML = greeting + '<button class="zyp-greeting-close">&times;</button>';
    document.body.appendChild(greetingEl);

    greetingEl.onclick = function(e) {
      if (e.target.classList.contains('zyp-greeting-close')) {
        greetingEl.style.display = 'none';
        greetingDismissed = true;
      } else {
        toggleChat();
      }
    };

    // Show unread badge on bubble
    var badge = document.createElement('div');
    badge.className = 'zyp-unread';
    badge.textContent = '1';
    bubble.appendChild(badge);
  }

  // Trigger greeting after delay or on scroll
  if (greeting) {
    if (delay > 0) {
      setTimeout(showGreeting, delay * 1000);
    } else {
      // Default: show after 30% scroll or 15 seconds
      var scrollTriggered = false;
      window.addEventListener('scroll', function() {
        if (scrollTriggered) return;
        var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent > 30) {
          scrollTriggered = true;
          showGreeting();
        }
      });
      setTimeout(function() {
        if (!scrollTriggered) {
          scrollTriggered = true;
          showGreeting();
        }
      }, 15000);
    }
  }

  // Listen for messages from iframe (typing indicators, etc.)
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'zyp-unread') {
      if (!isOpen) {
        var existingBadge = bubble.querySelector('.zyp-unread');
        if (!existingBadge) {
          var badge = document.createElement('div');
          badge.className = 'zyp-unread';
          badge.textContent = String(e.data.count || 1);
          bubble.appendChild(badge);
        }
      }
    }
    if (e.data && e.data.type === 'zyp-close') {
      if (isOpen) toggleChat();
    }
  });
})();

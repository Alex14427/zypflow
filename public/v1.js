(function() {
  var s = document.querySelector('script[data-business-id]');
  if (!s) return;
  var bid = s.getAttribute('data-business-id');
  var color = s.getAttribute('data-color') || '#6c3cff';
  var pos = s.getAttribute('data-position') || 'right';

  var bubble = document.createElement('div');
  bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="white"/></svg>';
  bubble.style.cssText = 'position:fixed;bottom:24px;' + pos + ':24px;width:60px;height:60px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99998;box-shadow:0 4px 20px rgba(0,0,0,.2);transition:transform .2s;';

  bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.1)'; };
  bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; };

  document.body.appendChild(bubble);

  var frame = document.createElement('div');
  frame.style.cssText = 'position:fixed;bottom:96px;' + pos + ':24px;width:380px;height:520px;border-radius:16px;overflow:hidden;z-index:99999;display:none;box-shadow:0 12px 48px rgba(0,0,0,.15);';
  var iframe = document.createElement('iframe');
  iframe.src = 'https://app.zypflow.com/widget/' + bid;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  frame.appendChild(iframe);
  document.body.appendChild(frame);

  var open = false;
  bubble.onclick = function() {
    open = !open;
    frame.style.display = open ? 'block' : 'none';
  };
})();

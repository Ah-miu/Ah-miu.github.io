(() => {
  'use strict';

  /* ------------------------------
   * 全局调试句柄（避免 Console 未定义）
   * ------------------------------ */
  window.__ytGallery = window.__ytGallery || {
    galleries: [],          // 每个视频区块的状态
    apiReady: false,        // IFrame API 是否可用
    how: 'not-started',     // 'ready' | 'callback' | 'poll' | 'timeout'
    status() {
      if (!this.galleries.length) return { items: 0, apiReady: this.apiReady, hasPlayer: false, playerElId: '' };
      return this.galleries.map((g, i) => ({
        index: i,
        items: g.items?.length || 0,
        hasPlayer: !!g.player,
        playerId: g.playerEl?.id || ''
      }));
    }
  };

  /* ===============================
   * 1) 通用交互初始化（一次性）
   * =============================== */
  let commonInited = false;
  function initCommonUI() {
    if (commonInited) return;
    commonInited = true;
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // —— 交互显示功能：静态图/动图切换 —— //
    document.querySelectorAll('.newPaper').forEach(newPaper => {
      const staticImg = newPaper.querySelector('.staticImage');
      const gifImg = newPaper.querySelector('.animatedGif');
      if (!staticImg || !gifImg) return;
      newPaper.addEventListener('mouseenter', () => {
        staticImg.style.display = 'none';
        gifImg.style.display = 'block';
      });
      newPaper.addEventListener('mouseleave', () => {
        staticImg.style.display = 'block';
        gifImg.style.display = 'none';
      });
    });
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // —— 引用复制 —— //
    document.querySelectorAll('.cite-btn').forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        const raw = this.getAttribute('data-citation') || '';
        const citationText = raw.replace(/<br>/g, '\n');
        navigator.clipboard.writeText(citationText)
          .then(() => {
            const confirmation = document.getElementById('copy-confirmation');
            if (confirmation) {
              confirmation.style.display = 'block';
              setTimeout(() => { confirmation.style.display = 'none'; }, 2000);
            }
          })
          .catch(err => console.error('Error copying text: ', err));
      });
    });
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // —— 横向 gallery 拖拽（#image-track） —— //
    const track = document.getElementById('image-track');
    if (track) {
      track.dataset.mouseDownAt = "0";
      track.dataset.prevPercentage = track.dataset.prevPercentage || "0";
      track.dataset.percentage = track.dataset.percentage || "0";

      const handleOnDown = (clientX) => { track.dataset.mouseDownAt = String(clientX); };
      const handleOnUp = () => {
        track.dataset.mouseDownAt = "0";
        track.dataset.prevPercentage = track.dataset.percentage || "0";
      };
      const handleOnMove = (clientX) => {
        if (!track.dataset.mouseDownAt || track.dataset.mouseDownAt === "0") return;
        const mouseDelta = parseFloat(track.dataset.mouseDownAt) - clientX;
        const maxDelta = Math.max(window.innerWidth / 2, 1);
        const percentage = (mouseDelta / maxDelta) * -100;
        const prev = parseFloat(track.dataset.prevPercentage || "0");
        const next = Math.max(Math.min(prev + percentage, 0), -100);

        track.dataset.percentage = String(next);
        track.animate({ transform: `translate(${next}%, -50%)` }, { duration: 1200, fill: "forwards" });
        for (const image of track.getElementsByClassName("image")) {
          image.animate({ objectPosition: `${100 + next}% center` }, { duration: 1200, fill: "forwards" });
        }
      };

      // 鼠标
      window.addEventListener('mousedown', (e) => handleOnDown(e.clientX));
      window.addEventListener('mouseup', handleOnUp);
      window.addEventListener('mousemove', (e) => handleOnMove(e.clientX));
      // 触控
      window.addEventListener('touchstart', (e) => handleOnDown(e.touches[0].clientX), { passive: true });
      window.addEventListener('touchend', handleOnUp);
      window.addEventListener('touchmove', (e) => handleOnMove(e.touches[0].clientX), { passive: true });
    }
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // —— 邮件复制 —— //
    const emailLink = document.getElementById('emailLink');
    if (emailLink) {
      emailLink.addEventListener('click', function (e) {
        e.preventDefault();
        const email = 'jinghan@cs.utexas.edu';
        navigator.clipboard.writeText(email)
          .then(() => {
            const copiedSpan = document.getElementById('copied');
            if (copiedSpan) {
              copiedSpan.style.display = 'inline';
              setTimeout(() => { copiedSpan.style.display = 'none'; }, 2000);
            }
          })
          .catch((error) => console.error('Failed to copy email: ', error));
      });
    }
  }

  // DOM 就绪后执行通用交互
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommonUI, { once: true });
  } else {
    initCommonUI();
  }

  /* ==============================================
   * 2) YouTube 播放清单（多区块 / SPA 友好 / 兜底）
   * 目标结构：
   * <div class="yt-shell" data-init="youtube-gallery">
   *   <aside class="yt-playlist"> <div class="yt-item" data-ytid="...">…</div> … </aside>
   *   <section class="yt-player-wrap"><div class="yt-player" id="ytPlayer"></div></section>
   * </div>
   * ============================================== */

  let ytApiPromise = null;
  function ensureYTAPI() {
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise((resolve) => {
      if (window.YT && typeof YT.Player === 'function') {
        window.__ytGallery.apiReady = true;
        return resolve('ready');
      }
      // 注入脚本（若未注入）
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        document.head.appendChild(s);
      }
      // 兼容已有回调
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try { typeof prev === 'function' && prev(); } catch (e) {}
        window.__ytGallery.apiReady = true;
        resolve('callback');
      };
      // 轮询兜底
      const start = Date.now();
      const t = setInterval(() => {
        if (window.YT && typeof YT.Player === 'function') {
          clearInterval(t);
          window.__ytGallery.apiReady = true;
          resolve('poll');
        } else if (Date.now() - start > 10000) {
          clearInterval(t);
          resolve('timeout');
        }
      }, 60);
    }).then(how => (window.__ytGallery.how = how));
    return ytApiPromise;
  }

  function initGallery(shell) {
    // 如果已经初始化过就跳过
    if (shell.__ytInited) return;

    const listEl  = shell.querySelector('.yt-playlist');
    const items   = Array.from(shell.querySelectorAll('.yt-item'));
    let   playerEl = shell.querySelector('.yt-player');

    // 条件不满足：不要标记 inited，等待下次 DOM 变化重试
    if (!listEl || !items.length || !playerEl) return;

    // player 容器没有 id 时自动补一个
    if (!playerEl.id) playerEl.id = 'ytPlayer-' + Math.random().toString(36).slice(2, 9);

    // 现在可以标记初始化
    shell.__ytInited = true;

    const state = { shell, listEl, items, playerEl, player: null };
    window.__ytGallery.galleries.push(state);

    const setActive = (el) => { items.forEach(i => i.classList.remove('active')); el.classList.add('active'); };
    const play = (videoId) => {
      if (state.player && typeof state.player.loadVideoById === 'function') {
        state.player.loadVideoById(videoId);
      } else {
        // 退化 iframe：立即可用
        playerEl.innerHTML =
          `<iframe width="100%" height="100%"
                   src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
                   frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      }
    };

    // 交互
    listEl.addEventListener('click', (e) => {
      const item = e.target.closest('.yt-item');
      if (!item) return;
      setActive(item);
      play(item.dataset.ytid);
    });
    listEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const item = e.target.closest('.yt-item');
        if (!item) return;
        e.preventDefault();
        setActive(item);
        play(item.dataset.ytid);
      }
    });

    // 首次播放（退化）
    setActive(items[0]);
    play(items[0].dataset.ytid);

    // 升级为 IFrame API 播放器
    ensureYTAPI().then(() => {
      if (window.YT && typeof YT.Player === 'function') {
        playerEl.innerHTML = ''; // 清空退化 iframe
        state.player = new YT.Player(playerEl, {
          videoId: items[0].dataset.ytid,
          playerVars: { modestbranding: 1, rel: 0, playsinline: 1 }
        });
      }
    });
  }

  function initAllNow() {
    // 支持两种容器写法：.yt-shell 或 data-init="youtube-gallery"
    document.querySelectorAll('[data-init="youtube-gallery"], .yt-shell')
      .forEach(initGallery);
  }

  // 首次尝试（无论脚本位置，都能执行）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllNow, { once: true });
  } else {
    initAllNow();
  }

  // 监听 DOM 变化：适配 SPA/模板后渲染
  const mo = new MutationObserver(() => initAllNow());
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();






// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//  // 悬浮窗显示功能
//  const wechatButton = document.querySelector(".list a[href='#wetchat']");
//  const wechatModal = document.getElementById("wechat-modal");
//  const closeBtn = wechatModal.querySelector(".close");
//
//  wechatButton.addEventListener('click', () => {
//    wechatModal.style.display = "block";
//  });
//
//  closeBtn.addEventListener('click', () => {
//    wechatModal.style.display = "none";
//  });
//
//  window.addEventListener('click', e => {
//    if (e.target === wechatModal) {
//      wechatModal.style.display = "none";
//    }
//  });
	
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
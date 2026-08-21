/* ============================================
   欧阳威个人网站 · 共享交互脚本
   script.js
   ============================================ */

(function () {
  'use strict';

  /* ===== 0. EmailJS 配置（真实发信） =====
     用法：去 https://www.emailjs.com 注册 → 创建 Email Service（连接你的
     QQ / Gmail 邮箱）→ 创建 Email Template，模板变量用 {{name}} {{email}}
     {{subject}} {{message}}。然后把下面三个占位符替换成你自己的值即可。
     未替换（仍是占位符）时，表单自动降级为 mailto: 唤起本地邮件客户端，
     不会“假成功”，访客依然能把信发到你邮箱。 */
  var EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
  var EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
  var EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
  var EMAILJS_TO_EMAIL    = '3402685368@qq.com';
  var EMAILJS_CONFIGURED = EMAILJS_PUBLIC_KEY  !== 'YOUR_PUBLIC_KEY'
                        && EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID'
                        && EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID';
  if (EMAILJS_CONFIGURED && window.emailjs) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  /* ===== 1. Theme Toggle ===== */
  var themeBtn = document.querySelector('.theme-toggle');

  function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function syncThemeBtn() {
    if (!themeBtn) return;
    var label = themeBtn.querySelector('.theme-label');
    if (label) {
      label.textContent = window.I18N
        ? I18N.t(currentTheme() === 'dark' ? 'theme.light' : 'theme.dark')
        : (currentTheme() === 'dark' ? '\u6D45\u8272' : '\u6DF1\u8272');
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      // 切换瞬间轻微柔化，增强连续形变质感（180ms 后移除）
      themeBtn.classList.add('switching');
      window.setTimeout(function () { themeBtn.classList.remove('switching'); }, 180);
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('ow-theme', next); } catch (e) {}
      syncThemeBtn();
    });
    syncThemeBtn();
  }

  // 语言切换时同步主题按钮文案
  if (window.I18N) {
    I18N.hooks(function () { syncThemeBtn(); });
  }

  /* 跟随系统深浅主题（仅当用户未手动选择过） */
  (function () {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onSystemThemeChange(e) {
      try {
        if (!localStorage.getItem('ow-theme')) {
          document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
          syncThemeBtn();
        }
      } catch (err) {}
    }
    if (mq.addEventListener) mq.addEventListener('change', onSystemThemeChange);
    else if (mq.addListener) mq.addListener(onSystemThemeChange);
  })();

  /* ===== 2. Hamburger Menu ===== */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? I18N.t('menu.close') : I18N.t('menu.open'));
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', I18N.t('menu.open'));
      });
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }
    });
  }

  /* ===== 3. Scroll Reveal (Intersection Observer) ===== */
  var revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealElements.length > 0) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ===== 4. Animated Counters ===== */
  var counters = document.querySelectorAll('[data-count]');

  if ('IntersectionObserver' in window && counters.length > 0) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /* ===== 5. Smooth Scroll for Anchor Links ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;

      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var headerHeight = document.querySelector('.site-header');
        var offset = headerHeight ? headerHeight.offsetHeight : 0;
        // Also account for sticky section-nav
        var sectionNav = document.querySelector('.section-nav');
        if (sectionNav) offset += sectionNav.offsetHeight;

        var top = target.getBoundingClientRect().top + window.pageYOffset - offset - 20;

        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });

        // Update URL without jump
        history.pushState(null, '', href);
      }
    });
  });

  /* ===== 6. Active Nav Link on Scroll ===== */
  var navSections = document.querySelectorAll('[data-nav-section]');
  var navLinks = document.querySelectorAll('.section-nav a');

  if ('IntersectionObserver' in window && navSections.length > 0 && navLinks.length > 0) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-80px 0px -60% 0px'
    });

    navSections.forEach(function (sec) {
      navObserver.observe(sec);
    });
  }

  /* ===== 7. Keyboard Navigation (Tab focus) ===== */
  // Add visible focus styles only for keyboard users
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', function () {
    document.body.classList.remove('keyboard-nav');
  });

  /* ===== 8. Header background opacity on scroll ===== */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastScrollY = 0;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;

      // Add shadow when scrolled
      if (scrollY > 10) {
        header.style.boxShadow = '0 1px 8px rgba(0, 0, 0, 0.06)';
      } else {
        header.style.boxShadow = 'none';
      }

      lastScrollY = scrollY;
    }, { passive: true });
  }

  /* ===== 9. Contact Form Validation ===== */
  var contactForm = document.getElementById('contact-form');

  if (contactForm) {
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var messageInput = document.getElementById('contact-message');
    var nameError = document.getElementById('name-error');
    var emailError = document.getElementById('email-error');
    var messageError = document.getElementById('message-error');
    var successMsg = document.getElementById('form-success');
    var failMsg = document.getElementById('form-fail');
    var submitBtn = contactForm.querySelector('button[type="submit"]');

    function showError(errorEl, message) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }

    function hideError(errorEl) {
      errorEl.classList.remove('show');
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      // Reset errors
      hideError(nameError);
      hideError(emailError);
      hideError(messageError);
      successMsg.classList.remove('show');

      // Name validation
      if (nameInput.value.trim().length < 2) {
        showError(nameError, I18N.t('contact.err.name'));
        valid = false;
      }

      // Email validation
      if (!validateEmail(emailInput.value.trim())) {
        showError(emailError, I18N.t('contact.err.email'));
        valid = false;
      }

      // Message validation
      if (messageInput.value.trim().length < 10) {
        showError(messageError, I18N.t('contact.err.message'));
        valid = false;
      }

      if (valid) {
        contactForm.classList.add('form-loading');
        submitBtn.disabled = true;

        var subjectEl = document.getElementById('contact-subject');
        var params = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          subject: (subjectEl && subjectEl.value.trim()) || '(无主题)',
          message: messageInput.value.trim()
        };

        function handleSuccess() {
          successMsg.classList.add('show');
          contactForm.reset();
          setTimeout(function () { successMsg.classList.remove('show'); }, 5000);
        }

        function handleFail() {
          if (failMsg) {
            failMsg.classList.add('show');
            setTimeout(function () { failMsg.classList.remove('show'); }, 6000);
          }
        }

        if (EMAILJS_CONFIGURED && window.emailjs) {
          // 真实发信通道：访客留言直接发到你的邮箱
          emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
            .then(handleSuccess)
            .catch(handleFail)
            .finally(function () {
              contactForm.classList.remove('form-loading');
              submitBtn.disabled = false;
            });
        } else {
          // 降级通道：未配置 EmailJS 时，唤起本地邮件客户端（立即可用）
          var mailto = 'mailto:' + EMAILJS_TO_EMAIL
            + '?subject=' + encodeURIComponent('[网站留言] ' + params.subject)
            + '&body=' + encodeURIComponent('姓名：' + params.name + '\n邮箱：' + params.email + '\n\n' + params.message);
          window.location.href = mailto;
          handleSuccess();
          contactForm.classList.remove('form-loading');
          submitBtn.disabled = false;
        }
      }
    });

    // Clear errors on input
    if (nameInput) nameInput.addEventListener('input', function () { hideError(nameError); });
    if (emailInput) emailInput.addEventListener('input', function () { hideError(emailError); });
    if (messageInput) messageInput.addEventListener('input', function () { hideError(messageError); });
  }

  /* ===== 10. Scroll Restoration ===== */
  // Prevent scroll restoration on reload for a cleaner experience
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

})();

(function (exports) {
  'use strict';

  /*
   * Sticky
   * https://github.com/apathetic/stickynav/
   *
   * Copyright (c) 2012, 2016 Wes Hatch
   * Licensed under the MIT license.
   *
   */

  // mini querySelector helper fn
  function $(el) {
    return el instanceof HTMLElement ? el : document.querySelector(el);
  }

  // Sticky element default options
  var defaults = {
    offset: 0,
    boundedBy: false //  Defaults to the parent, but can be any element in the page.
  }

  /**
   * Set up a sticky element that attaches / detaches to top of viewport.
   * @param {HTMLElement} element  The element to sticky-ify
   * @param {Mixed} options        The bounding element for the sticky element,
   *                               the offset at which to activate
   * @return {void}
   */
  var Sticky = function Sticky(element, options) {
    var this$1 = this;

    this.element = $(element);
    if (!this.element) { return false; }

    this.opts = Object.assign(defaults, options);

    this.stateSwitcher;
    this.currentState = '_';
    this.determine = 'normal';
    this.bounded = !!this.opts.boundedBy;
    this.parent = !this.bounded ? this.element.parentNode : $(this.opts.boundedBy);

    // determine initial state
    if (this.element.getBoundingClientRect().top < 1) {
      this.setState('sticky');
      this.stateSwitcher();
    } else {
      this.setState('normal');
    }

    // window.addEventListener('scroll', this.stateSwitcher.bind(this));  // stateSwitcher changes, so cannot pass (ie. bind directly) like this
    window.addEventListener('scroll', function () { this$1.stateSwitcher(); });
    window.addEventListener('resize', function () { this$1.stateSwitcher(); });
  };

  Sticky.prototype.normal = function normal () {
    var elementPosition = this.element.getBoundingClientRect();
    if (elementPosition.top < this.opts.offset) {
      return this.setState('sticky');
    }
  };

  Sticky.prototype.sticky = function sticky () {
    var parentPosition = this.parent.getBoundingClientRect();
    if (parentPosition.top > this.opts.offset) {
      return this.setState('normal');
    }

    if (this.bounded) {
      var elementPosition = this.element.getBoundingClientRect();
      if (parentPosition.bottom < elementPosition.bottom) {
        return this.setState('bottom');
      }
    }
  };

  Sticky.prototype.bottom = function bottom () {
    var elementPosition = this.element.getBoundingClientRect();
    if (elementPosition.top > this.opts.offset) {
      return this.setState('sticky');
    }
  };

  Sticky.prototype.setState = function setState (state) {
    if (this.currentState === state) { return; }
    this.element.classList.remove(this.currentState);
    this.element.classList.add(state);
    this.currentState = state;
    this.stateSwitcher = this[state]; // stateSwitcher will point at an internal fn
  };

  function easeInOutCubic(t, b, c, d) {
    if ((t /= d / 2) < 1) { return c / 2 * t * t * t + b; }
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  }

  /**
   * Scroll the page to a particular page anchor
   * @param  {String} to: The id of the element to scroll to.
   * @param  {Integer} offset: A scrolling offset.
   * @param  {Function} callback: Function to apply after scrolling
   * @return {void}
   */
  function scrollPage(to, offset, callback) {
    if ( offset === void 0 ) offset = 0;

    var startTime;
    var duration = 500;
    var startPos = window.pageYOffset;
    var endPos = ~~(to.getBoundingClientRect().top - offset);
    var scroll = function (timestamp) {
      var elapsed;

      startTime = startTime || timestamp;
      elapsed = timestamp - startTime;

      document.body.scrollTop = document.documentElement.scrollTop = easeInOutCubic(elapsed, startPos, endPos, duration);

      if (elapsed < duration) {
        requestAnimationFrame(scroll);
      } else if (callback) {
        callback.call(to);
      }
    };

    requestAnimationFrame(scroll);
  }

  var handle;
  var sections;
  var items = [];
  var isScrolling = false;
  var currentSection = null;
  var ticking = false;


  function stickynav (options) {
    if ( options === void 0 ) options={};

    var offset = options.offset || 0;
    var bounded = options.boundedBy || false;

    handle = document.querySelector(options.nav);
    sections = options.sections || document.querySelectorAll('[data-nav]');

    if (!sections || !handle) { console.log('StickyNav: missing nav or nav sections.'); return false; }

    new Sticky(handle, {
      boundedBy: bounded,
      offset: offset
    });

    generate();
    checkSectionPosition();
    window.addEventListener('scroll', updateActiveItem);
  }


  /**
   * Generate the nav <li>'s and setup the Event Listeners
   * @return {void}
   */
  function generate() {
    var nav = handle.querySelector('ul');

    Array.prototype.forEach.call(sections, function (section) {
      var title = section.getAttribute('data-nav');
      var id = section.id || '';
      var item = document.createElement('li');

      item.innerHTML = '<a href="#'+id+'">'+ title + '</a>';
      item.addEventListener('click', function (e) {
        items.forEach(function (i) { i.className = ''; });
        item.classList.add('active');

        isScrolling = true;
        scrollPage(section, 0, function () { isScrolling = false });
      });

      items.push(item);
      nav.appendChild(item);
    });
  }


  /**
   * Update the active nav item on window.scroll
   * @return {void}
   */
  function updateActiveItem() {
    if (!ticking && !isScrolling) {
      ticking = true;
      window.requestAnimationFrame(checkSectionPosition);
    }
  }


  /**
   * Check each section's getBoundingClientRect to determine which is active
   * @return {void}
   */
  function checkSectionPosition() {
    var i = sections.length;

    // Find i. Start at end and work back
    for (i; i--;) {
      if (~~sections[i].getBoundingClientRect().top <= 0) {    // note: ~~ is Math.floor
        break;
      }
    }

    // Add active class to currentSection, or remove if nothing is currently active
    if (i !== currentSection) {
      items.forEach(function (item) { item.classList.remove('active'); });
      sections.forEach(function (section) { section.classList.remove('active'); });

      if (i >= 0) {
        items[i].classList.add('active');
        sections[i].classList.add('active');
      }
      currentSection = i;
    }

    ticking = false;
  }

  exports.StickyNav = stickynav;
  exports.Sticky = Sticky;
  exports.Scroll = scrollPage;

}((this.window = this.window || {})));
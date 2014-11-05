/*! (c) 2014, Wellthie, Inc. All Rights Reserved. */

'use strict';

window.Trackability = (function($) {

  var defaults = {
    browserEvents:   "submit submit:success click mousedown mouseup mouseenter mouseover mouseout hover change focus blur".split(/\s+/),
    eventNamespace:  "trackability",
    // This is a list of selectors that indicate tracking should be ignored.
    // This is useful when form validation failed or a button has already been clicked and awaiting an AJAX result.
    ignoreSelectors: ["[data-track-ignore]"],
    disableTracking: function() { return $("meta[name=do-not-track]").attr('content') == "true"; },
    defaultTrackingData: {
      // 'FORM': {
        // on: 'submit',
        // action: 'Submitted Form',
        // values: {
          // //text: function(element, value) { return element.val(); },
          // link: function(element, value) { return element.attr('action') || element.attr('id'); }
        // }
      // },
      // 'A': {
        // on: 'click',
        // action: 'Clicked Link',
        // values: {
          // text: function(element, value) { return element.text(); },
          // link: function(element, value) { return element.attr('href') || element.attr('id') || element.attr('name'); }
        // }
      // }
    },
    driver: {
      start: function(trackability) { trackability.log("DefaultDriver#start", arguments); },
      track: function(trackability, action, properties) { trackability.log("DefaultDriver#track", arguments); }
    }
  };

  function Trackability(options) {
    this.options = $.extend({}, defaults, options);
  };

  // Instance methods

  Trackability.prototype = {
    constructor: Trackability,
    // start tracking
    start: function(callback) {
      this.whenTrackable(function() {
        this.options.driver.start(this);
        this.setupDefaultTracking();

        // run custom initialization scripts
        callback && callback.call(this, this);
      });
    },

    setupDefaultTracking: function() {
      // Delegate the default "click" browser event to elements with data-track attributes that don't specify a custom event trigger.
      // If the "on[...]" option is not specified, the default event trigger is "click".
      // Don't apply "click" to FORM elements.
      this.trackBrowserEvent('[data-track]:not([data-track*="on["],form)', "click");
      // Apply the "submit" event to FORM elements that have a data-track* attribute.
      this.trackBrowserEvent('form[data-track]:not([data-track*="on["])', "submit");

      // Delegate all supported custom browser events to elements with data-track attributes that specify a custom event trigger.
      // For example, if you specify data-track="on[mousedown]" then you're specifying a custom event trigger.
      for (var i = 0; i < this.options.browserEvents.length; i++) {
        var browser_event_name = this.options.browserEvents[i];
        // e.g. this.trackBrowserEvent('[data-track="on[mousedown]"]', 'mousedown')
        this.trackBrowserEvent('[data-track*="on[' + browser_event_name + ']"]', browser_event_name);
      }
    },

    // selectors = a single selector or an array of selectors
    // browser_event = an event name like "click" or "mousedown"
    // data (optional) = hash of track values to use (typically parsed out of data-track* attributes)
    // event_handler (optional) = callback to fire when a browser event occurs
    trackBrowserEvent: function(selectors, browser_events, data, event_handler) {
      var root = $(document);
      var trackability = this;

      // handle missing parameters

      if ($.isFunction(data)) {
        event_handler = data;
        data = {};
      }
      if ($.isPlainObject(browser_events)) {
        data = browser_events;
        browser_events = data.on;
      }
      if ($.isFunction(browser_events)) {
        event_handler = browser_events;
        browser_events = null;
      }
      if (!event_handler) {
        event_handler = $.proxy(this.handleTrackingEvent, this);
      }
      if (!$.isArray(selectors)) {
        selectors = [selectors];
      }

      // Since browser events are delegated from the BODY tag, we need to make sure the elements that fire browser events
      // don't match a selector that indicates form validation failed or awaiting an AJAX result.
      selectors = $.map(selectors, function(selector, index) {
        var qualified_selector = selector + ":not(" + trackability.options.ignoreSelectors.join(', ') + ")";

        // We need also skip elements that have a custom browser event explicitly defined in the data-track attribute (e.g. data-track="on[mousedown]")
        // This will avoid double binding. However, only modify the selector if it doesn't already reference "on[...]".
        if (/\bon\[/.test(qualified_selector) == false) {
          qualified_selector += ':not([data-track*="on["])';
        }

        return qualified_selector;

      }).join(',');

      // split events on space and optional comma
      var compact_event_names = $.grep(browser_events.split(/\s*,?\s+/), function(browser_event, index) {
        return !!browser_event;
      });

      // add namespace to event (if specified)
      var namespaced_event_names = $.map(compact_event_names, function(browser_event, index) {
        return [browser_event, trackability.options.eventNamespace].join('.');
      }).join(' ');

      // remove any existing tracking events to avoid double-binding
      // this.$el.off(this.eventNamespace, selectors);
      root.off(namespaced_event_names, selectors);

      // attach listener, binding event name with namespace
      root.on(namespaced_event_names, selectors, function(e) {
        trackability.log('Trackability#trackBrowserEvent', e.type, selectors);
        event_handler.call(this, e, data);
      });
    },

    // selector_data.values can be a function
    // selector_data.values can be a hash with each value being a function
    getElementTrackingData: function(target, selector_data) {

      // matches: "action[Button click] on[mousedown]"
      var kv_re     = /\s*([^\[]+)\s*\[\s*([^\]]*)\s*\]/;
      var all_kv_re = RegExp(kv_re.source, "g");

      var element   = $(target);
      var tag       = element[0].tagName;

      var data      = this.options.defaultTrackingData[tag] || {on: "click"};
      // data.values can be a function
      var values    = this.mergeTrackingData(element, data.values);

      // this is a map of data attribute name to the hash that the parsed attribute values will be added to
      var track_attributes = {
        'track': this.mergeTrackingData(element, data, selector_data),
        // selector_data.values can be a function
        'track-values': this.mergeTrackingData(element, values, (selector_data || {}).values)
      };

      // loop through attribute values and add them to the respective hash
      for (var attribute_name in track_attributes) {
        var serialized_values = element.data(attribute_name);
        if (serialized_values) {
          var track_values  = track_attributes[attribute_name];
          var parsed_values = {};

          // loop through matches
          $.each(serialized_values.match(all_kv_re), function(index, item) {
            var match = item.match(kv_re);

            // use matches as key and value
            parsed_values[ match[1] ] = match[2];
          });

          // merge and set back to attribute map
          track_attributes[attribute_name] = this.mergeTrackingData(element, track_values, parsed_values);
        }
      }

      // reset data and values after mapping
      data    = track_attributes['track'];
      values  = track_attributes['track-values'];

      // merge values into data for return value
      data.values = values;

      return data;
    },

    // pass in as many objects to merge in together
    mergeTrackingData: function(element, hash1, hash2/* [, hash3][, hash4] */) {
      var hashes = Array.prototype.slice.call(arguments, 1);
      var result = {};

      $.each(hashes, function(index, data) {
        if (data) {
          // If the hash is actually a function, call the function to return a hash (and pass the existing hash)
          // This is for when tracking.values is a function
          if ($.isFunction(data)) {
            result = $.extend(result, data(element, results));
          } else {
            $.map(data, function(value, key) {
              // if the value is a function, call the function and pass element and existing value
              result[key] = $.isFunction(value) ? value(element, result[key]) : value;
            });
          }
        }
      });

      return result;
    },

    handleTrackingEvent: function(e, data) {
      if (!e.alreadyTracked) {
        e.alreadyTracked = true;

        data = this.getElementTrackingData(e.currentTarget, data);

        this.log('Trackability#handleTrackingEvent', data, e);

        this.track(data.action, data.values);
      }
    },

    track: function(action, properties) {
      this.whenTrackable(function() {
        // merge tracking values into properties passed to segment.io
        var args = [this].concat(Array.prototype.slice.call(arguments));

        this.options.driver.track.apply(this.options.driver, args);
      });
    },

    whenTrackable: function(callback, context) {
      if (this.options.disableTracking()) {
        this.log('Trackability#whenTrackable', 'TRACKING DISABLED');
      } else {
        callback && callback.call(context || this);
      }
    },

    log: function() {
      this.log_array(arguments);
    },

    log_array: function(array) {
      try {
        window.console.log.apply(window.console, ['[Trackability.js]'].concat(array));
      } catch (e) {

      }
    }

  };

  // Setup jQuery auto-loading


  return Trackability;

}(jQuery));

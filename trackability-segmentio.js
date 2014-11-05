

window.SegmentTrackability = (function($) {

  var defaults = {
    segmentKey: "",
    trackingValues: function() {
      // {userId: ""}
      return {};
    }
  };

  function SegmentTrackability(options) {
    this.options = $.extend({}, defaults, options);
  };

  SegmentTrackability.prototype = {
    start: function(trackability) {

      var trackingValues = this.options.trackingValues();

      // initialize segment.io
      analytics.load(this.options.segmentKey);

      //analytics.alias(user_id);
      analytics.identify(trackingValues.userId, trackingValues);

    },
    track: function(trackability, action, properties/*, argN*/) {

      var trackingValues = this.options.trackingValues();

      // merge tracking values into properties passed to segment.io
      var args = [action, $.extend({}, trackingValues, properties)].concat(Array.prototype.slice.call(arguments, 3));

      analytics.track.apply(analytics, args);
    }
  };

  return SegmentTrackability;

}(jQuery));
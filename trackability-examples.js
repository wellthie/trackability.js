function exampleSegmentSetup(segment_options) {

  var trackability = new Trackability({driver: new SegmentTrackability(segment_options || {})});

  exampleSetup(trackability);

};

function exampleSetup(trackability) {

  if (!trackability) {
    trackability = new Trackability();
  }

  window.exampleTrackability = trackability;

  // OVERRIDE DEFAULTS

  // Ignore tracking if flagged in a way that indicates not to tracked (e.g. disabled link or already clicked or failed validation)
  //   .processing = on a button when it's been clicked and waiting to go to the next step
  trackability.options.ignoreSelectors.push(".example.ignore.selector");

  // SETUP DEFAULTS

  trackability.start(function(trackability) {

    // SETUP CUSTOMIZATIONS

    var track_data = {
      action: "Clicked button", //The default is Clicked Link
      on: "click",
      values: {
        section: function(element, value) { return $(element).closest("[data-section]").data("section"); },
        text: function(element, value) { return value || element.val(); },
        link: function(element, value) {
          var link = element.data('modalid') || element.attr('href') || element.attr('id') || element.attr('name');
          if (link != '#') { return link; }
        }
      }
    };

    // See/Hide Plan details
    this.trackBrowserEvent(".button-dd", $.extend({}, track_data, { action: "Viewed Information" }));

    // selector for modal buttons
    this.trackBrowserEvent("a[data-modalid],#quote_family_members_attributes_0_needs_insurance", $.extend({}, track_data, {
      action: "Viewed Information",
      on: "click change"
    }));

    // selector for modal buttons
    this.trackBrowserEvent("div[data-modalid]", $.extend({}, track_data, {
      on: "modal:hidden",
      values: {
        section: track_data.values.section,
        text: "Close Modal",
        link: function(element, value) { return $(element).closest("[data-modalid]").data("modalid"); }
      }
    }));

    // selector for add/remove family member buttons
    this.trackBrowserEvent(".button-add,.button-remove", track_data);

    // track next steps form submissions
    this.trackBrowserEvent(".next-step .next-steps-form", {
      action: "Submitted Next Steps Form",
      on: "submit:success",
      values: {
        section: track_data.values.section,
        text: function(element) { return $(element).closest('[data-next-step-name]').data('next-step-name'); },
        link: function(element) { return $(element).closest('[data-next-step-id]').data('next-step-id'); }
      }
    });

    // track next steps button clicks
    this.trackBrowserEvent(".next-step.item .buttons .button", $.extend({}, track_data, {
      action: "Viewed External Website",
      on: "click",
      values: {
        section: track_data.values.section,
        //text attribute specified on button
        link: function(element) { return $(element).closest('[data-next-step-id]').data('next-step-id'); }
      }
    }));

    this.trackBrowserEvent(".button:not(.buttons .close-popup,.next-step.item .buttons .button)", track_data);
  });


};
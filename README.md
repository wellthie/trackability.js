Trackability.js
===============

Track \[analytics\] events with jQuery 1.4+

Do it by specifying javascript event names and metadata in your HTML. No Javascript coding required. Simply decide what to track as you go through your HTML.

## Usage

### Examples

There is an [example.html](example.html) to see how this works. The [trackability-examples.js](trackability-examples.js) also has some Javascript code on how to wire up custom events through code rather than HTML markup.

## Extensions

### Analytics

By default, Trackability.js doesn't really do much. It allows you to add some `data-*` attributes to your HTML markup, which in turn fires events and passes attributes along with it. The events are monitored at the document level, so AJAX shouldn't be a problem. The magic happens when you tie into analytics, such as [Segment.io](http://www.segment.io).

Out-of-the-box, we have a "driver" for Segment.io. The example shows you how to use it.

## TODO

* Need to add proper documentation
* Need to add proper examples
* Need to refactor code now that it's extracted

## Credits

Pitch in, lend us a hand!

### Authors

* [Joel Van Horn](https://github.com/joelvh)
* [Seth Berger](https://github.com/sethers)
* You...?

### Special Thanks

* [The Affordable Care Advisor](https://www.wellthie.com/products) - originally developed for (and extracted from)
* [Wellthie](https://www.wellthie.com) - sponsored the development of [Trackability.js](https://github.com/wellthie/trackability.js)

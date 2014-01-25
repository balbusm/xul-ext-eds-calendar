
Components.utils.import("resource://edscalendar/utils.jsm");

var EXPORTED_SYMBOLS = [ "CalendarServiceException"];
function CalendarServiceException() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = "CalendarServiceException";

  this.stack = tmp.stack;
  this.message = tmp.message;

  return this
}
var IntermediateInheritor = function() {}
IntermediateInheritor.prototype = Error.prototype;
CalendarServiceException.prototype = new IntermediateInheritor()

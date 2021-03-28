/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2014-2015 Mateusz Balbus <balbusm@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * The GNU General Public License as published by the Free Software Foundation,
 * version 2 is available at: <http://www.gnu.org/licenses/>
 *
 * ***** END LICENSE BLOCK ***** */

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const EXPORTED_SYMBOLS = ["CalendarServiceException", "LoadingLibException"];

var IntermediateInheritor = function() { };
IntermediateInheritor.prototype = Error.prototype;

function CalendarServiceException() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = "CalendarServiceException";

  this.stack = tmp.stack;
  this.message = tmp.message;

  return this;
}
CalendarServiceException.prototype = new IntermediateInheritor();

function LoadingLibException() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = "LoadingLibException";

  this.stack = tmp.stack;
  this.message = tmp.message;

  return this;
}
LoadingLibException.prototype = new IntermediateInheritor();

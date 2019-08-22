/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2014 Mateusz Balbus <balbusm@gmail.com>
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

Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://mozmill/modules/assertions.js");

exports._uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"]
            .getService(Components.interfaces.nsIUUIDGenerator);

exports.generateUuid = function generateUuid() {
  return exports._uuidGenerator.generateUUID().toString();
};

exports.clone = function clone(object) {
  var cloned = Object.create(object.prototype || null);
  Object.keys(object).map(function (i) {
      cloned[i] = object[i];
  });
  return cloned;
};

exports.prepareCalendar = function prepareCalendar(calData) {
  let calendar = exports.clone(calData);
  calendar.getProperty = function (name) {
    if (calData.properties)
      return calData.properties[name];
    return undefined;
  };
  calendar.QueryInterface = ChromeUtils.generateQI([Components.interfaces.calICalendar]);
  return calendar;
};


exports.prepareIcalString = function prepareIcalString(icalString) {
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time (unique uid)
  let uuid = exports.generateUuid();

  return exports.prepareIcalStringWithId(uuid, icalString);
};

exports.prepareIcalStringWithId = function prepareIcalStringWithId(id, icalString) {
  var icalStringPrepared = icalString.replace("${uid}", id);
  return icalStringPrepared;
};

exports.prepareEvent = function prepareEvent(eventData, calendar) {
  var event = cal.createEvent();
  event.calendar = calendar; 
  event.icalString = exports.prepareIcalString(eventData);
  return event;
};

exports.prepareEventWithId = function prepareEventWithId(eventId, eventData, calendar) {
  var event = cal.createEvent();
  event.calendar = calendar; 
  event.icalString = exports.prepareIcalStringWithId(eventId, eventData);
  return event;
};

exports.prepareExceptionEvent = function prepareExceptionEvent(parentEvent, eventData) {
  var newExceptionEvent = exports.prepareEventWithId(parentEvent.id, eventData, parentEvent.calendar);
  newExceptionEvent.parentItem = parentEvent;
  return newExceptionEvent;
};

exports.attachExceptionEvent = function attachExceptionEvent(parentEvent, exceptionEvent) {
  let recurrenceInfo = cal.createRecurrenceInfo();
  recurrenceInfo.item = parentEvent;
  recurrenceInfo.modifyException(exceptionEvent, true);
  parentEvent.recurrenceInfo = recurrenceInfo;
}

exports.prepareTodo = function prepareTodo(todoData, calendar) {
  var todo = cal.createTodo();
  todo.calendar = calendar;
  todo.icalString = exports.prepareIcalString(todoData);
  return todo;
}

exports.removeItemFromArray = function (item, array) {
  let indexOfItem = array.indexOf(item);
  if (indexOfItem > -1) {
    array.splice(indexOfItem, 1);
  }
};

exports.AssertContainer = function() {
  Assert.constructor.call(this);
  this.errors = [];
};
exports.AssertContainer.prototype = new Assert();
exports.AssertContainer.prototype.constructor = exports.AssertContainer;
exports.AssertContainer.prototype.assertErrors = function() {
  let error = this.errors.shift();
  if (error)
    Assert.prototype._logFail.call(this, error);
};

exports.AssertContainer.prototype._logFail = function logFail(result) {
  this.errors.push(result);
};

exports.ResultListener = function (expectedItems, assert){
  this.expectedItems = expectedItems;
  this.assert = assert;
};
exports.ResultListener.prototype.onOperationComplete = function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetai) { 
  if (!Components.isSuccessCode(aStatus)) {
    this.assert.fail("Result operation failed " + aStatus);
  }
};
exports.ResultListener.prototype.onGetResult = function listener_onGetResult(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
  if (!Components.isSuccessCode(aStatus)) {
    this.assert.fail("Unable to get results for calendar " + aCalendar.name + " - " + aCalendar.id +
        ". " + aStatus + " - " + aDetail );
  }
  this._assertExpectedItemsMatch(aItemscalendar);
};
exports.ResultListener.prototype._assertExpectedItemsMatch = function listener_assertExpectedItemsMatch(aItemscalendar) {
  let found = false;
  for (let expectedItem of this.expectedItems) {
    for (let item of aItemscalendar) {
      if (item.id == expectedItem.id) {
        found = true;
        break;
      } 
    }
    if (!found) {
      this.assert.fail("Couldn't find item " + expectedItem.id);
      return;
    }
    found = false;
  }

};


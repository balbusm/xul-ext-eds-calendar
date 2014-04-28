/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is EDS Calendar.
 *
 * The Initial Developer of the Original Code is
 *   Mateusz Balbus <balbusm@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://mozmill/modules/assertions.js");

Components.utils.import("resource://edscalendar/bindings/libical.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

function setupModule(module)
{
  addLogger(module, "edsCalendarTest");
  
  module.uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"]
  .getService(Components.interfaces.nsIUUIDGenerator);
  
  module.assert = new Assert();
  module.AssertContainer = function() {
    Assert.constructor.call(this);
    this.errors = [];
  };
  module.AssertContainer.prototype = new Assert();
  module.AssertContainer.prototype.constructor = module.AssertContainer;
  module.AssertContainer.prototype.assertErrors = function() {
    let error = this.errors.shift();
    if (error)
      Assert.prototype._logFail.call(this, error);
  };
  
  module.AssertContainer.prototype._logFail = function logFail(result) {
    this.errors.push(result);
  };

  module.ResultListener = function (expectedItems, assert){
    this.expectedItems = expectedItems;
    this.assert = assert;
  };
  module.ResultListener.prototype.onOperationComplete = function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetai) { 
    if (!Components.isSuccessCode(aStatus)) {
      this.assert.fail("Result operation failed " + aStatus);
    }
  }
  module.ResultListener.prototype.onGetResult = function listener_onGetResult(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
    if (!Components.isSuccessCode(aStatus)) {
      this.assert.fail("Unable to get results for calendar " + aCalendar.name + " - " + aCalendar.id +
          ". " + aStatus + " - " + aDetail );
    }
    this._assertExpectedItemsMatch(aItemscalendar);
  }
  module.ResultListener.prototype._assertExpectedItemsMatch = function listener_assertExpectedItemsMatch(aItemscalendar) {
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

  }
  
}

function teardownModule(module) {
  module.LOG("All tests are finished");
}

function setupTest(test)
{
  let edsCalendarService = Components.classes["@mozilla.org/calendar/calendar;1?type=eds"].getService(Components.interfaces.calICompositeCalendar);
  test.edsCalendarService = edsCalendarService;
  test.calendars = [];
  test.calendarsItems = [];
}

function teardownTest(test)
{
  test.LOG("Tear down test");
  for (let calendarItem of test.calendarsItems) {
    test.LOG("On the end of the test removed calendar item " + calendarItem.name + " - " + calendarItem.id);
    let resultListener = new this.ResultListener([calendarItem], this.assert);
    test.edsCalendarService.deleteItem(calendarItem, resultListener);
  }

  for (let calendar of test.calendars) {
    test.LOG("On the end of the test removed calendar " + calendar.name + " - " + calendar.id);
    test.edsCalendarService.removeCalendar(calendar);
  }
  
}

function testRetreivingEdsCalendarService() {
  this.assert.notEqual(this.edsCalendarService, undefined, "Couldn't retrieve EDS Calendar");
  this.assert.notEqual(this.edsCalendarService, null, "Couldn't retrieve EDS Calendar");
  this.assert.equal(this.edsCalendarService instanceof Components.interfaces.calICalendar, true, "Couldn't retrieve EDS Calendar with calICalendar interface");
  this.assert.equal(this.edsCalendarService instanceof Components.interfaces.calICompositeCalendar, true, "Couldn't retrieve EDS Calendar with calICompositeCalendar interface");
}

function testLongAddRemoveCalendars() {
  for (let i = 0; i < 50; i++) {
    let calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae-XYY" + i, name: "testLongAddRemoveCalendars" + i};
    this.edsCalendarService.addCalendar(calendar);
    let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
    this.edsCalendarService.removeCalendar(calendar);
    this.assert.equal(resultCalendar.id, calendar.id);
  }
}

function testLongAddRemoveItems() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae00", name: "testLongAddRemoveItems"};
  this.calendars.push(calendar);
  this.edsCalendarService.addCalendar(calendar);
  for (let i = 0; i < 50; i++) {
    // FIXME: There is a bug in EDS that doesn't remove esource nor item
    // as a workaround generate different item each time
    let uuid = this.uuidGenerator.generateUUID();
    let uuidString = uuid.toString();
    var item = {id: uuidString, name: "testItem" + i,
        QueryInterface: XPCOMUtils.generateQI([
                                               Components.interfaces.nsISupports,
                                               Components.interfaces.calIEvent
                                             ]),
        calendar: calendar, icalString:
          "BEGIN:VCALENDAR\n" +
          "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
          "VERSION:2.0\n" +
          "BEGIN:VTIMEZONE\n" +
          "TZID:Europe/Warsaw\n" +
          "X-LIC-LOCATION:Europe/Warsaw\n" +
          "BEGIN:DAYLIGHT\n" +
          "TZOFFSETFROM:+0100\n" +
          "TZOFFSETTO:+0200\n" +
          "TZNAME:CEST\n" +
          "DTSTART:19700329T020000\n" +
          "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
          "END:DAYLIGHT\n" +
          "BEGIN:STANDARD\n" +
          "TZOFFSETFROM:+0200\n" +
          "TZOFFSETTO:+0100\n" +
          "TZNAME:CET\n" +
          "DTSTART:19701025T030000\n" +
          "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
          "END:STANDARD\n" +
          "END:VTIMEZONE\n" +
          "BEGIN:VEVENT\n" +
          "CREATED:20131220T225208Z\n" +
          "LAST-MODIFIED:20131220T225233Z\n" +
          "DTSTAMP:20131220T225233Z\n" +
          "UID:" + uuidString + "\n" +
          "SUMMARY:New Event\n" +
          "CATEGORIES:Birthday\n" +
          "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
          "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
          "LOCATION:loc\n" +
          "END:VEVENT\n" +
          "END:VCALENDAR",
          clone : function() { return this;}
          };
    let assertContainer = new this.AssertContainer();
    let resultListener = new this.ResultListener([item], assertContainer);
    this.edsCalendarService.addItem(item, resultListener);
    this.edsCalendarService.getItem(item.id, resultListener);
    this.edsCalendarService.deleteItem(item, resultListener);
    assertContainer.assertErrors();
  }
}

function testAddNewCalendar() {
  let calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae01", name: "testAddNewCalendar"};
  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
  this.LOG("Result calendar " + resultCalendar.id);
  this.assert.notEqual(resultCalendar, null, "Couldn't retrieve calendar");
  this.assert.equal(resultCalendar.id, calendar.id, "Couldn't retrieve calendar with valid id");
  this.assert.equal(resultCalendar.name, calendar.name, "Couldn't retrieve calendar with valid name");
}

function testRemoveCalendar() {
  let calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae02", name: "testRemoveCalendar"};
  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  this.edsCalendarService.removeCalendar(calendar);
  let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
  this.assert.equal(resultCalendar, null, "Unexpectedly retrieved calendar");

  let indexOfCalendar = this.calendars.indexOf(calendar);
  if (indexOfCalendar > -1) {
    this.calendars.splice(indexOfCalendar, 1);
  }

}

function testAddItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae03", name: "testAddItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "CATEGORIES:Birthday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

function testGetItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae04", name: "testGetItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "CATEGORIES:Birthday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  this.edsCalendarService.getItem(item.id, resultListener);
  assertContainer.assertErrors();
}

function testDeleteItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae05", name: "testDeleteItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "CATEGORIES:Birthday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([], assertContainer);
  resultListener._assertExpectedItemsMatch = function (aItemscalendar) {
    if (aItemscalendar.length > 0) {
      this.assert.fail("Unexpected items has been returned");
    }
  };
  this.edsCalendarService.addItem(item, resultListener);
  this.edsCalendarService.deleteItem(item, resultListener);
  assertContainer.assertErrors();
  this.edsCalendarService.getItem(item.id, resultListener);
  assertContainer.assertErrors();
  let indexOfItem = this.calendarsItems.indexOf(item);
  if (indexOfItem > -1) {
    this.calendarsItems.splice(indexOfItem, 1);
  }
}


function testModifyItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae06", name: "testModifyItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var itemOld = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "CATEGORIES:Birthday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  var itemNew = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20131220T225208Z\n" +
        "LAST-MODIFIED:20131220T225233Z\n" +
        "DTSTAMP:20131220T225233Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "CATEGORIES:Namesday\n" +
        "DTSTART;TZID=Europe/Warsaw:20131212T234500\n" +
        "DTEND;TZID=Europe/Warsaw:20131213T004500\n" +
        "LOCATION:loc\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  this.calendarsItems.push(itemOld);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(itemOld, resultListener);
  this.edsCalendarService.modifyItem(itemNew, itemOld, resultListener);
  assertContainer.assertErrors();
}

function testAddRecurringItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae07", name: "testAddItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140110T202736Z\n" +
        "LAST-MODIFIED:20140110T202918Z\n" +
        "DTSTAMP:20140110T202918Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event hard\n" +
        "ATTENDEE;RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:testmail@gmail.com\n" +
        "ATTACH:http://google.com/\n" +
        "RRULE:FREQ=DAILY;UNTIL=20140124T210000Z\n" +
        "DTSTART;TZID=Europe/Warsaw:20140109T220000\n" +
        "DTEND;TZID=Europe/Warsaw:20140109T230000\n" +
        "TRANSP:OPAQUE\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  // TODO add single occurence modification
  // TODO add single occurence delete (first, last, middle)
  // TODO add single occurence modification + delete
  // TODO add single occurence modification + delete all
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

function testAddAlertItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae08", name: "testAddItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VEVENT\n" +
        "CREATED:20140110T203927Z\n" +
        "LAST-MODIFIED:20140110T203955Z\n" +
        "DTSTAMP:20140110T203955Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" +
        "DTSTART;TZID=Europe/Warsaw:20140110T215500\n" +
        "DTEND;TZID=Europe/Warsaw:20140110T225500\n" +
        "DESCRIPTION:Description\n" +
        "BEGIN:VALARM\n" +
        "ACTION:DISPLAY\n" +
        "TRIGGER;VALUE=DURATION:-PT15M\n" +
        "DESCRIPTION:Default Mozilla Description\n" +
        "END:VALARM\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR",
        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

/**
 * Skipped. TODO functionality not implemented yet
 */
function disabledtestAddTodoItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae09", name: "testAddItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calITodo
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VTIMEZONE\n" +
        "TZID:Europe/Warsaw\n" +
        "X-LIC-LOCATION:Europe/Warsaw\n" +
        "BEGIN:DAYLIGHT\n" +
        "TZOFFSETFROM:+0100\n" +
        "TZOFFSETTO:+0200\n" +
        "TZNAME:CEST\n" +
        "DTSTART:19700329T020000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" +
        "END:DAYLIGHT\n" +
        "BEGIN:STANDARD\n" +
        "TZOFFSETFROM:+0200\n" +
        "TZOFFSETTO:+0100\n" +
        "TZNAME:CET\n" +
        "DTSTART:19701025T030000\n" +
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" +
        "END:STANDARD\n" +
        "END:VTIMEZONE\n" +
        "BEGIN:VTODO\n" +
        "CREATED:20140110T215005Z\n" +
        "LAST-MODIFIED:20140110T215112Z\n" +
        "DTSTAMP:20140110T215112Z\n" +
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Task\n" +
        "STATUS:IN-PROCESS\n" +
        "RRULE:FREQ=DAILY\n" +
        "CATEGORIES:Anniversary\n" +
        "CATEGORIES:Birthday\n" +
        "DTSTART;TZID=Europe/Warsaw:20140121T230000\n" +
        "DUE;TZID=Europe/Warsaw:20140121T230000\n" +
        "LOCATION:location\n" +
        "PERCENT-COMPLETE:17\n" +
        "DESCRIPTION:desc\n" +
        "BEGIN:VALARM\n" +
        "ACTION:DISPLAY\n" +
        "TRIGGER;VALUE=DURATION:-PT30M\n" +
        "DESCRIPTION:Default Mozilla Description\n" +
        "END:VALARM\n" +
        "END:VTODO\n" +
        "END:VCALENDAR",

        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

/**
 * Skipped. TODO functionality not implemented yet
 */
function disabledtestAddEvolutionTodoItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae10", name: "testAddItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calITodo
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Ximian//NONSGML Evolution Calendar//EN\n" +
        "VERSION:2.0\n" +
        "METHOD:PUBLISH\n" +
        "BEGIN:VTODO\n" +
        "UID:20140112T181602Z-11525-1000-1581-0@mati-VirtualBox\n" +
        "DTSTAMP:20140112T181353Z\n" +
        "PERCENT-COMPLETE:0\n" +
        "PRIORITY:0\n" +
        "SUMMARY:BIG\n" +
        "CLASS:PUBLIC\n" +
        "SEQUENCE:1\n" +
        "CREATED:20140112T181633Z\n" +
        "LAST-MODIFIED:20140112T181633Z\n" +
        "END:VTODO\n" +
        "END:VCALENDAR",

        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

function testEditRecurrenceItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae11", name: "testEditItemCal" };
  this.calendars.push(calendar);
  // FIXME: There is a bug in EDS that doesn't remove esource nor item
  // as a workaround generate different item each time
  let uuid = this.uuidGenerator.generateUUID();
  let uuidString = uuid.toString();
  var item = {id: uuidString, name: "testItem1",
      QueryInterface: XPCOMUtils.generateQI([
                                             Components.interfaces.nsISupports,
                                             Components.interfaces.calIEvent
                                           ]),
      calendar: calendar, icalString:
        "BEGIN:VCALENDAR\n" +
        "PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN\n" + 
        "VERSION:2.0\n" + 
        "BEGIN:VTIMEZONE\n" + 
        "TZID:Europe/Warsaw\n" + 
        "X-LIC-LOCATION:Europe/Warsaw\n" + 
        "BEGIN:DAYLIGHT\n" + 
        "TZOFFSETFROM:+0100\n" + 
        "TZOFFSETTO:+0200\n" + 
        "TZNAME:CEST\n" + 
        "DTSTART:19700329T020000\n" + 
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\n" + 
        "END:DAYLIGHT\n" + 
        "BEGIN:STANDARD\n" + 
        "TZOFFSETFROM:+0200\n" + 
        "TZOFFSETTO:+0100\n" + 
        "TZNAME:CET\n" + 
        "DTSTART:19701025T030000\n" + 
        "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\n" + 
        "END:STANDARD\n" + 
        "END:VTIMEZONE\n" + 
        "BEGIN:VEVENT\n" + 
        "CREATED:20140428T194726Z\n" + 
        "LAST-MODIFIED:20140428T194739Z\n" + 
        "DTSTAMP:20140428T194739Z\n" + 
        "UID:" + uuidString + "\n" +
        "SUMMARY:New Event\n" + 
        "RRULE:FREQ=DAILY;UNTIL=20140504T200000Z\n" + 
        "DTSTART;TZID=Europe/Warsaw:20140415T220000\n" + 
        "DTEND;TZID=Europe/Warsaw:20140415T230000\n" + 
        "END:VEVENT\n" + 
        "END:VCALENDAR",

        clone : function() { return this;}
        };
  this.calendarsItems.push(item);
  let assertContainer = new this.AssertContainer();
  let resultListener = new this.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

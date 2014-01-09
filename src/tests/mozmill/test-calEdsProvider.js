/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
/* ***** BEGIN LICENSE BLOCK *****
 *	 Version: MPL 1.1/GPL 2.0/LGPL 2.1
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
 * The Original Code is edsintegration.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Corp.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Mike Conley <mconley@mozilla.com>
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

Components.utils.import("resource://edscalendar/utils.jsm");

function setupModule(module)
{
  addLogger(module, "edsCalendarTest");
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
  for (let calendarItem of test.calendarsItems) {
    let resultListener = new this.ResultListener([calendarItem], this.assert);
    test.edsCalendarService.deleteItem(calendarItem, resultListener);
    test.LOG("Removed calendar item " + calendarItem);
  }

  for (let calendar of test.calendars) {
    test.edsCalendarService.removeCalendar(calendar);
    test.LOG("Removed calendar " + calendar);
  }
  
}

function testRetreivingEdsCalendarService() {
  this.assert.notEqual(this.edsCalendarService, undefined, "Couldn't retrieve EDS Calendar");
  this.assert.notEqual(this.edsCalendarService, null, "Couldn't retrieve EDS Calendar");
  this.assert.equal(this.edsCalendarService instanceof Components.interfaces.calICalendar, true, "Couldn't retrieve EDS Calendar with calICalendar interface");
  this.assert.equal(this.edsCalendarService instanceof Components.interfaces.calICompositeCalendar, true, "Couldn't retrieve EDS Calendar with calICompositeCalendar interface");
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
}

function testAddItem() {
  var calendar = {id: "f8192dac-61dc-11e3-a20e-010b628cae03", name: "testAddItemCal" };
  this.calendars.push(calendar);
  var item = {id: "f8192dac-61dc-11e3-a20e-010b628cee01", name: "testItem1",
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
        "UID:ce51645f-2771-4028-94e8-746802aef468\n" +
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
  debugger;
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
  this.edsCalendarService.getItem(item.id, resultListener);
  assertContainer.assertErrors();
  
}

function testDeleteItem() {
}

function testModifyItem() {
}

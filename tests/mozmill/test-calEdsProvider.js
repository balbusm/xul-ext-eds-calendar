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
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://mozmill/modules/assertions.js");

Components.utils.import("resource://edscalendar/bindings/libical-glib.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

function setupModule(module)
{
  addLogger(module, "edsCalendarTest");
  
  module.testData = require("modules/testData");
  module.testUtils = require("modules/testUtils");
  
  module.uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"]
  .getService(Components.interfaces.nsIUUIDGenerator);
  
  module.assert = new Assert();
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
    let resultListener = new testUtils.ResultListener([calendarItem], this.assert);
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
  let currentTestData = testData.testLongAddRemoveCalendars;
  for (let i = 0; i < 50; i++) {
    let calendar = testUtils.prepareCalendar(currentTestData.calendar);
    calendar.id = calendar.id + i;
    calendar.name = calendar.name + i;
    this.edsCalendarService.addCalendar(calendar);
    let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
    this.edsCalendarService.removeCalendar(calendar);
    this.assert.equal(resultCalendar.id, calendar.id);
  }
}

function testLongAddRemoveItems() {
  let currentTestData = testData.testLongAddRemoveItems;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  for (let i = 0; i < 50; i++) {
    var item = testUtils.prepareEvent(currentTestData.item, calendar);
    item.title = item.title + i;
    let assertContainer = new testUtils.AssertContainer();
    let resultListener = new testUtils.ResultListener([item], assertContainer);
    this.edsCalendarService.addItem(item, resultListener);
    this.edsCalendarService.getItem(item.id, resultListener);
    this.edsCalendarService.deleteItem(item, resultListener);
    assertContainer.assertErrors();
  }
}

function testAddNewCalendar() {
  let currentTestData = testData.testAddNewCalendar;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);

  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
  this.LOG("Result calendar " + resultCalendar.id);
  this.assert.notEqual(resultCalendar, null, "Couldn't retrieve calendar");
  this.assert.equal(resultCalendar.id, calendar.id, "Couldn't retrieve calendar with valid id");
  this.assert.equal(resultCalendar.name, calendar.name, "Couldn't retrieve calendar with valid name");
}

function testRemoveCalendar() {
  let currentTestData = testData.testRemoveCalendar;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  this.edsCalendarService.removeCalendar(calendar);
  let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
  this.assert.equal(resultCalendar, null, "Unexpectedly retrieved calendar");

  testUtils.removeItemFromArray(calendar, this.calendars);

}

function testAddItem() {
  let currentTestData = testData.testAddItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item = testUtils.prepareEvent(currentTestData.item, calendar);
  this.calendarsItems.push(item);
  
  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

function testGetItem() {
  let currentTestData = testData.testGetItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);
  
  var item = testUtils.prepareEvent(currentTestData.item, calendar);
  this.calendarsItems.push(item);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  this.edsCalendarService.getItem(item.id, resultListener);
  assertContainer.assertErrors();
}

function testDeleteItem() {
  let currentTestData = testData.testDeleteItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item = testUtils.prepareEvent(currentTestData.item, calendar);
  this.calendarsItems.push(item);
  
  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
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
  
  testUtils.removeItemFromArray(item, this.calendarsItems);
}


function testModifyItem() {
  let currentTestData = testData.testModifyItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var itemOld = testUtils.prepareEvent(currentTestData.oldItem, calendar);
  var itemNew = testUtils.prepareEventWithId(itemOld.id, currentTestData.newItem, calendar);
  this.calendarsItems.push(itemOld);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(itemOld, resultListener);
  this.edsCalendarService.modifyItem(itemNew, itemOld, resultListener);
  assertContainer.assertErrors();
  // TODO check if category is namesday
}

function testAddRecurringItem() {
  let currentTestData = testData.testAddRecurringItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item = testUtils.prepareEvent(currentTestData.item, calendar);
  this.calendarsItems.push(item);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

function testAddAlertItem() {
  let currentTestData = testData.testAddAlertItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item = testUtils.prepareEvent(currentTestData.item, calendar);
  this.calendarsItems.push(item);
  
  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

/**
 * Skipped. TODO functionality not implemented yet
 */
function disabledtestAddTodoItem() {
  let currentTestData = testData.testAddTodoItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item = testUtils.prepareTodo(currentTestData.item, calendar);
  this.calendarsItems.push(item);
  
  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

/**
 * Skipped. TODO functionality not implemented yet
 */
function disabledtestAddEvolutionTodoItem() {
  let currentTestData = testData.testAddEvolutionTodoItem;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.calendars.push(calendar);

  var item =  testUtils.prepareTodo(currentTestData.item, calendar);
  this.calendarsItems.push(item);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([item], assertContainer);
  this.edsCalendarService.addItem(item, resultListener);
  assertContainer.assertErrors();
}

// modification of single element in repetable event
function testEditRecurrenceItem() {
  let currentTestData = testData.testEditRecurrenceItem;
  let calendar = testUtils.prepareCalendar(currentTestData.calendar);
  var oldItem = testUtils.prepareEvent(currentTestData.oldParentItem, calendar);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(oldItem, resultListener);
  this.calendars.push(calendar);
  this.calendarsItems.push(oldItem);
  
  var newItem = testUtils.prepareEventWithId(oldItem.id, currentTestData.newParentItem, calendar);
  
  let newExceptionItem = testUtils.prepareExceptionEvent(newItem, currentTestData.newExceptionItem);
  testUtils.attachExceptionEvent(newItem, newExceptionItem);
  
  this.edsCalendarService.modifyItem(newItem, oldItem, resultListener);
  // TODO create getter to check if 20140402 has different name
  assertContainer.assertErrors();
}

// removal of last element in repetable event
function testRemovalLastRecurrenceItem() {
  let currentTestData = testData.testRemovalLastRecurrenceItem;
  let calendar = testUtils.prepareCalendar(currentTestData.calendar);
  var oldItem = testUtils.prepareEvent(currentTestData.oldParentItem, calendar);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(oldItem, resultListener);
  this.calendars.push(calendar);
  this.calendarsItems.push(oldItem);
  
  var newItem = testUtils.prepareEventWithId(oldItem.id, currentTestData.newParentItem, calendar);
  
  this.edsCalendarService.modifyItem(newItem, oldItem, resultListener);
  // TODO create getter to verify if 20140406 has been removed
  assertContainer.assertErrors();
}

//modification of single element in repetable event and removal this element
function testEditRemovalRecurrenceItem() {
  let currentTestData = testData.testEditRemovalRecurrenceItem;
  let calendar = testUtils.prepareCalendar(currentTestData.calendar);
  var oldItem = testUtils.prepareEvent(currentTestData.oldParentItem, calendar);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(oldItem, resultListener);
  this.calendars.push(calendar);
  this.calendarsItems.push(oldItem);
  
  var newItem = testUtils.prepareEventWithId(oldItem.id, currentTestData.newParentItem, calendar);
  
  let newExceptionItem = testUtils.prepareExceptionEvent(newItem, currentTestData.newExceptionItem);
  testUtils.attachExceptionEvent(newItem, newExceptionItem);
  
  this.edsCalendarService.modifyItem(newItem, oldItem, resultListener);
  // all above is same as testEditRecurrenceItem, 20140402 is modified
  
  var removalItem = testUtils.prepareEventWithId(oldItem.id, currentTestData.removalParentItem, calendar);
  
  this.edsCalendarService.modifyItem(removalItem, newItem, resultListener);
  // TODO check if 20140402 has been removed
  assertContainer.assertErrors();
}

//modification of single element in repetable event and removal all elements
function testEditRemovalAllRecurrenceItem() {
  let currentTestData = testData.testEditRemovalAllRecurrenceItem;
  let calendar = testUtils.prepareCalendar(currentTestData.calendar);
  
  var oldItem = testUtils.prepareEvent(currentTestData.oldParentItem, calendar);

  let assertContainer = new testUtils.AssertContainer();
  let resultListener = new testUtils.ResultListener([], assertContainer);
  this.edsCalendarService.addItem(oldItem, resultListener);
  this.calendars.push(calendar);
  this.calendarsItems.push(oldItem);
  
  var newItem = testUtils.prepareEventWithId(oldItem.id, currentTestData.newParentItem, calendar);
  
  let newExceptionItem = testUtils.prepareExceptionEvent(newItem, currentTestData.newExceptionItem);
  testUtils.attachExceptionEvent(newItem, newExceptionItem);
  
  this.edsCalendarService.modifyItem(newItem, oldItem, resultListener);
  // all above is same as testEditRecurrenceItem, 20140402 is modified
  
  this.edsCalendarService.deleteItem(newItem, resultListener);
  // TODO check if all items has been removed, especially 20140402
  assertContainer.assertErrors();

  testUtils.removeItemFromArray(oldItem, this.calendarsItems);
}

function testSetCalendarColor() {
  let currentTestData = testData.testSetCalendarColor;
  var calendar = testUtils.prepareCalendar(currentTestData.calendar);
  this.edsCalendarService.addCalendar(calendar);
  this.calendars.push(calendar);
  let color = this.edsCalendarService.getProperty(calendar.id + "::" + "color");
  this.assert.equal(color, testData.testSetCalendarColor.calendar.properties.color, "Color not set for new calendar");
  
  this.edsCalendarService.setProperty(calendar.id + "::" + "color", "#0000FF");
  
  color = this.edsCalendarService.getProperty(calendar.id + "::" + "color");
  this.assert.equal(color, "#0000FF", "Color not changed by setProperty");
}


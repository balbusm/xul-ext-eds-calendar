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
Components.utils.import('resource://mozmill/driver/mozmill.js');

Components.utils.import("resource://edscalendar/utils.jsm");

function setupModule(module)
{
  addLogger(this, "edsCalendarTest");
}

function teardownModule(module) {
}

function setupTest(test)
{
  addLogger(this, "edsCalendarTest");
//  driver.sleep(10000);
  let edsCalendarService = Components.classes["@mozilla.org/calendar/calendar;1?type=eds"].getService(Components.interfaces.calICompositeCalendar);
  test.edsCalendarService = edsCalendarService;
  test.assert = new Assert();
}

function teardownTest(test)
{
}

function testRetreivingEdsCalendarService() {
  this.assert.notEqual(this.edsCalendarService, undefined, "Couldn't retrieve EDS Calendar");
  this.assert.notEqual(this.edsCalendarService, null, "Couldn't retrieve EDS Calendar");
}

function testAddNewCalendar() {
  debugger;
  let calendar = {id: "f8192dac-61dc-11e3-a20e-010b6288709b", name: "testAddNewCalendar"};
  this.edsCalendarService.addCalendar(calendar);
  let resultCalendar = this.edsCalendarService.getCalendarById(calendar.id);
  this.LOG("Result calendar " + resultCalendar.id);
  this.assert.notEqual(resultCalendar, null, "Couldn't retrieve calendar");
  this.assert.equal(resultCalendar.id, calendar.id, "Couldn't retrieve calendar with valid id");
}


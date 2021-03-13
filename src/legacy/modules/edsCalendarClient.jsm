/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2011 Mark Tully <markjtully@gmail.com>
 * Copyright: 2014-2021 Mateusz Balbus <balbusm@gmail.com>
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

"use strict";

var EXPORTED_SYMBOLS = ["edsCalendarClient"];

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

var { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");

var edsUtils = ChromeUtils.import("resource://edscalendar/legacy/modules/utils.jsm");
var { EdsPreferences } = ChromeUtils.import("resource://edscalendar/legacy/modules/edsPreferences.jsm");
var { calEdsProvider } = ChromeUtils.import("resource://edscalendar/legacy/modules/calEdsProvider.jsm");


class EdsCalendarClient {
  calendar = null;

  startEdsCalendarSync() {
    edsUtils.addLogger(this, "edsCalendarClient");

    this.preferences = new EdsPreferences();
    this.attachDebuggerIfNeeded();

    console.log("[edscalendar] Before get service1");
    edsCalendarClient.LOG("Init start");

    this.edsCalendarService = calEdsProvider;
    // TODO: Add cache?
    // get all the items from all calendars and add them to EDS
    function processCalendars(calendar) {
      calendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, edsCalendarClient.calendarGetListener);
    }

    edsCalendarClient.delayedAsyncLoop(cal.getCalendarManager().getCalendars({}), processCalendars)
      .then(edsCalendarClient.initCompositeCalendar)
      .then(edsCalendarClient.attachCalendarObservers)
      .then(() => edsCalendarClient.LOG("Init finished"));
    }

    initCompositeCalendar() {
      if (edsCalendarClient.calendar === null) {
        edsCalendarClient.calendar = Components.classes["@mozilla.org/calendar/calendar;1?type=composite"].getService(Components.interfaces.calICompositeCalendar);
      }
    }

    attachCalendarObservers() {
      if (edsCalendarClient.calendar) {
        edsCalendarClient.calendar.removeObserver(edsCalendarClient.calendarObserver);
        edsCalendarClient.calendar.addObserver(edsCalendarClient.calendarObserver);
        console.log("[edscalendar] Added observers");
      }
  }

  attachDebuggerIfNeeded() {
    // Use below command to start debugging on start-up
    // thunderbird --start-debugger-server --jsdebugger --wait-for-jsdebugger
    if (edsCalendarClient.preferences.isDebugEnabled()) {
      // eslint-disable-next-line no-debugger
      debugger;
    }
  }

  operationTypeToString(operationType) {
    let result;
    switch (operationType) {
      case Components.interfaces.calIOperationListener.ADD:
        result = "add";
        break;
      case Components.interfaces.calIOperationListener.MODIFY:
        result = "modify";
        break;
      case Components.interfaces.calIOperationListener.DELETE:
        result = "delete";
        break;
      case Components.interfaces.calIOperationListener.GET:
        result = "get";
        break;
      default:
        result = "unknown";
        break;
    }
    return result;
  }

  thread = Components.classes["@mozilla.org/thread-manager;1"]
    .getService(Components.interfaces.nsIThreadManager)
    .currentThread;

  delayedAsyncLoop(collection, callback) {
    let delay = edsCalendarClient.preferences.getInitialProcressingDelay();
    edsCalendarClient.LOG(`Starting async loop with delay ${delay} ms`);
    return new Promise((resolve, reject) => {
      // setTimeout(() => { resolve(); }, delay);
      resolve();
    }).then(() => edsCalendarClient.asyncLoop(collection, callback));
  }

  asyncLoop(collection, callback) {
    var itemProcessingDelay = edsCalendarClient.preferences.getItemProcessingDelay();
    var itemNumber = -1;
    function asyncLoopInternal(resolve, reject) {
      itemNumber++;
      console.log("[edscalendar] Collection2.length %d itemNumber %d", collection.length, itemNumber);
      if (itemNumber >= collection.length) {
        resolve();
        return;
      }
      var item = collection[itemNumber];
      callback.call(edsCalendarClient, item);
      asyncLoopInternal(resolve, reject);
      // setTimeout(() => asyncLoopInternal(resolve, reject), itemProcessingDelay);
    }
    edsCalendarClient.LOG(`Starting iterating items with delay on each item ${itemProcessingDelay} ms`);

    return new Promise(asyncLoopInternal);
  }

  shutdown() {
    this.edsCalendarService.shutdown();
  }

  calendarGetListener = {

    onOperationComplete: function(aCalendar, aStatus, aOperationType, aId, aDetail) {
      if (!Components.isSuccessCode(aStatus)) {
        edsCalendarClient.ERROR("Operation " + edsCalendarClient.operationTypeToString(aOperationType) +
          " on element " + aId + " failed. " + aStatus + " - " + aDetail);
        return;
      }
      // make sure that calendar has been created
      // when there are no items on a list
      let element;
      if (aOperationType == Components.interfaces.calIOperationListener.GET) {
        edsCalendarClient.edsCalendarService.addCalendar(aCalendar);
        element = aCalendar.id;
      } else {
        element = aId;
      }
      edsCalendarClient.LOG("Operation " + edsCalendarClient.operationTypeToString(aOperationType) +
        " on element " + element + " completed");
    },

    onGetResult: function(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
      if (!Components.isSuccessCode(aStatus)) {
        edsCalendarClient.ERROR("Unable to get results for calendar " + aCalendar.name + " - " + aCalendar.id +
          ". " + aStatus + " - " + aDetail);
        return;
      }
      edsCalendarClient.LOG("Adding events for calendar " + aCalendar.name + " - " + aCalendar.id);

      function processItem(item) {
        edsCalendarClient.LOG("Processing item " + item.title + " - " + item.id);
        edsCalendarClient.edsCalendarService.addItem(item, edsCalendarClient.calendarChangeListener);
      }
      if (aCount > 0) {
        edsCalendarClient.asyncLoop(aItemscalendar, processItem);
      }
    }
  };

  calendarChangeListener = {
    onOperationComplete: function(aCalendar, aStatus, aOperationType, aId, aDetail) {
      if (!Components.isSuccessCode(aStatus)) {
        edsCalendarClient.ERROR("Operation " + edsCalendarClient.operationTypeToString(aOperationType) +
          " on element " + aId + " failed. " + aStatus + " - " + aDetail);
        return;
      }

      let element;
      if (aOperationType == Components.interfaces.calIOperationListener.GET) {
        element = aCalendar.id;
      } else {
        element = aId;
      }
      edsCalendarClient.LOG("Operation " + edsCalendarClient.operationTypeToString(aOperationType) +
        " on element " + element + " completed.");
    },

    onGetResult: function(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
      throw "Unexpected operation";
    }
  };

  calendarObserver = {
    QueryInterface: ChromeUtils.generateQI([
      Components.interfaces.calIObserver,
      Components.interfaces.calICompositeObserver
    ]),

    // calIObserver
    onAddItem: function(aItem) {
      edsCalendarClient.LOG("onAddItem");
      edsCalendarClient.edsCalendarService.addItem(aItem, this.calendarChangeListener);
    },

    // calIObserver
    onDeleteItem: function(aItem) {
      edsCalendarClient.LOG("onDeleteItem");
      edsCalendarClient.edsCalendarService.deleteItem(aItem, this.calendarChangeListener);
    },

    // calIObserver
    onModifyItem: function(aNewItem, aOldItem) {
      edsCalendarClient.LOG("onModifyItem");
      edsCalendarClient.edsCalendarService.modifyItem(aNewItem, aOldItem, this.calendarChangeListener);
    },

    // calICompositeObserver
    onCalendarAdded: function(aCalendar) {
      // This is called when a new calendar is added.
      // We can get all the items from the calendar and add them one by one to
      // Evolution Data Server
      edsCalendarClient.LOG("onCalendarAdded");
      aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, edsCalendarClient.calendarGetListener);
    },

    // calICompositeObserver
    onCalendarRemoved: function(aCalendar) {
      edsCalendarClient.LOG("onCalendarRemoved");
      edsCalendarClient.edsCalendarService.removeCalendar(aCalendar);
    },

    // calIObserver
    onStartBatch: function() {
    },

    // calIObserver
    onEndBatch: function() {
    },

    onError: function() { },
    onPropertyChanged: function(aCalendar, aName, aValue, aOldValue) {
      edsCalendarClient.edsCalendarService.setProperty(aCalendar.id + "::" + aName, aValue);
    },
    onPropertyDeleting: function(aCalendar, aName) {
      edsCalendarClient.edsCalendarService.setProperty(aCalendar.id + "::" + aName, null);
    },
    onDefaultCalendarChanged: function() { },
    onLoad: function() { }
  }
}

this.edsCalendarClient = new EdsCalendarClient();

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

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
const Services = globalThis.Services || ChromeUtils.import(
  "resource://gre/modules/Services.jsm"
).Services;
const { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");

const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");
const { maskVariable } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");
const { edsPreferences } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/edsPreferences.jsm");
const { asyncHelper } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/asyncHelper.jsm");
const { calEdsProvider } = ChromeUtils.import("resource://edscalendar/legacy/modules/calEdsProvider.jsm");


const EXPORTED_SYMBOLS = ["edsCalendarClient"];


const edsCalendarClient = {

  calendar: null,

  async startEdsCalendarSync() {
    addLogger(this, "edsCalendarClient");
    this.preferences = edsPreferences;
    this.asyncHelper = asyncHelper;
    this.edsCalendarService = calEdsProvider;

    await this.attachDebuggerIfNeeded();

    edsCalendarClient.LOG("Init start");

    edsCalendarClient.initCompositeCalendar();
    let compositeCalendar = [edsCalendarClient.calendar];

    this.asyncHelper.delayedAsyncLoop(compositeCalendar, this.processCalendar)
      .then(edsCalendarClient.attachCalendarObservers)
      .then(() => edsCalendarClient.LOG("Init finished"));
  },

  initCompositeCalendar() {
    if (edsCalendarClient.calendar === null) {
      edsCalendarClient.calendar = cal.view.getCompositeCalendar(cal.window.getCalendarWindow());
      edsCalendarClient.LOG("Got composite calendar");
    }
  },

  attachCalendarObservers() {
    if (edsCalendarClient.calendar) {
      edsCalendarClient.calendar.removeObserver(edsCalendarClient.calendarObserver);
      edsCalendarClient.calendar.addObserver(edsCalendarClient.calendarObserver);
      edsCalendarClient.LOG("Added observers");
    }
  },

    // get all the items from all calendars and add them to EDS
  async processCalendar(calendar) {
    let iterator = cal.iterate.streamValues(
      calendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null)
    );

    for await (let calItems of iterator) {
      edsCalendarClient.processCalendarItems(calItems);
    }
    return true;
  },

  processCalendarItems(calItems) {
    if (calItems.length === 0) {
      edsCalendarClient.LOG("Got empty calendar item list. Ignoring.");
      return;
    }

    let calendar = calItems[0].calendar;

    edsCalendarClient.LOG(`Adding events ${calItems.length} for calendar ${maskVariable(calendar.name)} - ${calendar.id}`);

    function processItem(item) {
      edsCalendarClient.LOG(`Processing item ${maskVariable(item.title)} - ${item.id}`);

      if (item.calendar.getProperty("edsRemoved")) {
        edsCalendarClient.LOG("Got disabled calendar. Ignoring.");
        return false;
      }

      edsCalendarClient.edsCalendarService.addItem(item, edsCalendarClient.calendarChangeListener);
      return true;
    }
    edsCalendarClient.asyncHelper.asyncLoop(calItems, processItem);
  },


  async attachDebuggerIfNeeded() {
    if (edsCalendarClient.preferences.isDebugEnabled()) {
      await new Promise((resolve, reject) => this.asyncHelper.setTimeout(() => {
          edsCalendarClient.LOG("Awaiting for debugger...");
          // eslint-disable-next-line no-debugger
          debugger;
          resolve();
        }, 30_000));
    }
  },

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
  },

  shutdown() {
    if (this.asyncHelper) {
      this.asyncHelper.shutdown();
    }
    if (this.calendar) {
      this.calendar.removeObserver(edsCalendarClient.calendarObserver);
    }
    if (this.edsCalendarService) {
      this.edsCalendarService.shutdown();
    }
    this.LOG("Eds Calendar client is shutdown");
  },

  // calIOperationListener
  calendarChangeListener: {
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
  },

  calendarObserver: {
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
      aCalendar.setProperty("edsRemoved", false);
      edsCalendarClient.processCalendar(aCalendar);
    },

    // calICompositeObserver
    onCalendarRemoved: function(aCalendar) {
      edsCalendarClient.LOG("onCalendarRemoved");
      aCalendar.setProperty("edsRemoved", true);
      edsCalendarClient.edsCalendarService.removeCalendar(aCalendar);
    },

    // calIObserver
    onStartBatch: function(aCalendar) {
    },

    // calIObserver
    onEndBatch: function(aCalendar) {
    },

    // calIObserver
    onError: function(aCalendar, aError, aMessage) { },
    // calIObserver
    onPropertyChanged: function(aCalendar, aName, aValue, aOldValue) {
      edsCalendarClient.edsCalendarService.setProperty(aCalendar.id + "::" + aName, aValue);
    },
    // calIObserver
    onPropertyDeleting: function(aCalendar, aName) {
      edsCalendarClient.edsCalendarService.setProperty(aCalendar.id + "::" + aName, null);
    },
    // calIObserver
    onDefaultCalendarChanged: function(aCalendar) { },
    // calIObserver
    onLoad: function(aCalendar) { }
  }
};

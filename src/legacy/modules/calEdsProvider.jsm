/* ***** BEGIN LICENSE BLOCK *****
 * EDS Calendar Integration
 * Copyright: 2011 Philipp Kewisch <mozilla@kewis.ch>
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

"use strict";

const { moduleRegistry } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/moduleRegistry.jsm");
moduleRegistry.registerModule(__URI__);

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const { AddonManager } = ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
const { ctypes } = ChromeUtils.import("resource://gre/modules/ctypes.jsm");
const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");

const { gio } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/gio.jsm");
const { glib } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/glib.jsm");
const { gobject } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/gobject.jsm");
const { libical } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/libical-glib.jsm");
const { libecal } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/libecal.jsm");
const { libedataserver } = ChromeUtils.import("resource://edscalendar/legacy/modules/bindings/libedataserver.jsm");
const { CalendarServiceException }= ChromeUtils.import("resource://edscalendar/legacy/modules/utils/exceptions.jsm");
const { addLogger } = ChromeUtils.import("resource://edscalendar/legacy/modules/utils/logger.jsm");


const EXPORTED_SYMBOLS = ["calEdsProvider"];


const calEdsProviderInterfaces = [
  Components.interfaces.nsIClassInfo,
  Components.interfaces.nsIObserver,
  Components.interfaces.calICalendar,
  Components.interfaces.calICompositeCalendar
];
class CalEdsProvider extends cal.provider.BaseClass {
    QueryInterface = ChromeUtils.generateQI(calEdsProviderInterfaces);

    mBatchCalendar = null;
    mBatchClient = null;

    registry = null;

    constructor() {
      super();
      this.initProviderBase();
      addLogger(this, "calEDSProvider");
      glib.init();
      gio.init();
      gobject.init();
      libedataserver.init();
      libical.init();
      libecal.init();
    }

    get type() {
        return "eds";
    }

    get canRefresh() {
        return true;
    }

    get uri() {
        return this.mUri;
    }

    set uri(val) {
        this.mUri = val;
        return this.mUri;
    }

    get id() {
        return this.mId;
    }

    set id(val) {
        this.mId = val;
        return this.mId;
    }

    refresh() {
        this.mObservers.notify("onLoad", [this]);
    }

    getProperty(aName) {
      let complexProperties = aName.split("::");
      if (complexProperties.length == 2) {
        return this.getCalendarProperty(complexProperties[0], complexProperties[1]);
      } else {
        return this.__proto__.__proto__.getProperty.apply(this, arguments);
      }
    }

    getCalendarProperty(calendarId, name) {
      var property = null;
      switch (name) {
      case "name": {
        let namePropertyGetter = function(registry, source) {
          let displayName = libecal.e_source_dup_display_name(source);
          var result = displayName.readString();
          glib.g_free(displayName);
          return result;
        };
        property = this.retrieveESourceAndProcess(namePropertyGetter, calendarId, null);
        break;
      }
      case "color": {
        let colorPropertyGetter = function(registry, source) {
          let sourceExtension = libedataserver.e_source_get_extension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
          let selectableSourceExtension = ctypes.cast(sourceExtension, libedataserver.ESourceSelectable.ptr);
          let color = libedataserver.e_source_selectable_dup_color(selectableSourceExtension);
          var result = color.readString();
          glib.g_free(color);
          return result;
        };
        property = this.retrieveESourceAndProcess(colorPropertyGetter, calendarId, null);
        break;
      }
      }
      return property;
    }

    setProperty(aName, aValue) {
      let complexProperties = aName.split("::");
      if (complexProperties.length == 2) {
        this.setCalendarProperty(complexProperties[0], complexProperties[1], aValue);
      } else {
        this.__proto__.__proto__.setProperty.apply(this, arguments);
      }
    }

    setCalendarProperty(calendarId, name, value) {
      switch (name) {
      case "name": {
        let namePropertySetter = function(registry, source) {
          let error = glib.GError.ptr();
          let displayName = libedataserver.e_source_set_display_name(source, value);
          libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
        };
        this.retrieveESourceAndProcess(namePropertySetter, calendarId);
        break;
      }
      case "color": {
        let colorPropertySetter = function(registry, source) {
          let error = glib.GError.ptr();
          let sourceExtension = libedataserver.e_source_get_extension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
          this.setESourceColor(sourceExtension, value);
          libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
          this.checkGError("Couldn't change property color in source:", error);
        };
        this.retrieveESourceAndProcess(colorPropertySetter, calendarId);
        break;
      }
      }
    }

    retrieveESourceAndProcess(nextCommand, calendarId, defaultResult) {
      let registry = this.getERegistry();

      // look for exising calendar
      let source = this.findESourceByCalendarId(registry, calendarId);
      if (source.isNull()) {
        this.WARN("Calendar " + this.id + " doesn't exist. Unable to call " + nextCommand.name);
        return defaultResult;
      }
      try {
        var result = nextCommand.call(this, registry, source);
        return result;
      } finally {
        if (this.checkCDataNotNull(source)) {
          this.LOG("retrieveESourceAndProcess: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
      }
    }

    checkCDataNotNull(obj) {
      return obj && !obj.isNull();
    }

    checkGError(message, error) {
      if (!error.isNull()) {
        if (message.length > 0) {
          message += " ";
        }
        message += "(" + error.contents.code + ") " +
          error.contents.message.readString();
        glib.g_error_free(error);
        throw new CalendarServiceException(message);
      }
    }

    rethrowNotCalendarServiceException(exception) {
      if (!exception instanceof CalendarServiceException) {
        throw exception;
      }
    }

    getERegistry() {
      this.LOG("Getting ERegistry...");
      let error = glib.GError.ptr();
      let registry = libedataserver.e_source_registry_new_sync(null, error.address());
      this.checkGError("Couldn't get source registry:", error);

      // delete old pointer
      // For some reason removing pointer
      // in try finally block as rest of the pointers
      // causes crash
      this.deleteERegistry();

      this.registry = registry;
      return registry;
    }

    deleteERegistry() {
      if (!this.registry || this.registry.isNull()) {
        return;
      }

      gobject.g_object_unref(this.registry);
      this.registry = null;
    }

    findESource(registry, calendar) {
      return this.findESourceByCalendarId(registry, calendar.id);
    }

    findESourceByCalendarId(registry, id) {
      // look for exising calendar
      var source = libedataserver.e_source_registry_ref_source(registry, id);
      return source;
    }

    /**
     * Returns esource. Remember to call free by g_object_unref()
     */
    getESource(registry, calendar) {
      // look for existing calendar
      this.LOG("Getting ESource...");
      var source = this.findESource(registry, calendar);
      // do not create new one if calendar exists
      if (source.isNull()) {
        source = this.createESource(calendar, registry);
        this.LOG("Created new source for calendar " + calendar.name + " - " + calendar.id);
      }
      return source;
    }

    createESource(calendar, registry) {
      let error = glib.GError.ptr();

      var source = libedataserver.e_source_new_with_uid(calendar.id, null, error.address());
      this.checkGError("Couldn't create new source:", error);

      libedataserver.e_source_set_display_name(source, calendar.name);
      libedataserver.e_source_set_parent(source, "local-stub");
      // TODO add task list support
      let sourceExtension = this.prepareESourceExtension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
      this.setESourceColor(sourceExtension, calendar.getProperty("color"));
      libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
      this.checkGError("Couldn't commit source:", error);

      return source;
    }

    prepareESourceExtension(source, extensionType) {
      let sourceExtension = libedataserver.e_source_get_extension(source, extensionType);
      let selectableSourceExtension = ctypes.cast(sourceExtension, libedataserver.ESourceBackend.ptr);
      libedataserver.e_source_backend_set_backend_name(selectableSourceExtension, "local");
      return sourceExtension;
    }

    setESourceColor(sourceExtension, color) {
      // fall back to default calendar color
      if (!color) {
        color = "#A8C2E1";
      }
      libedataserver.e_source_selectable_set_color(ctypes.cast(sourceExtension, libedataserver.ESourceSelectable.ptr), color);
    }

    getItemSourceType(item) {
      var sourceType;
      if (item instanceof Components.interfaces.calITodo) {
        sourceType = libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_TASKS;
      } else if (item instanceof Components.interfaces.calIEvent) {
        sourceType = libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS;
      } else {
        sourceType = null;
      }
      return sourceType;
    }

    getECalClient(item, eSourceProvider) {
      let calendar = item.calendar;
      // check batch client
      if (this.mBatchCount > 0 && this.mBatchClient !== null) {
        if (this.mBatchCalendar === calendar) {
          this.LOG("Batch used");
          return this.mBatchClient;
        } else {
          let errorMessage = "Batch is started but provided calendar " + calendar.name + " - " + calendar.id +
              " doesn't match calendar " + this.mBatchCalendar.name + " - " +
          this.endBatch();
          throw new CalendarServiceException(errorMessage);
        }
      }
      let error = glib.GError.ptr();
      let registry;
      let source;
      let client;
      try {
        registry = this.getERegistry();
        source = eSourceProvider(registry, calendar);
        let sourceType = this.getItemSourceType(item);

        this.LOG("Connecting ECalClient...");
        client = libecal.e_cal_client_connect_sync(source,
          sourceType,
          libecal.DONT_WAIT,
          null,
          error.address());
        this.checkGError("Couldn't connect to source:", error);
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        // release source in case of error in retreiving client
        // if client is created source is released along with client
        if (this.checkCDataNotNull(source)) {
          this.LOG("getECalClient: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
        throw e;
      }

      // FIXME: Unref old client
      // store new batch client
      if (this.mBatchCount > 0) {
        this.mBatchClient = client;
        this.mBatchCalendar = calendar;
        this.LOG("Saved ECalClient for batch mode");
      }

      this.LOG("ECalClient is ready to use!");
      return client;
    }

    deleteECalClient(client) {
      // keep e cal client when batch is enabled
      if (this.mBatchCount > 0) {
        return;
      }
      this.LOG("Removing cal client");
      if (this.checkCDataNotNull(client)) {
        let source = libedataserver.e_client_get_source(ctypes.cast(client, libedataserver.EClient.ptr));
        gobject.g_object_unref(client);
        if (this.checkCDataNotNull(source)) {
          gobject.g_object_unref(source);
        }
      }
    }

    itemExists(item) {
      let client;
      let icalcomponent;
      try {
        // FIXME: Check if source exists
        let eSourceProvider = this.findESource.bind(this);

        client = this.getECalClient(item, eSourceProvider);

        icalcomponent = this.findItem(client, item);
        return !icalcomponent.isNull();
      } finally {
          if (this.checkCDataNotNull(client)) {
            this.deleteECalClient(client);
          }
          if (this.checkCDataNotNull(icalcomponent)) {
            libical.icalcomponent_free(icalcomponent);
          }
      }
    }

    findItem(client, item) {
      let error = glib.GError.ptr();
      var icalcomponent = libical.icalcomponent.ptr();
      this.LOG("Looking for an item...");
      let found = libecal.e_cal_client_get_object_sync(client, item.id, null, icalcomponent.address(), null, error.address());
      // Ignore error code 1, it is raised when item doesn't exist
      if (!found && !error.isNull()) {
        if (error.contents.code != 1) {
          this.checkGError("Error while looking for an item:", error);
        } else {
          this.LOG("Couldn't find an item");
          glib.g_error_free(error);
        }
      } else {
        this.LOG("Found an item");
      }
      return icalcomponent;
    }

    getObjModType(item) {
      var objModType;
      if (item.recurrenceId) {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_THIS;
      } else {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_ALL;
      }
      return objModType;
    }

    vcalendarAddTimezonesGetItem(client, comp, item) {
      let error = glib.GError.ptr();
      let subcomp = libical.icalcomponent_get_first_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      var itemcomp = null;
      while (!subcomp.isNull()) {
        switch (libical.icalcomponent_isa(subcomp)) {
        case libical.icalcomponent_kind.ICAL_VTIMEZONE_COMPONENT: {
          let zone = libical.icaltimezone_new();
          try {
            if (libical.icaltimezone_set_component(zone, subcomp)) {
              libecal.e_cal_client_add_timezone_sync(client, zone, null, error.address());
              this.checkGError("Couldn't add timezone:", error);
            }
          } finally {
            libical.icaltimezone_free(zone, 1);
          }
          break;
        }
        case libical.icalcomponent_kind.ICAL_VEVENT_COMPONENT:
        case libical.icalcomponent_kind.ICAL_VTODO_COMPONENT:
        case libical.icalcomponent_kind.ICAL_VJOURNAL_COMPONENT:
          itemcomp = subcomp;
          this.vcalendarChangeAlarmDescription(client, itemcomp, item);
          break;
        }
        subcomp = libical.icalcomponent_get_next_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      }

      return itemcomp;
    }

    vcalendarChangeAlarmDescription(client, comp, item) {
      let subcomp = libical.icalcomponent_get_first_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      while (!subcomp.isNull()) {
        if (libical.icalcomponent_isa(subcomp) === libical.icalcomponent_kind.ICAL_VALARM_COMPONENT) {
          let description = libical.icalcomponent_get_description(subcomp);
          // Remove "Default Mozilla Description" as Thunderbird puts it when description is null
          if (description.readString() === "Default Mozilla Description") {
            libical.icalcomponent_set_description(subcomp, item.title);
          }
          break;
        }
        subcomp = libical.icalcomponent_get_next_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      }
    }

    retrieveRecurrenceItems(item) {
      // get parent item
      var recurrenceItems = [item];
      // get recurrenceItems
      if (item.recurrenceInfo) {
        let count = {};
        let recurrenceIds = item.recurrenceInfo.getExceptionIds(count);
        for (let recurrenceId of recurrenceIds) {
          recurrenceItems.push(item.recurrenceInfo.getExceptionFor(recurrenceId));
        }
      }
      return recurrenceItems;
    }

    modifySingleItem(item) {
      let modified;

      // for manual remove
      let comp;
      let subcomp;
      let client;

      try {
        let error = glib.GError.ptr();
        // FIXME: Check if source exists
        let eSourceProvider = this.findESource.bind(this);

        client = this.getECalClient(item, eSourceProvider);
        let objModType = this.getObjModType(item);
        comp = libical.icalcomponent_new_from_string(item.icalString);
        subcomp = this.vcalendarAddTimezonesGetItem(client, comp, item);

        this.LOG("Modifying single item " + item.title + " " + item.id);
        modified = libecal.e_cal_client_modify_object_sync(client, subcomp, objModType, null, error.address());
        this.checkGError("Error modifying single item:", error);
        return modified;
      } finally {
        if (this.checkCDataNotNull(client)) {
          this.deleteECalClient(client);
        }
        if (this.checkCDataNotNull(comp)) {
          libical.icalcomponent_free(comp);
        }
      }
    }

    // array filter implementation
    createKeepDifferentFilter(content) {
      // TODO extract to separate file
      var KeepDifferentFilter = function(contentArg) {
        this.content = contentArg;
      };
      KeepDifferentFilter.prototype = {
          filter: function(recurrenceItem) {
            for (let contentItem of this.content) {
              if (this.compareRecurrenceItems(contentItem, recurrenceItem)) {
                // filter out item
                return false;
              }
            }
            // keep item
            return true;
          },

          compareRecurrenceItems: function(itemA, itemB) {
            if (itemA.recurrenceId && itemB.recurrenceId) {
              // check same recurrence item
              if (itemA.recurrenceId.compare(itemB.recurrenceId)) {
                return true;
              }
            } else if (itemA.recurrenceId || itemB.recurrenceId) {
              // compering recurrence item with parent item
              return false;
            } else if (itemA.id === itemB.id) {
              // same parent items
              return true;
            }
            return false;
          }
      };
      return new KeepDifferentFilter(content);
    }

    // calICalendar
    adoptItem(aItem, aListener) {
      var nserror;
      var detail;
      let created;

      // to manual remove
      let client;
      let icalcomponent;
      let comp;
      let itemcomp;
      let uid;

      try {
        let error = glib.GError.ptr();
        let eSourceProvider = this.getESource.bind(this);
        client = this.getECalClient(aItem, eSourceProvider);

        icalcomponent = this.findItem(client, aItem);
        // item exists in calendar, do not add it
        if (!icalcomponent.isNull()) {
          this.LOG("Skipping item: " + aItem.title + " - " + aItem.id);
          libical.icalcomponent_free(icalcomponent);
          return;
        }

        comp = libical.icalcomponent_new_from_string(aItem.icalString);
        uid = glib.gchar.ptr();

        itemcomp = this.vcalendarAddTimezonesGetItem(client, comp, aItem);

        created = libecal.e_cal_client_create_object_sync(client, itemcomp, uid.address(), null, error.address());
        this.checkGError("Error adding item:", error);

        // notify obeservers that given item has been synchronized
        this.LOG("Created new EDS item " + aItem.title + " - " + aItem.id);
        this.mObservers.notify("onAddItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        nserror = Components.results.NS_ERROR_FAILURE;
        detail = e.message;
        this.ERROR(detail);
        this.ERROR(e.stack);
        this.ERROR("Exception for Item icalString:\n" + aItem.icalString);
      } finally {
        if (this.checkCDataNotNull(client)) {
          this.deleteECalClient(client);
        }
        if (this.checkCDataNotNull(comp)) {
          libical.icalcomponent_free(comp);
        }
        if (this.checkCDataNotNull(uid)) {
          glib.g_free(uid);
        }
      }

      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.ADD,
          (created ? aItem.id : null),
          detail);
    }

    // calICalendar
    addItem(aItem, aListener) {
        return this.adoptItem(aItem.clone(), aListener);
    }

    // calICalendar
    modifyItem(aNewItem, aOldItem, aListener) {
      var detail;
      var nserror;
      let modified;

      try {
        let oldRecurrenceItems = this.retrieveRecurrenceItems(aOldItem);
        let newRecurrenceItems = this.retrieveRecurrenceItems(aNewItem);
        // TODO use prototype instead
        let itemFilter = this.createKeepDifferentFilter(newRecurrenceItems);
        let removedRecurrences = oldRecurrenceItems.filter(itemFilter.filter, itemFilter);

        itemFilter = this.createKeepDifferentFilter(removedRecurrences);
        let modifiedRecurrences = newRecurrenceItems.filter(itemFilter.filter, itemFilter);

        for (let removedRecurrence of removedRecurrences) {
          // this could have better listener handling
          this.deleteItem(removedRecurrence, aListener);
        }

        for (let modifiedRecurrence of modifiedRecurrences) {
          if (this.itemExists(modifiedRecurrence)) {
            modified = this.modifySingleItem(modifiedRecurrence);
          } else {
            this.LOG("No old item to modify. Adding single item " + modifiedRecurrence.title + " " + modifiedRecurrence.id);
            this.addItem(modifiedRecurrence, aListener);
            modified = true;
          }
        }

        this.LOG("Modified item " + aNewItem.title + " " + aNewItem.id);
        this.mObservers.notify("onModifyItem", [aNewItem, aOldItem]);
        nserror = Components.results.NS_OK;
        detail = aNewItem;
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        detail = e.message;
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
        this.ERROR("Exception for NewItem.icalString:\n" + aNewItem.icalString);
        this.ERROR("Exception for OldItem.icalString:\n" + aOldItem.icalString);
      }

      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.MODIFY,
          (modified ? aNewItem.id : null),
          detail);
    }

    // calICalendar
    deleteItem(aItem, aListener) {
      var detail;
      var nserror;
      let removed;

      // for manual remove
      let client;

      try {
        let error = glib.GError.ptr();
        // FIXME: Check if source exists
        let eSourceProvider = this.findESource.bind(this);
        client = this.getECalClient(aItem, eSourceProvider);
        let objModType = this.getObjModType(aItem);

        let rid = null;
        if (aItem.recurrenceId) {
          rid = aItem.recurrenceId.icalString;
        }
        removed = libecal.e_cal_client_remove_object_sync(client, aItem.id, rid, objModType, null, error.address());
        this.checkGError("Error removing item:", error);

        this.LOG("Removed item " + aItem.title + " " + aItem.id);
        this.mObservers.notify("onDeleteItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        detail = e.message;
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
        this.ERROR("Exception for Item icalString:\n" + aItem.icalString);
      } finally {
        if (this.checkCDataNotNull(client)) {
          this.deleteECalClient(client);
        }
      }

      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.DELETE,
          (removed ? aItem.id : null),
          detail);
    }

    // calICalendar
    getItem(aId, aListener) {
      var nserror;
      var detail = null;

      let error = glib.GError.ptr();
      let registry;
      let sourcesList;
      var calendarItem = null;
      // TODO this method needs refactoring
      // Currently getItem is used only for testing purposes
      try {
        registry = this.getERegistry();
        sourcesList = libedataserver.e_source_registry_list_sources(registry, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
        for (let iter = sourcesList; !iter.isNull(); iter = glib.g_list_next(iter)) {
          let client;
          let icalcomponent;
          try {
            // create client for each source
            let source = ctypes.cast(iter.contents.data, libedataserver.ESource.ptr);
            if (!libedataserver.e_source_registry_check_enabled(registry, source)) {
              continue;
            }
            // FIXME: implement switching the source type
            client = libecal.e_cal_client_connect_sync(source,
                libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS,
                libecal.DONT_WAIT,
                null,
                error.address());
            this.checkGError("Couldn't connect to source:", error);

            // look for item in every client/calendar
            let item = { id: aId };
            icalcomponent = this.findItem(client, item);
            if (!icalcomponent.isNull()) {
              let calendar = this.createCalendarFromESource(source);
              calendarItem = this.icalcomponentToCalendarItem(icalcomponent, calendar);
            }
          } finally {
            if (this.checkCDataNotNull(client)) {
              // all sources will be removed later
              gobject.g_object_unref(client);
            }
            if (this.checkCDataNotNull(icalcomponent)) {
              libical.icalcomponent_free(icalcomponent);
            }
          }
        }

        if (calendarItem !== null) {
          aListener.onGetResult(calendarItem.calendar,
                                 Components.results.NS_OK,
                                 Components.interfaces.calIEvent,
                                 null,
                                 1,
                                 [calendarItem]);
        }
        nserror = Components.results.NS_OK;
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        nserror = Components.results.NS_ERROR_FAILURE;
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(sourcesList)) {
          this.LOG("getItem: Removing source list " + sourcesList.toString());
          glib.g_list_free_full(sourcesList, gobject.g_object_unref);
        }
      }

      this.notifyOperationComplete(aListener, nserror,
                                   Components.interfaces.calIOperationListener.GET,
                                   null, detail);
    }

    icalcomponentToCalendarItem(icalcomponent, calendar) {
      // TODO This is not super since we parse the string again. When
      // lightning moves to using js-ctypes for libical, we can just pass
      // the icalcomponent to the item and have it take what it needs
      let icalstring = libical.icalcomponent_as_ical_string(icalcomponent);
      let item = cal.createEvent(icalstring.readString());
      // Set up the calendar for this item
      item.calendar = calendar;

      glib.g_free(icalstring);

      return item;
    }

    createCalendarFromESource(source) {
      // FIXME create proper calendar
      // calendar should be able to return all fields
      // calendar needs to be read only
      // extract it to separate file
      var EdsCalendar = function(id, name) {
         this.mId = id;
         this.mName = name;
      };
      EdsCalendar.prototype = {
          get name() {
            return this.mName;
          },

          get id() {
            return this.mId;
          },

          QueryInterface: ChromeUtils.generateQI([Components.interfaces.calICalendar]),
      };
      // Using e_source_dup_uid since e_source_get_uid doesn't seem to work
      let sourceId = libedataserver.e_source_dup_uid(source);
      let id = sourceId.readString();
      let sourceName = libedataserver.e_source_dup_display_name(source);
      let name = sourceName.readString();

      var calendar = new EdsCalendar(id, name);

      glib.g_free(sourceId);
      glib.g_free(sourceName);

      this.LOG("Created calendar " + calendar.name + " - " + calendar.id);
      return calendar;
    }


    // calICalendar
    getItems(aItemFilter,
                                    aCount,
                                    aRangeStart,
                                    aRangeEnd,
                                    aListener) {
      // FIXME implement
      throw NS_ERROR_NOT_IMPLEMENTED;
    }

    // calICalendar
    endBatch() {
      this.__proto__.__proto__.endBatch.apply(this, arguments);
      if (this.mBatchCount === 0) {
        this.LOG("Called endbatch");
        if (this.mBatchClient !== null) {
          this.deleteECalClient(this.mBatchClient);
        }
        this.mBatchClient = null;
        this.mBatchCalendar = null;
      }
    }

    // calICompositeCalendar
    addCalendar(/* calICalendar */ aCalendar) {
      let registry;
      let source;
      try {
        registry = this.getERegistry();
        source = this.getESource(registry, aCalendar);
        // FIXME: add calendar items
      } finally {
        if (this.checkCDataNotNull(source)) {
          gobject.g_object_unref(source);
        }
      }
    }

    // calICompositeCalendar
    removeCalendar(/* calICalendar */ aCalendar) {
      let error = glib.GError.ptr();
      let registry;
      let source;
      try {
        registry = this.getERegistry();
        this.LOG("Found registry");

        // look for exising calendar
        source = this.findESource(registry, aCalendar);
        this.LOG("Found source");
        if (source.isNull()) {
          this.WARN("Calendar " + aCalendar.name + " " + aCalendar.id + " doesn't exist. Unable to remove calendar.");
          return;
        }

        // TODO: Shoud items be removed first?
        let removed = libedataserver.e_source_remove_sync(source, null, error.address());
        this.checkGError("Couldn't remove calendar:", error);
        this.LOG("Removed calendar " + aCalendar.name + " " + aCalendar.id);
        // FIXME: add notification
        // ---Place for notification---
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(source)) {
          gobject.g_object_unref(source);
        }
      }
    }

    // calICompositeCalendar
    getCalendarById(aId) {
      let registry;
      let source;
      var calendar = null;
      try {
        registry = this.getERegistry();
        // look for exising calendar
        source = this.findESourceByCalendarId(registry, aId);
        if (source.isNull()) {
          this.LOG("Couldn't find calendar " + aId);
          return null;
        }

        calendar = this.createCalendarFromESource(source);
      } catch (e) {
        this.rethrowNotCalendarServiceException(e);
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(source)) {
          gobject.g_object_unref(source);
        }
      }
      return calendar;
    }

    // calICompositeCalendar
    getCalendars(count, aCalendars) {
      // FIXME implement
      throw NS_ERROR_NOT_IMPLEMENTED;
    }

    // calICompositeCalendar
    defaultCalendar = null;
    // calICompositeCalendar
    prefPrefix = null;

    statusDisplayed = false;

    // calICompositeCalendar
    setStatusObserver = function(/* calIStatusObserver */ aStatusObserver, /* nsIDOMChromeWindow */ aWindow) {
      // FIXME implement
      throw NS_ERROR_NOT_IMPLEMENTED;
    };

    shutdown() {
      this.LOG("Closing EDS Calendar Service");
      this.deleteERegistry();
      // TODO Don't close c-libs as they won't work after resume
      // libecal.shutdown();
      // libedataserver.shutdown();
      // libical.shutdown();
      // gobject.shutdown();
      // gio.shutdown();
      // glib.shutdown();
    }
}

this.calEdsProvider = new CalEdsProvider();

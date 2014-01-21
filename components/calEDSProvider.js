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
 * The Original Code is Mozilla Calendar code.
 *
 * The Initial Developer of the Original Code is
 *   Philipp Kewisch <mozilla@kewis.ch>
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Mateusz Balbus <balbusm@gmail.com>
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

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ctypes.jsm");
Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://calendar/modules/calProviderUtils.jsm");

Components.utils.import("resource://edscalendar/bindings/gio.jsm");
Components.utils.import("resource://edscalendar/bindings/glib.jsm");
Components.utils.import("resource://edscalendar/bindings/gobject.jsm");
Components.utils.import("resource://edscalendar/bindings/libical.jsm");
Components.utils.import("resource://edscalendar/bindings/libecal.jsm");
Components.utils.import("resource://edscalendar/bindings/libedataserver.jsm");
Components.utils.import("resource://edscalendar/utils.jsm");

function calEDSProvider() {
    this.initProviderBase();
    addLogger(this, "calEDSProvider");
    glib.init();
    gio.init();
    gobject.init();
    libical.init();
    libecal.init();
    libedataserver.init();
}

calEDSProvider.prototype = {
    __proto__: cal.ProviderBase.prototype,

    classDescription: "EDS Provider",
    contractID: "@mozilla.org/calendar/calendar;1?type=eds",
    classID:  Components.ID("{4640356f-42a2-4a83-9924-3bda9492ad31}"),
    
    mBatchCalendar : null,
    mBatchClient : null,
    
    registry : null,

    getInterfaces: function getInterfaces (count) {
        var ifaces = [
            Components.interfaces.nsISupports,
            Components.interfaces.calICalendar,
            Components.interfaces.nsIClassInfo, 
            Components.interfaces.calICompositeCalendar
        ];
        count.value = ifaces.length;
        return ifaces;
    },

    getHelperForLanguage: function getHelperForLanguage(aLanguage) {
        return null;
    },

    implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
    flags: 0,
    QueryInterface: XPCOMUtils.generateQI([
                                           Components.interfaces.nsISupports,
                                           Components.interfaces.calICalendar,
                                           Components.interfaces.nsIClassInfo, 
                                           Components.interfaces.calICompositeCalendar
                                           ]),

    get type() {
        return "eds";
    },

    get canRefresh() {
        return true;
    },

    get uri() {
        return this.mUri;
    },

    set uri(val) {
        this.mUri = val;
//        if (this.mId && this.mUri) {
//            this.openEDSCalendar();
//        }
        return this.mUri;
    },

    get id() {
        return this.mId;
    },

    set id(val) {
        this.mId = val;
//        if (this.mId && this.mUri) {
//            this.openEDSCalendar();
//        }
        return this.mId;
    },

    refresh: function refresh() {
        this.mObservers.notify("onLoad", [this]);
    },

    getProperty: function getProperty(aName) {
        switch (aName) {
              case "imip.identity.disabled":
                  return true;
              case "organizerId":
              case "organizerCN":
                  return "mailto:eds";
              case "itip.transport":
                  return null;
              case "disabled":
                  // Pretend to be disabled if the calendar could not be opened
                  // to avoid getItems requests on a null calendar
                  return false;
        }
        return this.__proto__.__proto__.getProperty.apply(this, arguments);
    },
    
    getERegistry : function getERegistry() {
      if (this.registry)
        return this.registry;
      
      let error = glib.GError.ptr();

      let registry = libedataserver.e_source_registry_new_sync(null, error.address());
      
      if (!error.isNull())
      {
        this.ERROR("Couldn't get source registry " + error.contents.code + " - " +
            error.contents.message.readString());
        glib.g_error_free(error);
        return libedataserver.ESourceRegistry.ptr();
      }
      this.registry = registry;
      return registry;
    },
    
    deleteERegistry : function deleteERegistry() {
      if (!this.registry)
        return;
//      glib.g_free(this.registry);
    },

    findESource : function findESource(registry, calendar) {
      return this.findESourceByCalendarId(registry, calendar.id);
    },

    findESourceByCalendarId : function findESourceByCalendarId(registry, id) {
      // look for exising calendar
      let source = libedataserver.e_source_registry_ref_source(registry, id);
      return source;
    },
    
    /**
     * Returns esource. Remember to call free by g_object_unref()
     */
    getESource : function getESource(registry, calendar) {
      // look for existing calendar
      let source = this.findESource(registry, calendar);
      // do not create new one if calendar exists
      if (source.isNull()) {
        source = this.createESource(calendar, registry);
        this.LOG("Created new source for calendar " + calendar.name + " - " + calendar.id);
      }
      return source;
    },

    createESource : function createESource(calendar, registry) {
      let error = glib.GError.ptr();

      let source = libecal.e_source_new_with_uid(calendar.id, null, error.address());
      if (!error.isNull())
      {
        this.ERROR("Couldn't create new source " + error.contents.code + " - " +
            error.contents.message.readString());
        glib.g_error_free(error);
        return libecal.ESource.ptr();
      }
      libecal.e_source_set_display_name(source, calendar.name);
      libecal.e_source_set_parent(source, "local-stub");
      // TODO add task list support
      this.prepareSourceExtension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
      let sourceCreated  = libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
      if (!sourceCreated || !error.isNull())
      {
        this.ERROR("Couldn't commit source " + error.contents.code + " - " +
            error.contents.message.readString());
        glib.g_error_free(error);
        return libecal.ESource.ptr();
      }
      return source;

    },

    prepareSourceExtension : function prepareSourceExtension(source, extensionType) {
      let sourceExtension = libecal.e_source_get_extension(source, extensionType);
      libedataserver.e_source_backend_set_backend_name(ctypes.cast(sourceExtension,libedataserver.ESourceBackend.ptr), "local");
    },
    
    getItemSourceType : function getItemSourceType(item) {
      var sourceType;
      if (item instanceof Components.interfaces.calITodo)
        sourceType = libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_TASKS;
      else if (item instanceof Components.interfaces.calIEvent)
        sourceType = libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS;
      else
        sourceType = null;
      return sourceType;
    },
    
    getECalClient: function getECalClient(item, eSourceProvider) {
      let calendar = item.calendar;
      // check batch client 
      if (this.mBatchCount > 0 && this.mBatchClient !== null) {
        if (this.mBatchCalendar === calendar) {
          this.LOG("Batch used");
          return this.mBatchClient;
        } else {
          this.ERROR("Batch is started but provided calendar " + calendar.name + " - " + calendar.id +
              " doesn't match calendar " + this.mBatchCalendar.name + " - " +
              this.mBatchCalendar.id);
          this.endBatch();
          return libecal.ECalClient.ptr();
        }
      }
      
      let error = glib.GError.ptr();
      let registry = this.getERegistry();
      let source = eSourceProvider(registry, calendar);
      let sourceType = this.getItemSourceType(item);
      let client = libecal.e_cal_client_connect_sync(source, 
          sourceType,
          null,
          error.address());
      if (!error.isNull())
      {
        this.ERROR("Couldn't open source " + error.contents.code + " - " +
            error.contents.message.readString());
        glib.g_error_free(error);
        return libecal.ECalClient.ptr();
      }
      // FIXME: Unref old client
      // store new batch client
      if (this.mBatchCount > 0) {
        this.mBatchClient = client;
        this.mBatchCalendar = calendar;
      }

      return client;
    },
    
    deleteECalClient : function deleteECalClient(client) {
      // keep e cal client when batch is enabled
      if (this.mBatchCount > 0)
        return;
      this.LOG("Removing client");
      let source = libedataserver.e_client_get_source(ctypes.cast(client, libedataserver.EClient.ptr));
      gobject.g_object_unref(client);
      gobject.g_object_unref(source);
      //      glib.g_free(client);
    },

    findItem : function findItem(client, item) {
      let error = glib.GError.ptr();
      let icalcomponent = libical.icalcomponent.ptr();

      let found = libecal.e_cal_client_get_object_sync(client, item.id, null, icalcomponent.address(), null, error.address());
      // Ignore error code 1, it is raised when item doesn't exist
      if (!found && !error.isNull()) {
        if (error.contents.code != 1) {
          this.ERROR("EDS: Couldn't find item: " + 
            error.contents.code + " - " +
            error.contents.message.readString());
        }
        glib.g_error_free(error);
      }
      // FIXME remove icalcomponent reference
      return icalcomponent;
    },
    
    getObjModType : function getObjModType(item) {
      let objModType;
      if (item.recurrenceId) {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_THIS;
      } else {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_ALL;
      }
      return objModType;
    },

    vcalendar_add_timezones_get_item: function vcalendar_add_timezones(client, comp) {
      let error = glib.GError.ptr();
      let subcomp = libical.icalcomponent_get_first_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      let itemcomp;
      while (!subcomp.isNull()) {
        switch (libical.icalcomponent_isa(subcomp)) {

        case libical.icalcomponent_kind.ICAL_VTIMEZONE_COMPONENT: {
          let zone = libical.icaltimezone_new();
          if (libical.icaltimezone_set_component(zone, subcomp)) {
            libecal.e_cal_client_add_timezone_sync(client, zone, null, error.address());
            // FIXME: add error check
            if (!error.isNull()) {
              let detail = "EDS: Error adding item: " + 
              error.contents.code + " - " +
              error.contents.message.readString();
              this.ERROR(detail);
              glib.g_error_free(error);
            }
          }
          break;
        }
        case libical.icalcomponent_kind.ICAL_VEVENT_COMPONENT:
        case libical.icalcomponent_kind.ICAL_VTODO_COMPONENT:
        case libical.icalcomponent_kind.ICAL_VJOURNAL_COMPONENT:
          itemcomp = subcomp;
          break;
        }
        subcomp = libical.icalcomponent_get_next_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      }

      return itemcomp;
    },
    
    // calICalendar
    adoptItem : function adoptItem(aItem, aListener) {
      debugger;
      let eSourceProvider = this.getESource.bind(this);
      let client = this.getECalClient(aItem, eSourceProvider);
      
      if (client.isNull()) {
        var nserror = Components.results.NS_ERROR_FAILURE;
        var detail = "Couldn't retrieve ECalClient";
        this.notifyOperationComplete(aListener,
            nserror,
            Components.interfaces.calIOperationListener.ADD,
            aItem.id,
            detail);
        return;
      }

      let error = glib.GError.ptr();
      let icalcomponent = this.findItem(client, aItem);
      // item exists in calendar, do not add it
      if (!icalcomponent.isNull()) {
        this.LOG("Skipping item: " + aItem.title + " - " + aItem.id);
        libical.icalcomponent_free(icalcomponent);
        return;
      }

      let comp = libical.icalcomponent_new_from_string(aItem.icalString);
      this.LOG("Given icalString " + aItem.icalString);
      let uid = glib.gchar.ptr();

      let itemcomp = this.vcalendar_add_timezones_get_item(client, comp);

      let created = libecal.e_cal_client_create_object_sync(client, itemcomp, uid.address(), null, error.address());
      
      if (created && error.isNull()) {
        // notify obeservers that given item has been synchronized
        this.mObservers.notify("onAddItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;
        this.LOG("Created new EDS item " + aItem.title + " - " + aItem.id);
      } else {
        detail = "EDS: Error adding item: " + 
          error.contents.code + " - " +
          error.contents.message.readString();
        glib.g_error_free(error);
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
      }

      this.deleteECalClient(client);
      libical.icalcomponent_free(comp);
      // TODO: should itemcomp be freed 
      
      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.ADD,
          (created ? aItem.id : null),
          detail);

    },

    // calICalendar
    addItem: function addItem(aItem, aListener) {
        return this.adoptItem(aItem.clone(), aListener);
    },

    // calICalendar
    modifyItem: function modifyItem(aNewItem, aOldItem, aListener) {
      let error = glib.GError.ptr();
      // FIXME: Check if source exists
      let eSourceProvider = this.getESource.bind(this);
      let client = this.getECalClient(aNewItem, eSourceProvider);
      let objModType = this.getObjModType(aNewItem);
      let comp = libical.icalcomponent_new_from_string(aNewItem.icalString);
      let subcomp = this.vcalendar_add_timezones_get_item(client, comp);

      let modified = libecal.e_cal_client_modify_object_sync(client, subcomp, objModType, null, error.address());

      let detail;
      let nserror;
      if (modified) {
        this.LOG("Modified item " +  aNewItem.title + " " + aNewItem.id);
        this.mObservers.notify("onModifyItem", [aNewItem, aOldItem]);
        nserror = Components.results.NS_OK;
        detail = aNewItem;
      } else {
        detail = "EDS: Error modifying item: " + 
          error.contents.code + " - " +
          error.contents.message.readString();
        glib.g_error_free(error);
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
      }

      this.deleteECalClient(client);
      libical.icalcomponent_free(comp);
      // TODO: should itemcomp be freed
      
      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.MODIFY,
          (modified ? aNewItem.id : null),
          detail);
    },

    // calICalendar
    deleteItem: function deleteItem(aItem, aListener) {
      let error = glib.GError.ptr();
      // FIXME: Check if source exists
      let eSourceProvider = this.getESource.bind(this);
      let client = this.getECalClient(aItem, eSourceProvider);
      let objModType = this.getObjModType(aItem);
      
      let removed = libecal.e_cal_client_remove_object_sync(client, aItem.id, aItem.recurrenceId, objModType, null, error.address());
      let detail;
      let nserror;
      if (!removed) {
        detail = "EDS: Error retrieving items: " + 
          error.contents.code + " - " +
          error.contents.message.readString();
        glib.g_error_free(error);
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
      } else {
        this.LOG("Removed item " +  aItem.title + " " + aItem.id);
        this.mObservers.notify("onDeleteItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;
      }
      
      this.deleteECalClient(client);
      // TODO: should itemcomp be freed
      
      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.DELETE,
          (removed ? aItem.id : null),
          detail);
    },

    // calICalendar
    getItem: function getItem(aId, aListener) {
      let registry = this.getERegistry();
      // FIXME: free g_list
      //      g_list_free_full (list, g_object_unref);
      let sourcesList = libedataserver.e_source_registry_list_sources(registry, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
      var calendarItem = null;
      let error = glib.GError.ptr();
      for (let iter = sourcesList; !iter.isNull(); iter = glib.g_list_next(iter)) {
        // create client for each source
        let source = ctypes.cast(iter.contents.data, libecal.ESource.ptr);
        // FIXME: implement switching the source type
        let client = libecal.e_cal_client_connect_sync(source, 
            libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS,
            null,
            error.address());
        // terminate and go to exception handling
        if (!error.isNull()) {
//          glib.g_free(client);
          break;
        }

        // look for item in every client/calendar
        let item = { id: aId };
        let icalcomponent = this.findItem(client, item);
        if (!icalcomponent.isNull()) {
          let calendar = this.createCalendarFromESource(source);
          calendarItem = this.icalcomponent_to_calendar_item(icalcomponent, calendar);
          libical.icalcomponent_free(icalcomponent);
        }
//        glib.g_free(client);
      }
      
      let nserror;
      if (!error.isNull()){
        this.ERROR("EDS: Error coulndn't retrieve item aId " + 
                  error.contents.code + " - " +
                  error.contents.message.readString());
        glib.g_error_free(error);
        nserror = Components.results.NS_ERROR_FAILURE;
      } else {
        if (calendarItem !== null) { 
          aListener.onGetResult (calendarItem.calendar,
                                 Components.results.NS_OK,
                                 Components.interfaces.calIEvent,
                                 null,
                                 1,
                                 [calendarItem]);
        }
        nserror = Components.results.NS_OK;
      } 
      
      glib.g_list_free_full (sourcesList, glib.g_object_unref);
      
      this.notifyOperationComplete(aListener, nserror, 
                                   Components.interfaces.calIOperationListener.GET,
                                   null, null);
    },
    
    icalcomponent_to_calendar_item: function icalcomponent_to_calendar_item(icalcomponent, calendar) {

      // TODO This is not super since we parse the string again. When
      // lightning moves to using js-ctypes for libical, we can just pass
      // the icalcomponent to the item and have it take what it needs
      let icalstring = libical.icalcomponent_as_ical_string(icalcomponent);
      let item = cal.createEvent(icalstring.readString());
      // Set up the calendar for this item
      item.calendar = calendar;

//      glib.g_free(icalstring);
      
      return item;
    },
  
    createCalendarFromESource : function createCalendarFromESource(source) {
      let localCalendarUri = Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService)
        .newURI("moz-storage-calendar://", null, null);
      // FIXME register calendar, set name
      var calendar = cal.getCalendarManager().createCalendar("storage", localCalendarUri);
      // Using e_source_dup_uid since e_source_get_uid doesn't seem to work
      let sourceId = libecal.e_source_dup_uid(source);
      let id = sourceId.readString();
      calendar.id = id;
      let sourceName = libecal.e_source_get_display_name(source);
      let name = sourceName.readString();
      calendar.name = name;

//      glib.g_free(sourceId);
//      glib.g_free(sourceName);
      
      this.LOG("Created calendar " + calendar.name + " - " + calendar.id);
      return calendar;
    },

    
    /**
     * Obsolete. Do not use!
     */
    glist_to_item_array: function glist_to_item_array(glistptr, calendar) {
        let items = [];
        let current = glistptr;
        while (!current.isNull()) {
            let icomp = ctypes.cast(glistptr.contents.data, libical.icalcomponent.ptr);

            // TODO This is not super since we parse the string again. When
            // lightning moves to using js-ctypes for libical, we can just pass
            // the icalcomponent to the item and have it take what it needs
            let icalstring = libical.icalcomponent_as_ical_string(icomp);
            let item = cal.createEvent(icalstring.readString());

            // Set up the calendar for this item
            item.calendar = calendar;
            items.push(item);
            current = current.contents.next;
        }

        return items;
    },

    // calICalendar
    /**
     * Obsolete. Do not use!
     */
    getItems: function getItems(aItemFilter,
                                    aCount,
                                    aRangeStart,
                                    aRangeEnd,
                                    aListener) {

        let objects = glib.GList.ptr();
        let error = glib.GError.ptr();
        let nserror;
        let query = "#t";
        if (aRangeStart && aRangeEnd) {
            query = '(occur-in-time-range? (make-time"{from}") (make-time"{to}"))'
            query = query.replace("{from}", aRangeStart.icalString);
            query = query.replace("{to}", aRangeEnd.icalString);
        }

        this.LOG("EDS: Query is " + query);

        if (libecal.e_cal_get_object_list(this.ecal, query, objects.address(), error.address())) {
            let items = this.glist_to_item_array(objects, this.superCalendar);
            aListener.onGetResult (this.superCalendar,
                                   Components.results.NS_OK,
                                   Components.interfaces.calIEvent,
                                   null,
                                   items.length,
                                   items);
            nserror = Components.results.NS_OK;
        } else {
            this.ERROR("EDS: Error retrieving items: " + 
                      error.contents.code + " - " +
                      error.contents.message.readString());
            glib.g_error_free(error);
            nserror = Components.results.NS_ERROR_FAILURE;
        }

        libecal.e_cal_free_object_list(objects);

        this.notifyOperationComplete(aListener, nserror, 
                                     Components.interfaces.calIOperationListener.GET,
                                     null, null);
    },
    
    // calICalendar
    endBatch : function endBatch() {
      this.__proto__.__proto__.endBatch.apply(this, arguments);
      if (this.mBatchCount === 0)  {
        this.LOG("Called endbatch");
        this.deleteECalClient(this.mBatchClient);
        this.mBatchClient = null;
        this.mBatchCalendar = null;
      }
    },

    // calICompositeCalendar
    addCalendar : function addCalendar(/*calICalendar*/ aCalendar) {
      let registry = this.getERegistry();
      let source = this.getESource(registry, aCalendar);
      // FIXME: add calendar items
      gobject.g_object_unref(source);
    },
    
    // calICompositeCalendar
    removeCalendar : function removeCalendar(/*calICalendar*/ aCalendar) {
      let error = glib.GError.ptr();
      let registry = this.getERegistry();
      // look for exising calendar
      let source = this.findESource(registry, aCalendar);
      if (source.isNull()) {
        this.WARN("Calendar " + aCalendar.name + " " + aCalendar.id + " doesn't exist. Unable to remove calendar.");
        return;
      }

      // TODO: Shoud items be removed first?
      let removed = libecal.e_source_remove_sync(source, null, error.address());

      if (!error.isNull()) {
        this.ERROR("Couldn't remove calendar " + error.contents.code + " - " +
            error.contents.message.readString());
        glib.g_error_free(error);
      } else {
        this.LOG("Removed calendar " +  aCalendar.name + " " + aCalendar.id);
      }
      gobject.g_object_unref(source);
    },
    
    // calICompositeCalendar
    getCalendarById : function getCalendarById(aId) {
      let registry = this.getERegistry();
      // look for exising calendar
      let source = this.findESourceByCalendarId(registry, aId);
      if (source.isNull()) {
        this.LOG("Couldn't find calendar " + aId);
        return null;
      }
      var calendar = this.createCalendarFromESource(source);
      gobject.g_object_unref(source);
      return calendar;
    },
    
    // calICompositeCalendar
    getCalendars : function getCalendars(count, aCalendars){
      
    },

    // calICompositeCalendar
    defaultCalendar : null,
    // calICompositeCalendar
    prefPrefix : null,

    statusDisplayed : false,
    
    // calICompositeCalendar
    setStatusObserver : function (/*calIStatusObserver*/ aStatusObserver, /*nsIDOMChromeWindow*/ aWindow) {
      throw "Unsupported operation setStatusObserver";
    },
    
    close : function close() {
      this.LOG("Closing EDS Calendar Service");
      this.deleteERegistry();
      libedataserver.shutdown();
      libecal.shutdown();
      libical.shutdown();
      gobject.shutdown();
      gio.shutdown();
      glib.shutdown();
    }
};

var NSGetFactory = XPCOMUtils.generateNSGetFactory([calEDSProvider]);

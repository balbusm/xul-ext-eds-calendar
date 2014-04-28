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
Components.utils.import("resource://edscalendar/exceptions.jsm");
Components.utils.import("resource://edscalendar/utils.jsm");

function calEDSProvider() {
    this.initProviderBase();
    addLogger(this, "calEDSProvider");
    Services.obs.addObserver(this, "quit-application-granted", false);
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
            Components.interfaces.calICompositeCalendar,
            Components.interfaces.nsIObserver
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
                                           Components.interfaces.calICompositeCalendar,
                                           Components.interfaces.nsIObserver
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
    
    checkCDataNotNull : function checkCData(obj) {
      return obj && !obj.isNull();
    },
    
    checkGError : function checkGError(message, error){
      if (!error.isNull()) {
        if (message.length > 0) {
          message += " ";
        }
        message += "(" + error.contents.code + ") " +
          error.contents.message.readString();
        glib.g_error_free(error);
        throw new CalendarServiceException(message);
      }
    },
    
    getERegistry : function getERegistry() {
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
    },
    
    deleteERegistry : function deleteERegistry() {
      if (!this.registry || this.registry.isNull())
        return;
      this.LOG("deleteERegistry: Removing registry " + this.registry.toString());
      gobject.g_object_unref(this.registry);
      this.registry = null;
    },

    findESource : function findESource(registry, calendar) {
      return this.findESourceByCalendarId(registry, calendar.id);
    },

    findESourceByCalendarId : function findESourceByCalendarId(registry, id) {
      // look for exising calendar
      var source = libedataserver.e_source_registry_ref_source(registry, id);
      return source;
    },
    
    /**
     * Returns esource. Remember to call free by g_object_unref()
     */
    getESource : function getESource(registry, calendar) {
      // look for existing calendar
      var source = this.findESource(registry, calendar);
      // do not create new one if calendar exists
      if (source.isNull()) {
        source = this.createESource(calendar, registry);
        this.LOG("Created new source for calendar " + calendar.name + " - " + calendar.id);
      }
      return source;
    },

    createESource : function createESource(calendar, registry) {
      let error = glib.GError.ptr();

      var source = libecal.e_source_new_with_uid(calendar.id, null, error.address());
      this.checkGError("Couldn't create new source:", error);

      libecal.e_source_set_display_name(source, calendar.name);
      libecal.e_source_set_parent(source, "local-stub");
      // TODO add task list support
      this.prepareSourceExtension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
      libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
      this.checkGError("Couldn't commit source:", error);
      
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
      if (item._testItem) 
        sourceType = libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS;
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
      try{
        registry = this.getERegistry();
        source = eSourceProvider(registry, calendar);
        let sourceType = this.getItemSourceType(item);
        
        client = libecal.e_cal_client_connect_sync(source, 
          sourceType,
          null,
          error.address());
        this.checkGError("Couldn't connect to source:", error);
      } catch (e if e instanceof CalendarServiceException) {
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
      }

      return client;
    },
    
    deleteECalClient : function deleteECalClient(client) {
      // keep e cal client when batch is enabled
      if (this.mBatchCount > 0)
        return;
      this.LOG("Removing client");
      if (this.checkCDataNotNull(client)) {
        let source = libedataserver.e_client_get_source(ctypes.cast(client, libedataserver.EClient.ptr));
        this.LOG("deleteECalClient: Removing client " + client.toString());
        gobject.g_object_unref(client);
        if (this.checkCDataNotNull(source)) {
          this.LOG("deleteECalClient: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
      }
    },

    findItem : function findItem(client, item) {
      let error = glib.GError.ptr();
      var icalcomponent = libical.icalcomponent.ptr();

      let found = libecal.e_cal_client_get_object_sync(client, item.id, null, icalcomponent.address(), null, error.address());
      // Ignore error code 1, it is raised when item doesn't exist
      if (!found && !error.isNull()) {
        if (error.contents.code != 1) {
          this.checkGError("Couldn't find item:", error);
        } else {
          glib.g_error_free(error);
        }
      }
      return icalcomponent;
    },
    
    getObjModType : function getObjModType(item) {
      var objModType;
      if (item.recurrenceId) {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_THIS;
      } else {
        objModType = libecal.ECalObjModType.E_CAL_OBJ_MOD_ALL;
      }
      return objModType;
    },

    vcalendarAddTimezonesGetItem: function vcalendarAddTimezonesGetItem(client, comp) {
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
          break;
        }
        subcomp = libical.icalcomponent_get_next_component(comp, libical.icalcomponent_kind.ICAL_ANY_COMPONENT);
      }

      return itemcomp;
    },
    
    retrieveRecurrenceItems : function retrieveRecurrenceItems(item) {
      let count = {};
      // get parent item
      var recurrenceItems = [ item ];
      // get recurrenceItems
      if (item.recurrenceInfo) {
        let recurrenceIds = item.recurrenceInfo.getExceptionIds(count);
        for (let recurreneId of recurrenceIds) {
          recurrenceItems.push(item.recurrenceInfo.getExceptionFor(recurreneId));
        }
      }
      return recurrenceItems;
    },
    
    modifySingleItem : function modifySingleItem(item) {

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
      subcomp = this.vcalendarAddTimezonesGetItem(client, comp);
  
      modified = libecal.e_cal_client_modify_object_sync(client, subcomp, objModType, null, error.address());
      this.checkGError("Error modifying item:", error);
      return modified;
  
      } finally {
        if (this.checkCDataNotNull(client)) {
          this.deleteECalClient(client);
        }
        if (this.checkCDataNotNull(comp)) {
          libical.icalcomponent_free(comp);
        }
      }
    },
    
    // calICalendar
    adoptItem : function adoptItem(aItem, aListener) {
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
        this.LOG("Given icalString " + aItem.icalString);
        uid = glib.gchar.ptr();
  
        itemcomp = this.vcalendarAddTimezonesGetItem(client, comp);
  
        created = libecal.e_cal_client_create_object_sync(client, itemcomp, uid.address(), null, error.address());
        this.checkGError("Error adding item:", error);
        
        // notify obeservers that given item has been synchronized
        this.LOG("Created new EDS item " + aItem.title + " - " + aItem.id);
        this.mObservers.notify("onAddItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;
      
      } catch (e if e instanceof CalendarServiceException) {
        nserror = Components.results.NS_ERROR_FAILURE;
        detail = e.message;
        this.ERROR(detail);
        this.ERROR(e.stack);
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

    },

    // calICalendar
    addItem: function addItem(aItem, aListener) {
        return this.adoptItem(aItem.clone(), aListener);
    },

    // calICalendar
    modifyItem: function modifyItem(aNewItem, aOldItem, aListener) {
      var detail;
      var nserror;
      let modified;
      
      try {
        let oldRecurrenceItems = this.retrieveRecurrenceItems(aOldItem);
        let newRecurrenceItems = this.retrieveRecurrenceItems(aNewItem);
        // TODO put it to separate method
        let itemsDiffFilter = { 
            // array filter implementation
            diffRecurrenceItems : function diffRecurrenceItems(recurrenceItem) {
              for(contentItem of this.content) {
                if (this.sameRecurrenceItems(contentItem, recurrenceItem)) {
                  // filter out item
                  return false;
                }
              }
              // keep item
              return true;
            },
            
            sameRecurrenceItems : function sameRecurrenceItems(itemA, itemB) {
              if (itemA.recurrenceId && itemB.recurrenceId) {
                if (itemA.recurrenceId.icalString == itemB.recurrenceId.icalString) {
                  return true;
                }
              } else if (itemA.recurrenceId || itemB.recurrenceId) {
                return false;
              } else if (itemA.id === itemB.id) {
                return true;
              }
              return false;
            },
        };
        
        itemsDiffFilter.content = newRecurrenceItems;
        let removedRecurrences = oldRecurrenceItems.filter(itemsDiffFilter.diffRecurrenceItems, itemsDiffFilter);
        
        itemsDiffFilter.content = removedRecurrences;
        let modifiedRecurrences = newRecurrenceItems.filter(itemsDiffFilter.diffRecurrenceItems, itemsDiffFilter);
        
        for (let removedRecurrence of removedRecurrences) {
          // this could have better listener handling
          this.deleteItem(removedRecurrence, aListener);
        }
        
        for (let modifiedRecurrence of modifiedRecurrences) {
          modified = this.modifySingleItem(modifiedRecurrence);
        }
        
        this.LOG("Modified item " +  aNewItem.title + " " + aNewItem.id);
        this.mObservers.notify("onModifyItem", [aNewItem, aOldItem]);
        nserror = Components.results.NS_OK;
        detail = aNewItem;

      } catch (e if e instanceof CalendarServiceException) {
        detail = e.message;
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
      } 

      this.notifyOperationComplete(aListener,
          nserror,
          Components.interfaces.calIOperationListener.MODIFY,
          (modified ? aNewItem.id : null),
          detail);
    },

    // calICalendar
    deleteItem: function deleteItem(aItem, aListener) {
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
        this.LOG("Removing aItem.id " + aItem.id, + " objModType " + objModType + " rid " + rid);
        removed = libecal.e_cal_client_remove_object_sync(client, aItem.id, rid, objModType, null, error.address());
        this.checkGError("Error removing item:", error);
  
        this.LOG("Removed item " +  aItem.title + " " + aItem.id);
        this.mObservers.notify("onDeleteItem", [aItem]);
        nserror = Components.results.NS_OK;
        detail = aItem;

      } catch (e if e instanceof CalendarServiceException) {
        detail = e.message;
        nserror = Components.results.NS_ERROR_FAILURE;
        this.ERROR(detail);
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
    },

    // calICalendar
    getItem: function getItem(aId, aListener) {
      var nserror;
      var detail = null;
      
      let error = glib.GError.ptr();
      let registry;
      let sourcesList;
      var calendarItem = null;
      // TODO this method needs refactoring
      try {
        registry = this.getERegistry();
        sourcesList = libedataserver.e_source_registry_list_sources(registry, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
        for (let iter = sourcesList; !iter.isNull(); iter = glib.g_list_next(iter)) {
          let client;
          let icalcomponent;
          try {
            // create client for each source
            let source = ctypes.cast(iter.contents.data, libecal.ESource.ptr);
            if (!libedataserver.e_source_registry_check_enabled(registry, source)) {
              continue;
            }
            // FIXME: implement switching the source type
            client = libecal.e_cal_client_connect_sync(source, 
                libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS,
                null,
                error.address());
            this.checkGError("Couldn't connect to source:", error);
            
            // look for item in every client/calendar
            let item = { id: aId };
            let icalcomponent = this.findItem(client, item, error);
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
          aListener.onGetResult (calendarItem.calendar,
                                 Components.results.NS_OK,
                                 Components.interfaces.calIEvent,
                                 null,
                                 1,
                                 [calendarItem]);
        }
        nserror = Components.results.NS_OK;
        
      } catch (e if e instanceof CalendarServiceException) {
        nserror = Components.results.NS_ERROR_FAILURE;        
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(sourcesList)) {
          this.LOG("getItem: Removing source list " + sourcesList.toString());
          glib.g_list_free_full (sourcesList, gobject.g_object_unref);
        }
      }
      
      this.notifyOperationComplete(aListener, nserror, 
                                   Components.interfaces.calIOperationListener.GET,
                                   null, detail);
    },
    
    icalcomponentToCalendarItem: function icalcomponentToCalendarItem(icalcomponent, calendar) {

      // TODO This is not super since we parse the string again. When
      // lightning moves to using js-ctypes for libical, we can just pass
      // the icalcomponent to the item and have it take what it needs
      let icalstring = libical.icalcomponent_as_ical_string(icalcomponent);
      let item = cal.createEvent(icalstring.readString());
      // Set up the calendar for this item
      item.calendar = calendar;

      glib.g_free(icalstring);
      
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
      let sourceName = libecal.e_source_dup_display_name(source);
      let name = sourceName.readString();
      calendar.name = name;

      glib.g_free(sourceId);
      glib.g_free(sourceName);
      
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
        if (this.mBatchClient !== null) {
          this.deleteECalClient(this.mBatchClient);
        }
        this.mBatchClient = null;
        this.mBatchCalendar = null;
      }
    },

    // calICompositeCalendar
    addCalendar : function addCalendar(/*calICalendar*/ aCalendar) {
      let registry;
      let source;
      try {
        registry = this.getERegistry();
        source = this.getESource(registry, aCalendar);
        // FIXME: add calendar items
      } finally {
        if (this.checkCDataNotNull(source)) {
          this.LOG("addCalendar: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
      }
    },
    
    // calICompositeCalendar
    removeCalendar : function removeCalendar(/*calICalendar*/ aCalendar) {
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
        let removed = libecal.e_source_remove_sync(source, null, error.address());
        this.checkGError("Couldn't remove calendar:", error);
        this.LOG("Removed calendar " +  aCalendar.name + " " + aCalendar.id);
        // FIXME: add notification
        
      } catch (e if e instanceof CalendarServiceException) {
//        nserror = Components.results.NS_ERROR_FAILURE;        
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(source)) {
          this.LOG("removeCalendar: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
      }

    },
    
    // calICompositeCalendar
    getCalendarById : function getCalendarById(aId) {
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
      } catch (e if e instanceof CalendarServiceException) {
//        nserror = Components.results.NS_ERROR_FAILURE;        
        detail = e.message;
        this.ERROR(detail);
      } finally {
        if (this.checkCDataNotNull(source)) {
          this.LOG("getCalendarById: Removing source " + source.toString());
          gobject.g_object_unref(source);
        }
      }
      return calendar;
    },
    
    // calICompositeCalendar
    getCalendars : function getCalendars(count, aCalendars){
      // TODO: implement
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
    
    // nsIObserver
    observe : function (aSubject, aTopic, aData) {
      if (aTopic === "quit-application-granted") {
        Services.obs.removeObserver(this, "quit-application-granted");
        this.shutdown();
      }
    },
    
    shutdown : function shutdown() {
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

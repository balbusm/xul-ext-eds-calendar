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

var edsCalendarService = {

    setupCalendar : function edsCalendarService_setupCalendar() {
      // TODO: Add cache?
      // get all the items from all calendars and add them to EDS
      for (let aCalendar of cal.getCalendarManager().getCalendars({})) {
        aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, this.calendarGetListener);
      }

      // setting up listeners etc
      if (this.calendar === null) {
        this.calendar = getCompositeCalendar();
      }
      if (this.calendar) {
        this.calendar.removeObserver(this.calendarObserver);
        this.calendar.addObserver(this.calendarObserver);
      }
      if (this.mListener) {
        this.mListener.updatePeriod();
      }
    },

    calendarGetListener : {
      onOperationComplete : function listener_onOperationComplete(calendar, status, optype, id, detail) { 
        if (!Components.isSuccessCode(status)) {
        return;
      }
        // make sure that calendar has been created
        // when there are no items on a list
        let registry = edsCalendarService.createERegistry();
        edsCalendarService.getESource(registry, calendar);
      },
      onGetResult : function listener_onGetResult(calendar, status, itemtype, detail, count, items) {
        if (!Components.isSuccessCode(status)) {
          return;
        }
        edsCalendarService.addEvents(calendar, items);
      }
    },

    createERegistry : function createERegistry() {
      let error = glib.GError.ptr();

      let registry = libedataserver.e_source_registry_new_sync(null, error.address());
      if (!error.isNull())
      {
        edsCalendarService.debug("Couldn't get source registry " + error.contents.code + " - " +
            error.contents.message.readString());
        return null;
      }
      return registry;
    },

    findESource : function findESource(registry, calendar) {
      // look for exising calendar
      let source = libedataserver.e_source_registry_ref_source(registry, calendar.id);
      return source;
    },
    
    getESource : function getESource(registry, calendar) {
      // look for exising calendar
      let source = edsCalendarService.findESource(registry, calendar);
      // do not create new one if calendar exists
      if (source.isNull()) {
        source = edsCalendarService.createESource(calendar, registry);
        edsCalendarService.debug("Created new source");
      }
      return source;
    },

    createESource : function createESource(calendar, registry) {
      let error = glib.GError.ptr();

      let source = libecal.e_source_new_with_uid(calendar.id, null, error.address());
      if (!error.isNull())
      {
        edsCalendarService.debug("Couldn't create new source " + error.contents.code + " - " +
            error.contents.message.readString());
        return null;
      }
      let sourceExtension = libecal.e_source_get_extension(source, libedataserver.ESourceCalendar.E_SOURCE_EXTENSION_CALENDAR);
      libecal.e_source_set_display_name(source, calendar.name);
      libecal.e_source_set_parent(source, "local-stub");
      libedataserver.e_source_backend_set_backend_name(ctypes.cast(sourceExtension,libedataserver.ESourceBackend.ptr), "local");
      let sourceCreated  = libedataserver.e_source_registry_commit_source_sync(registry, source, null, error.address());
      if (!sourceCreated || !error.isNull())
      {
        edsCalendarService.debug("Couldn't commit source " + error.contents.code + " - " +
            error.contents.message.readString());
        return null;
      }
      return source;

    },

    getECalClient: function getECalClient(calendar, eSourceProvider) {
      let error = glib.GError.ptr();
      let registry = edsCalendarService.createERegistry();
      let source = eSourceProvider(registry, calendar);
      let client = libecal.e_cal_client_connect_sync(source, 
          libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS,
          null,
          error.address());
      if (!error.isNull())
      {
        edsCalendarService.debug("Couldn't open source " + error.contents.code + " - " +
            error.contents.message.readString());
        return null;
      }

      return client;
    },

    findItem : function findItem(client, item) {
      let error = glib.GError.ptr();
      let icalcomponent = libical.icalcomponent.ptr();

      let found = libecal.e_cal_client_get_object_sync(client, item.id, null, icalcomponent.address(), null, error.address());
      // FIXME remove icalcomponent reference
      return icalcomponent;
    },

    addEvents: function addEvents(calendar, items) {
      edsCalendarService.debug("Adding events for calendar " + calendar.name + " - " + calendar.id);
      let client = edsCalendarService.getECalClient(calendar, edsCalendarService.getESource);
      if (client !== null) {
        for (let item of items) {
          edsCalendarService.debug("Processing item " + item.title + " - " + item.id);
          edsCalendarService.addEvent(client, item);
        }

      }
    },

    addEvent : function addEvent(client, item) {
      let error = glib.GError.ptr();
      let icalcomponent = edsCalendarService.findItem(client, item);
      // item exists in calendar, do not add it
      if (!icalcomponent.isNull()) {
        edsCalendarService.debug("Skipping item: " + item.title + " - " + item.id);
        return;
      }
      // get_object raises error when item is not found
      // clean pointer
      // glib.g_free(error);
      error.value = null;

      let comp = libical.icalcomponent_new_from_string(item.icalString);
      let uid = glib.gchar.ptr();

      let itemcomp = this.vcalendar_add_timezones_get_item(client, comp);

      let created = libecal.e_cal_client_create_object_sync(client, itemcomp, uid.address(), null, error.address());
      if (!created || !error.isNull()) {
      edsCalendarService.debug("Couldn't create calendar object " + error.contents.code + " - " +
          error.contents.message.readString());
      }

      edsCalendarService.debug("Created new EDS item " + item.title + " - " + item.id);

    },

    deleteCalendar: function edsCalendarService_deleteCalendar(calendar) {
      let error = glib.GError.ptr();
      let registry = edsCalendarService.createERegistry();
      // look for exising calendar
      let source = edsCalendarService.findESource(registry, calendar);
      if (source.isNull()) {
        edsCalendarService.debug("Calendar " + calendar.name + " " + calendar.id + " doesn't exist. Unable to remove calendar.");
        return;
      }

      let removed = libecal.e_source_remove_sync(source, null, error.address());

      if (!error.isNull()) {
        edsCalendarService.debug("Couldn't remove calendar " + error.contents.code + " - " +
            error.contents.message.readString());
        return;
      }
      edsCalendarService.debug("Removed calendar " +  calendar.name + " " + calendar.id);
    },


    deleteEvent: function deleteEvent(calendar, item) {
      let error = glib.GError.ptr();

      let client = edsCalendarService.getECalClient(calendar, edsCalendarService.findESource);

      let removed = libecal.e_cal_client_remove_object_sync(client, item.id, item.recurrenceId, libecal.ECalObjModType.E_CAL_OBJ_MOD_ALL, null, error.address());

      if (!removed)
      {
        edsCalendarService.debug("Couldn't remove item " + error.contents.code + " - " +
            error.contents.message.readString());
        return;
      }
      edsCalendarService.debug("Removed item " +  item.title + " " + item.id);

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

    init: function() { 
      glib.init();
      gio.init();
      libical.init();
      libecal.init();
      libedataserver.init();
      this.setupCalendar();
    },

    uninit: function() {
      libedataserver.shutdown();
      libecal.shutdown();
      libical.shutdown();
      gio.shutdown();
      glib.shutdown();
    },

    debug: function (aMessage) {
      var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
      .getService(Components.interfaces.nsIConsoleService);
      consoleService.logStringMessage("Evolution Mirror Extension (" + new Date() + " ):\n\t" + aMessage);
      window.dump("Evolution Mirror Extension: (" + new Date() + " ):\n\t" + aMessage + "\n");
    }
};

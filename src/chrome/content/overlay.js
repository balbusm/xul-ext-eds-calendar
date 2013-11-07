var edsCalendar = {
	
	setupCalendar : function edsCalendar_setupCalendar() {
	  //First run stuff
//		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
//                        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.edscalendar.");
//		var firstrun = prefs.getBoolPref("firstrun");
		
//		prefs.setBoolPref("firstrun", false);
	    // TODO: Add cache?
			//get all the items from all calendars and add them to EDS
			for (let aCalendar of cal.getCalendarManager().getCalendars({})) {
				aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, this.calendarGetListener);
			}
	
		// setting up listeners etc
		if (this.calendar == null) {
			this.calendar = cal.getCompositeCalendar();
		}
		if (this.calendar) {
			this.calendar.removeObserver(this.calendarObserver);
		}
		this.calendar.addObserver(this.calendarObserver);
		if (this.mListener) {
			this.mListener.updatePeriod();
		}
    },
	
	calendarGetListener : {
	  onOperationComplete : function listener_onOperationComplete(calendar, status, optype, id, detail) { 
	    // TODO add calendar when no result returned
	    ;
	  },
		onGetResult : function listener_onGetResult(calendar, status, itemtype, detail, count, items) {
			if (!Components.isSuccessCode(status)) {
				return;
			}
			  edsCalendar.addEvents(calendar, items);
			}
	},
	
	calendarObserver : {
		QueryInterface : function edsCalendar_QI(aIID) {
			if (!aIID.equals(Components.interfaces.calIObserver) &&
				!aIID.equals(Components.interfaces.calICompositeObserver) &&
				!aIID.equals(Components.interfaces.nsISupports)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		
		onAddItem : function edsCalendar_onAddItem(item) {
			debugger;
		  edsCalendar.addEvents(item.calendar, [item]);
			
		},
		
		onDeleteItem : function edsCalendar_onDeleteItem(item, rebuildFlag) {
			edsCalendar.deleteEvent(item);
			
		},
		
		onModifyItem : function edsCalendar_onModifyItem(newItem, oldItem) {
			edsCalendar.deleteEvent(oldItem);
			
			edsCalendar.addEvent(newItem);
			
		},
		
		onCalendarAdded : function edsCalendar_calAdd(aCalendar) {
		  debugger;
		  //This is called when a new calendar is added.
			//We can get all the items from the calendar and add them one by one to Evolution Data Server
			aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, edsCalendar.calendarGetListener);
		},
		
		onCalendarRemoved : function edsCalendar_calRemove(aCalendar) {
	
			var getListener = {
		
				onOperationComplete: function(aCalendar, aStatus, aOperationType, aId, aDetail) { },
		
				onGetResult: function(aCalendar, aStatus, aItemType, aDetail, aCount, aItems) {
					for each (item in aItems) {
						edsCalendar.deleteEvent(item);
					}
				}
			};
	
			aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, getListener);
		},
		
		onStartBatch : function edsCalendar_onStartBatch() {
			this.mBatchCount++;
		},
		
		onEndBatch : function() {
			this.mBatchCount--;
			if (this.mBatchCount == 0) {
				edsCalendar.refreshCalendarQuery();
			}
		},
		
		onError : function() { },
		onPropertyChanged : function() { },
		onPropertyDeleting : function() { },
		onDefaultCalendarChanged : function() { },
		onLoad : function() { }
	},
	
	createESource : function createESource(calendar, registry) {
		let error = glib.GError.ptr();
		
		let source = libecal.e_source_new_with_uid(calendar.id, null, error.address());
		if (!error.isNull())
		{
			edsCalendar.debug("Couldn't create new source " + error.contents.code + " - " +
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
			edsCalendar.debug("Couldn't commit source " + error.contents.code + " - " +
					error.contents.message.readString());
			return null;
		}
		return source;

	},
	
	createEdsClient: function createEdsClient(calendar) {
		let error = glib.GError.ptr();
		registry = libedataserver.e_source_registry_new_sync(null, error.address());
		if (!error.isNull())
		{
			edsCalendar.debug("Couldn't get source registry " + error.contents.code + " - " +
					error.contents.message.readString());
			return null;
		}
		// look for exising calendar
		let source = libedataserver.e_source_registry_ref_source(registry, calendar.id);
		// do not create new one if calendar exists
		if (source.isNull()) {
			source = edsCalendar.createESource(calendar, registry);
			edsCalendar.debug("Created new source");
		}
		
		client = libecal.e_cal_client_connect_sync(source, 
				libecal.ECalClientSourceType.E_CAL_CLIENT_SOURCE_TYPE_EVENTS,
				null,
				error.address());
		if (!error.isNull())
		{
			edsCalendar.debug("Couldn't open source " + error.contents.code + " - " +
					error.contents.message.readString());
			return null;
		}

		return client;
	},
	
	addEvents: function addEvents(calendar, items) {
	  edsCalendar.debug("Adding events for calendar " + calendar.name + " - " + calendar.id);
    let client = edsCalendar.createEdsClient(calendar);
		if (client != null) {
			for (let item of items) {
	      edsCalendar.debug("Processing item " + item.title + " - " + item.id);
			  edsCalendar.addEvent2(client, item);
			}
			
		}
	},
	
	addEvent2 : function addEvent2(client, item) {
		let error = glib.GError.ptr();
		let error2 = glib.GError.ptr();
    
		let icalcomponent = libical.icalcomponent.ptr();
		let found = libecal.e_cal_client_get_object_sync(client, item.id, null, icalcomponent.address(), null, error.address());
		// item exists in calendar, do not add it
		if (found) {
		  edsCalendar.debug("Skipping item: " + item.title + " - " + item.id);		  
		  return;
		}
		let comp = libical.icalcomponent_new_from_string(item.icalString);
		let uid = glib.gchar.ptr();
		
		let itemcomp = this.vcalendar_add_timezones_get_item(client, comp);
		
		let created = libecal.e_cal_client_create_object_sync(client, itemcomp, uid.address(), null, error2.address());
		if (!created || !error2.isNull()) {
      edsCalendar.debug("Couldn't create calendar object " + error2.contents.code + " - " +
          error2.contents.message.readString());
		}
		  
		edsCalendar.debug("Created new EDS item " + item.title + " - " + item.id);
		
	},
	
	addEvent: function (item) {
	  edsCalendar.debug("Using deprecated addEvent for item: " + item.title + " - " + item.id);
	  let comp = libical.icalcomponent_new_from_string(item.icalString);
		let uid = glib.gchar.ptr();
		let error = glib.GError.ptr();
		let error2 = glib.GError.ptr();
		
		// TODO If evolution has never been run, opening the system calendar fails.
        if (libecal.e_cal_open(ecalClient, true, error.address())) { } else {
			edsCalendar.debug("Error opening EDS Calendar: " + 
					error.contents.code + " - " +
					error.contents.message.readString());;
		}

		let itemcomp = this.vcalendar_add_timezones_get_item(comp);
		rc = libecal.e_cal_client_create_object_sync(ecalClient, itemcomp, uid.address(), error2.address());
			
	},
	
	deleteEvent: function deleteEvent(item) {
		let error = glib.GError.ptr();
		let error2 = glib.GError.ptr();
		this.ecal = libecal.e_cal_new_system_calendar();
		
		// TODO If evolution has never been run, opening the system calendar fails.
        if (libecal.e_cal_open(this.ecal, true, error.address())) { } else {
			edsCalendar.debug("Error opening EDS Calendar: " + 
					error.contents.code + " - " +
					error.contents.message.readString());;
		}

		rc = libecal.e_cal_remove_object(this.ecal, item.id, error2.address());
		
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

window.addEventListener("load", function() {edsCalendar.init()}, false);
window.addEventListener("unload", function() {edsCalendar.uninit()}, false);

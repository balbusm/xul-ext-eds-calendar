
Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

var edsCalendarClient = {
    
    calendar : null,
    
    init : function int() {
      debugger;
      addLogger(this, "edsCalendarClient");
      this.edsCalendarService = Components.classes["@mozilla.org/calendar/calendar;1?type=eds"].getService(Components.interfaces.calICompositeCalendar);
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

    },
    
    uninit : function uninit() {
      // FIXME: close calendar service
      //      this.edsCalendarService.unint();
    },
    
    calendarGetListener : {
      onOperationComplete : function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetai) { 
        if (!Components.isSuccessCode(aStatus)) {
        return;
      }
        // make sure that calendar has been created
        // when there are no items on a list
        edsCalendarClient.edsCalendarService.addCalendar(aCalendar);
//        let registry = this.edsCalendarService.createERegistry();
//        this.edsCalendarService.getESource(registry, calendar);
      },
      onGetResult : function listener_onGetResult(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
        if (!Components.isSuccessCode(aStatus)) {
          return;
        }
        edsCalendarClient.LOG("Adding events for calendar " + aCalendar.name + " - " + aCalendar.id);
        edsCalendarClient.edsCalendarService.startBatch();
        for (let item of aItemscalendar) {
          edsCalendarClient.LOG("Processing item " + item.title + " - " + item.id);
          edsCalendarClient.edsCalendarService.addItem(item, edsCalendarClient.calendarChangeListener);
        }
        edsCalendarClient.edsCalendarService.endBatch();
      }
    },
    
    calendarChangeListener : {
      onOperationComplete : function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetai) { 
        if (!Components.isSuccessCode(aStatus)) {
          edsCalendarClient.ERROR("Couldn't change item " + item.title + " - " + item.id);
          return;
      }
        this.LOG("Changed item " + item.title + " - " + item.id);
        
      },
      onGetResult : function listener_onGetResult(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
        throw "Unexpected operation";
      }
    },
    
    calendarObserver : {
      QueryInterface : function QueryInterface(aIID) {
        if (!aIID.equals(Components.interfaces.calIObserver) &&
            !aIID.equals(Components.interfaces.calICompositeObserver) &&
            !aIID.equals(Components.interfaces.nsISupports)) {
          throw Components.results.NS_ERROR_NO_INTERFACE;
        }
        return this;
      },
      
      // calIObserver
      onAddItem : function onAddItem(aItem) {
        debugger;
        this.edsCalendarService.addItem(aItem, this.calendarChangeListener);
        
      },

      // calIObserver
      onDeleteItem : function onDeleteItem(aItem) {
        debugger;
        this.edsCalendarService.deleteItem(item, this.calendarChangeListener);
      },

      // calIObserver
      onModifyItem : function onModifyItem(aNewItem, aOldItem) {
        debugger;
        this.edsCalendarService.modifyItem(aNewItem, aOldItem, this.calendarChangeListener);
      },

      // calICompositeObserver
      onCalendarAdded : function onCalendarAdded(aCalendar) {
        debugger;
        // This is called when a new calendar is added.
        // We can get all the items from the calendar and add them one by one to
        // Evolution Data Server
        aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, edsCalendarClient.calendarGetListener);
      },

      // calICompositeObserver
      onCalendarRemoved : function onCalendarRemoved(aCalendar) {
        debugger;
        this.edsCalendarService.removeCalendar(aCalendar);
      },

      // calIObserver
      onStartBatch : function onStartBatch() {
        this.mBatchCount++;
      },

      // calIObserver
      onEndBatch : function onEndBatch() {
        this.mBatchCount--;
        if (this.mBatchCount === 0) {
          this.edsCalendarService.refreshCalendarQuery();
        }
      },

      onError : function onError() { },
      onPropertyChanged : function onPropertyChanged() { },
      onPropertyDeleting : function onPropertyDeleting() { },
      onDefaultCalendarChanged : function onDefaultCalendarChanged() { },
      onLoad : function onLoad() { }
    }

};

window.addEventListener("load", function() {edsCalendarClient.init();}, false);
window.addEventListener("unload", function() {edsCalendarClient.uninit();}, false);

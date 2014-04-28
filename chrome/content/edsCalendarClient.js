
Components.utils.import("resource://calendar/modules/calUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

Components.utils.import("resource://edscalendar/utils.jsm");

var edsCalendarClient = {
    
    calendar : null,
    
    init : function int() {
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
    
    operationTypeToString : function operationTypeToString(operationType) {
      let result;
      switch(operationType) {
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

    calendarGetListener : {
      onOperationComplete : function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) { 
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
      onGetResult : function listener_onGetResult(aCalendar, aStatus, aItemType, aDetail, aCount, aItemscalendar) {
        if (!Components.isSuccessCode(aStatus)) {
          edsCalendarClient.ERROR("Unable to get results for calendar " + aCalendar.name + " - " + aCalendar.id +
              ". " + aStatus + " - " + aDetail);
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
      onOperationComplete : function listener_onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) { 
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
        edsCalendarClient.edsCalendarService.addItem(aItem, this.calendarChangeListener);
        
      },

      // calIObserver
      onDeleteItem : function onDeleteItem(aItem) {
        debugger;
        edsCalendarClient.edsCalendarService.deleteItem(aItem, this.calendarChangeListener);
      },

      // calIObserver
      onModifyItem : function onModifyItem(aNewItem, aOldItem) {
        debugger;
        edsCalendarClient.edsCalendarService.modifyItem(aNewItem, aOldItem, this.calendarChangeListener);
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
        edsCalendarClient.edsCalendarService.removeCalendar(aCalendar);
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

      onError : function onError() { ; },
      onPropertyChanged : function onPropertyChanged() { ; },
      onPropertyDeleting : function onPropertyDeleting() { ; },
      onDefaultCalendarChanged : function onDefaultCalendarChanged() { ; },
      onLoad : function onLoad() { ; }
    }

};

window.addEventListener("load", function() {edsCalendarClient.init();}, false);

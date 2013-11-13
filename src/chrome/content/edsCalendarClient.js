
var edsCalendarClient = {
    
    init : function int() {
      edsCalendarService.init();
      edsCalendarService.setupCalendar();
    },
    
    uninit : function uninit() {
      edsCalendarService.unint();
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
      
      onAddItem : function onAddItem(item) {
        debugger;
        edsCalendarService.addEvents(item.calendar, [item]);
        
      },

      onDeleteItem : function onDeleteItem(item, rebuildFlag) {
        debugger;
        edsCalendarService.deleteEvent(item.calendar, item);

      },

      onModifyItem : function onModifyItem(newItem, oldItem) {
        // TODO: Modify event instead of removing it
        edsCalendarService.deleteEvent(oldItem.calendar, oldItem);

        edsCalendarService.addEvents(newItem.calendar, [newItem]);

      },

      onCalendarAdded : function onCalendarAdded(aCalendar) {
        debugger;
        // This is called when a new calendar is added.
        // We can get all the items from the calendar and add them one by one to
      // Evolution Data Server
        aCalendar.getItems(Components.interfaces.calICalendar.ITEM_FILTER_ALL_ITEMS, 0, null, null, edsCalendarService.calendarGetListener);
      },

      onCalendarRemoved : function onCalendarRemoved(aCalendar) {
        debugger;
        edsCalendarService.deleteCalendar(aCalendar);
      },

      onStartBatch : function onStartBatch() {
        this.mBatchCount++;
      },

      onEndBatch : function onEndBatch() {
        this.mBatchCount--;
        if (this.mBatchCount === 0) {
          edsCalendarService.refreshCalendarQuery();
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

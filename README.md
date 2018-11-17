# ioBroker.scriptlibrary
Script library for usage in ioBroker, content :



# {OpenHab_Object_sync.js} OpenHab object state syncronisation 
Script to syncronise object states from iObroker with OpenHab.
Capabilities :

- Syncronise values from iObroker to OpenHab when new items are created
- react on changes in openhab and syncronize values to iobroker (for example for usage with GoogleHome)
- react on changes in iobroker and syncronise states to OpenHab
- prevent bouncing of value updates between the systems as some values are rounde in origin or target

ToDo :

- automated creation of item file from iObroker to OpenHab
- better handling of items with special characters (OpenHab only supports "_")

Please feel free to provide a pull request for improvement or issue to be taken care off !

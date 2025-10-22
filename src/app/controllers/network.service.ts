import { Injectable, NgZone } from '@angular/core';
import { Network, ConnectionStatusChangeListener, ConnectionStatus } from '@capacitor/network';

@Injectable({
    providedIn: 'root',
})

export class NetworkService {

    constructor(private readonly ngZone: NgZone) { }

    /** Clean up the network listeners. */
    ngOnDestroy(): void {
        Network.removeAllListeners();
    }

    /**
     * Add a listener to the network monitor.
     * 
     * The listener is immediately called with the current status.
     * 
     * @param useZone True if the callback should run in the Angular zone, false otherwise.
     * @param listenerCallback The function to be called when network events occur.
     */
    async addListener(useZone: boolean, listenerCallback: ConnectionStatusChangeListener) {
        const status = await Network.getStatus();
        const listener = useZone ? (status: ConnectionStatus) => this.ngZone.run(() => listenerCallback(status)) : listenerCallback;
        Network.addListener("networkStatusChange", listener);
        listener(status);
    }
}




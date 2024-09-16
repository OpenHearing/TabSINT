import { Injectable } from '@angular/core';
import { Logger } from '../../utilities/logger.service';
import { TympanInterface, MyTympanInterface } from './tympan.interface';

@Injectable({
    providedIn: 'root',
})

export class TympanModel {

    myTympans: MyTympanInterface = {
        
    }


    constructor() {}

    getMyTympans(): MyTympanInterface {
        return this.myTympans;
    }

}




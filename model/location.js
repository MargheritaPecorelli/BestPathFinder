class Location {
    
    // `informazioni` (`IdInfo`, `Nome`, `Descrizione`, `Posti`)
    constructor(locName, locDescription, locRoomNumber, locLevel, locFloor, locBlock, locSeats) {
        this.myName = locName;
        this.myDescription = locDescription;
        this.myRoomNumber = locRoomNumber;
        this.myLevel = locLevel;
        this.myFloor = locFloor;
        this.myBlock = locBlock;
        this.mySeats = locSeats;
    }
  
    name() {
        return this.myName;
    }
    
    description() {
        return this.myDescription;
    }

    roomNumber() {
        return this.myRoomNumber;
    }

    level() {
        return this.myLevel;
    }

    floor() {
        return this.myFloor;
    }

    block() {
        return this.myBlock;
    }

    seats() {
        return this.mySeats;
    }
}

 module.exports = Location;

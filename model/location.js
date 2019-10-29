class Location {

    constructor(locName, locClassroom, locRoom, locFloor, locLevel, locBlock) {
        this.myName = locName;
        this.myClassroom = locClassroom;
        this.myRoom = locRoom;
        this.myFloor = locFloor;
        this.myLevel = locLevel;
        this.myBlock = locBlock;
    }
  
    name() {
        // return `the location name is ${this.myName}`;
        return this.myName;
    }
    
    classroom() {
        return this.myClassroom;
    }

    room() {
        return this.myRoom;
    }

    floor() {
        return this.myFloor;
    }

    level() {
        return this.myLevel;
    }

    block() {
        return this.myBlock;
    }

    path() {
        return 'this is location path';
    }

    portionWithMoreFreePlaces() {
        return 'this is location free places';
    }

}

 module.exports = Location;

class Location {

    // var name;

    constructor(locName) {
        this.myName = locName;
    }
  
    name() {
        return `the location name is ${this.myName}`;
    }
    
    classroom() {
        return 'this is location classroom';
    }

    room() {
        return 'this is location room';
    }

    floor() {
        return 'this is location floor';
    }

    level() {
        return 'this is location level';
    }

    block() {
        return 'this is location block';
    }

    path() {
        return 'this is location path';
    }

    portionWithMoreFreePlaces() {
        return 'this is location free places';
    }

}

 module.exports = Location;
